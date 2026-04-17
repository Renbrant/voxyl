import { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [autoplay, setAutoplay] = useState(true);
  const audioRef = useRef(null);

  // Unlock audio on first user gesture (required by iOS Safari)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('durationchange', () => setDuration(isNaN(audio.duration) ? 0 : audio.duration));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      playNextRef.current?.();
    });

    // iOS requires a silent play() inside a touch event to unlock the audio context
    const unlock = () => {
      audio.play().then(() => audio.pause()).catch(() => {});
      document.removeEventListener('touchstart', unlock, { once: true });
      document.removeEventListener('click', unlock, { once: true });
    };
    document.addEventListener('touchstart', unlock, { once: true, passive: true });
    document.addEventListener('click', unlock, { once: true });

    return () => {
      audio.pause();
      audio.src = '';
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  useEffect(() => {
    if (!currentEpisode || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = currentEpisode.audioUrl;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});

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

  const playNextRef = useRef(null);
  const playPrevRef = useRef(null);

  const play = (episode, newQueue = []) => {
    if (newQueue.length > 0) setQueue(newQueue);
    setCurrentEpisode(episode);
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

  // Keep refs updated so ended listener and MediaSession always use latest version
  playNextRef.current = playNext;
  playPrevRef.current = playPrev;

  const playPrev = () => {
    if (!currentEpisode || queue.length === 0) return;
    const idx = queue.findIndex(e => e.audioUrl === currentEpisode.audioUrl);
    if (idx > 0) setCurrentEpisode(queue[idx - 1]);
  };

  return (
    <PlayerContext.Provider value={{
      currentEpisode, isPlaying, currentTime, duration,
      queue, play, togglePlay, seek, playNext, playPrev,
      autoplay, setAutoplay
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);