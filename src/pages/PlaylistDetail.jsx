import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { fetchRSSFeed, parseDurationToSeconds, formatDuration } from '@/lib/rssUtils';
import { usePlayer } from '@/lib/PlayerContext';
import { ArrowLeft, Share2, Play, Clock, Loader2, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const GRADIENT_COLORS = [
  'from-purple-600 to-cyan-400',
  'from-pink-600 to-purple-600',
  'from-blue-600 to-cyan-400',
  'from-orange-500 to-pink-600',
];

export default function PlaylistDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const { play, currentEpisode, isPlaying, togglePlay } = usePlayer();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Check if this is the pending playlist the user signed up for
      const pending = localStorage.getItem('voxyl_pending_playlist');
      if (pending === id) {
        localStorage.removeItem('voxyl_pending_playlist');
        // Auto-like/follow the playlist as the first action post-signup
        base44.entities.PlaylistLike.filter({ playlist_id: id, user_id: u.id })
          .then(existing => {
            if (existing.length === 0) {
              base44.entities.PlaylistLike.create({ playlist_id: id, user_id: u.id, user_email: u.email });
              base44.entities.Playlist.filter({ id })
                .then(([pl]) => pl && base44.entities.Playlist.update(id, { likes_count: (pl.likes_count || 0) + 1 }));
            }
          });
      }
    }).catch(() => {});
  }, [id]);

  const { data: playlist } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => base44.entities.Playlist.filter({ id }),
    select: data => data[0],
  });

  useEffect(() => {
    if (!playlist?.rss_feeds?.length) return;
    setLoadingEps(true);
    Promise.allSettled(
      playlist.rss_feeds.map(f =>
        base44.functions.invoke('fetchRSSFeed', { url: f.url, count: 30 }).then(r => r.data)
      )
    )
      .then(results => {
        const allEpisodes = results
          .filter(r => r.status === 'fulfilled' && r.value?.items)
          .flatMap(r => r.value.items.map(ep => ({
            ...ep,
            // Decode HTML entities in URLs (e.g. &amp; → &)
            audioUrl: ep.audioUrl?.replace(/&amp;/g, '&'),
            image: ep.image?.replace(/&amp;/g, '&'),
          })))
          .filter(ep => {
            if (!playlist.max_duration || playlist.max_duration === 0) return true;
            const secs = parseDurationToSeconds(ep.duration);
            return !secs || secs <= playlist.max_duration * 60;
          })
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        setEpisodes(allEpisodes);
      })
      .finally(() => setLoadingEps(false));
  }, [playlist]);

  const handleShare = async () => {
    const url = `${window.location.origin}/share/${id}`;
    if (navigator.share) {
      await navigator.share({ title: playlist?.name, text: playlist?.description, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const handlePlayEpisode = (ep) => {
    if (currentEpisode?.audioUrl === ep.audioUrl) { togglePlay(); return; }
    play(ep, episodes);
    base44.entities.Playlist.update(id, { plays_count: (playlist?.plays_count || 0) + 1 });
  };

  const gradient = GRADIENT_COLORS[id?.charCodeAt(0) % GRADIENT_COLORS.length];

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("relative h-56 bg-gradient-to-br", gradient)}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between z-10">
          <Link to="/playlists" className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </Link>
          <button onClick={handleShare} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 size={16} className="text-white" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 z-10">
          {playlist ? (
            <>
              <h1 className="text-2xl font-grotesk font-bold text-white">{playlist.name}</h1>
              <p className="text-sm text-white/70">por {playlist.creator_name} • {playlist.rss_feeds?.length || 0} feeds</p>
              {playlist.description && <p className="text-xs text-white/60 mt-1 line-clamp-2">{playlist.description}</p>}
            </>
          ) : (
            <div className="h-16 animate-pulse" />
          )}
        </div>
      </div>

      {playlist?.max_duration > 0 && (
        <div className="mx-4 mt-3 px-3 py-2 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-2">
          <Clock size={14} className="text-primary" />
          <span className="text-xs text-primary">Filtro: episódios até {playlist.max_duration} min</span>
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ListMusic size={16} className="text-primary" /> Episódios
            {episodes.length > 0 && <span className="text-muted-foreground text-sm font-normal">({episodes.length})</span>}
          </h2>
          {episodes.length > 0 && (
            <button
              onClick={() => play(episodes[0], episodes)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-primary text-white text-xs font-medium"
            >
              <Play size={12} fill="white" /> Tocar tudo
            </button>
          )}
        </div>

        {loadingEps ? (
          <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm">Carregando feeds...</p>
          </div>
        ) : episodes.length === 0 && playlist ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Nenhum episódio encontrado</p>
            <p className="text-xs mt-1">Verifique os feeds RSS da playlist</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {episodes.map((ep, i) => {
              const isCurrentlyPlaying = currentEpisode?.audioUrl === ep.audioUrl && isPlaying;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handlePlayEpisode(ep)}
                  className={cn(
                    "w-full text-left flex gap-3 p-3 rounded-2xl border transition-all",
                    isCurrentlyPlaying
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                    {ep.image ? <img src={ep.image} alt="" className="w-full h-full object-cover" /> : <div className={cn("w-full h-full bg-gradient-to-br", gradient)} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium line-clamp-2", isCurrentlyPlaying ? "text-primary" : "text-foreground")}>
                      {ep.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{ep.feedTitle}</span>
                      {ep.duration && <span className="text-xs text-muted-foreground">• {ep.duration}</span>}
                    </div>
                  </div>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    isCurrentlyPlaying ? "gradient-primary" : "bg-secondary")}>
                    <Play size={12} fill={isCurrentlyPlaying ? "white" : "currentColor"} className={isCurrentlyPlaying ? "text-white ml-0.5" : "text-muted-foreground ml-0.5"} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}