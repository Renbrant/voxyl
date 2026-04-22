import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [autoplay, setAutoplay] = useState(true);
  const [playerMinimized, setPlayerMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [finishedUrls, setFinishedUrls] = useState(new Set());
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const audioRef = useRef(null);
  const playNextRef = useRef(null);
  const playPrevRef = useRef(null);
  const playInitiatedRef = useRef(false);
  const currentEpisodeRef = useRef(null);

  // Unlock audio on first user gesture (required by iOS Safari)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('durationchange', () => setDuration(isNaN(audio.duration) ? 0 : audio.duration));
    audio.addEventListener('waiting', () => setIsLoading(true));
    audio.addEventListener('playing', () => setIsLoading(false));
    audio.addEventListener('canplay', () => setIsLoading(false));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      if (currentEpisodeRef.current?.audioUrl) {
        setFinishedUrls(prev => new Set([...prev, currentEpisodeRef.current.audioUrl]));
      }
      playNextRef.current?.();
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (!currentEpisode || !audioRef.current) return;
    const audio = audioRef.current;
    // If play() already set src and started playing, skip to avoid interruption
    if (playInitiatedRef.current) {
      playInitiatedRef.current = false;
    } else {
      audio.src = currentEpisode.audioUrl;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentEpisode.title,
        artist: currentEpisode.feedTitle || 'Voxyl',
        album: 'Voxyl',
        artwork: currentEpisode.image
          ? [
              { src: currentEpisode.image, sizes: '96x96',   type: 'image/jpeg' },
              { src: currentEpisode.image, sizes: '128x128', type: 'image/jpeg' },
              { src: currentEpisode.image, sizes: '256x256', type: 'image/jpeg' },
              { src: currentEpisode.image, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });
      navigator.mediaSession.setActionHandler('play',          () => { audio.play().then(() => setIsPlaying(true)).catch(() => {}); });
      navigator.mediaSession.setActionHandler('pause',         () => { audio.pause(); setIsPlaying(false); });
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current?.());
      navigator.mediaSession.setActionHandler('nexttrack',     () => playNextRef.current?.());
      navigator.mediaSession.setActionHandler('seekbackward',  (d) => { audio.currentTime = Math.max(0, audio.currentTime - (d?.seekOffset ?? 15)); });
      navigator.mediaSession.setActionHandler('seekforward',   (d) => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (d?.seekOffset ?? 30)); });
      navigator.mediaSession.setActionHandler('seekto',        (d) => { if (d.seekTime != null) audio.currentTime = d.seekTime; });
    }
  }, [currentEpisode]);

  // Keep position state in sync for lock screen scrubber
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate ?? 1,
        position: currentTime,
      });
    } catch (_) {}
  }, [currentTime, duration]);

  // Load finished episodes on mount
  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u) {
        base44.entities.EpisodeProgress.filter({ user_id: u.id }).then(records => {
          setFinishedUrls(new Set(records.map(r => r.audio_url)));
          setInitialized(true);
        }).catch(() => {
          try {
            const stored = localStorage.getItem('voxyl_finished_urls');
            setFinishedUrls(stored ? new Set(JSON.parse(stored)) : new Set());
          } catch {}
          setInitialized(true);
        });
      } else {
        try {
          const stored = localStorage.getItem('voxyl_finished_urls');
          setFinishedUrls(stored ? new Set(JSON.parse(stored)) : new Set());
        } catch {}
        setInitialized(true);
      }
    }).catch(() => {
      try {
        const stored = localStorage.getItem('voxyl_finished_urls');
        setFinishedUrls(stored ? new Set(JSON.parse(stored)) : new Set());
      } catch {}
      setInitialized(true);
    });
  }, []);

  // Persist finishedUrls to localStorage and database
  useEffect(() => {
    try {
      localStorage.setItem('voxyl_finished_urls', JSON.stringify([...finishedUrls]));
    } catch {}
    
    if (user && initialized) {
      base44.entities.EpisodeProgress.filter({ user_id: user.id }).then(records => {
        const dbUrls = new Set(records.map(r => r.audio_url));
        const toAdd = [...finishedUrls].filter(url => !dbUrls.has(url));
        const toRemove = [...dbUrls].filter(url => !finishedUrls.has(url));
        
        if (toAdd.length > 0) {
          base44.entities.EpisodeProgress.bulkCreate(toAdd.map(url => ({ user_id: user.id, audio_url: url })));
        }
        if (toRemove.length > 0) {
          toRemove.forEach(url => {
            const record = records.find(r => r.audio_url === url);
            if (record) base44.entities.EpisodeProgress.delete(record.id);
          });
        }
      }).catch(() => {});
    }
  }, [finishedUrls, user, initialized]);

  // Keep ref in sync so the 'ended' listener always has the latest episode
  currentEpisodeRef.current = currentEpisode;

  const play = (episode, newQueue = []) => {
    if (newQueue.length > 0) setQueue(newQueue);
    if (currentEpisode?.audioUrl === episode.audioUrl) {
      // Same episode — just play it
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      // Set src immediately within the user gesture context before React re-renders,
      // so iOS doesn't block the play() call that happens in the useEffect.
      const audio = audioRef.current;
      if (audio) {
        playInitiatedRef.current = true;
        setIsLoading(true);
        audio.src = episode.audioUrl;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      setCurrentEpisode(episode);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const seek = (time) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const playNext = () => {
    if (!currentEpisode || queue.length === 0) return;
    if (!autoplay) return;
    const idx = queue.findIndex(e => e.audioUrl === currentEpisode.audioUrl);
    if (idx < queue.length - 1) setCurrentEpisode(queue[idx + 1]);
  };

  const playPrev = () => {
    if (!currentEpisode || queue.length === 0) return;
    const idx = queue.findIndex(e => e.audioUrl === currentEpisode.audioUrl);
    if (idx > 0) setCurrentEpisode(queue[idx - 1]);
  };

  // Keep refs updated so ended listener and MediaSession always use latest version
  playNextRef.current = playNext;
  playPrevRef.current = playPrev;

  return (
    <PlayerContext.Provider value={{
      currentEpisode, isPlaying, isLoading, currentTime, duration,
      queue, play, togglePlay, seek, playNext, playPrev,
      autoplay, setAutoplay,
      playerMinimized, setPlayerMinimized,
      finishedUrls, setFinishedUrls
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);