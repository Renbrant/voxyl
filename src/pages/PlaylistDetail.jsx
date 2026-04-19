import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { parseDurationToSeconds, formatDuration } from '@/lib/rssUtils';
import { usePlayer } from '@/lib/PlayerContext';
import { ArrowLeft, Share2, Play, Pause, Clock, Loader2, ListMusic, SkipForward, Pencil, CheckCircle2, Heart } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import { useLongPress } from '@/hooks/useLongPress';
import EditPlaylistModal from '@/components/playlist/EditPlaylistModal';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import EpisodeDetailModal from '@/components/player/EpisodeDetailModal';
import EpisodeActionButton from '@/components/player/EpisodeActionButton';
import SwipeableEpisodeRow from '@/components/player/SwipeableEpisodeRow';
import ReportBlockMenu from '@/components/moderation/ReportBlockMenu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GRADIENT_COLORS = [
  'from-purple-600 to-cyan-400',
  'from-pink-600 to-purple-600',
  'from-blue-600 to-cyan-400',
  'from-orange-500 to-pink-600',
];

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [playedUrls, setPlayedUrls] = useState(new Set());
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [editingPlaylist, setEditingPlaylist] = useState(false);
  const [liked, setLiked] = useState(false);
  const { play, currentEpisode, isPlaying, togglePlay, seek, currentTime, duration, autoplay, setAutoplay, finishedUrls, setFinishedUrls } = usePlayer();

  useEffect(() => {
    if (!user || !id) return;
    base44.entities.PlaylistLike.filter({ playlist_id: id, user_id: user.id })
      .then(records => setLiked(records.length > 0))
      .catch(() => {});
  }, [user, id]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !playlist) return;
    if (liked) {
      const records = await base44.entities.PlaylistLike.filter({ playlist_id: id, user_id: user.id });
      if (records[0]) await base44.entities.PlaylistLike.delete(records[0].id);
      setLiked(false);
      await base44.entities.Playlist.update(id, { likes_count: Math.max(0, (playlist.likes_count || 1) - 1) });
    } else {
      await base44.entities.PlaylistLike.create({ playlist_id: id, user_id: user.id, user_email: user.email });
      setLiked(true);
      await base44.entities.Playlist.update(id, { likes_count: (playlist.likes_count || 0) + 1 });
    }
  };

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

  const { data: playlist, refetch: refetchPlaylist } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => base44.entities.Playlist.filter({ id }),
    select: data => data[0],
  });

  const isOwner = user && playlist && user.id === playlist.creator_id;

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
    setPlayedUrls(prev => new Set([...prev, ep.audioUrl]));
    base44.entities.Playlist.update(id, { plays_count: (playlist?.plays_count || 0) + 1 });
  };

  const gradient = GRADIENT_COLORS[id?.charCodeAt(0) % GRADIENT_COLORS.length];

  return (
    <>
    <PageTransition>
    <div className="min-h-screen bg-background">
      <div className={cn("relative h-56 bg-gradient-to-br", gradient)}>
        {playlist?.cover_image && (
          <img src={playlist.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between z-10">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center" style={{ WebkitTapHighlightColor: 'transparent' }}>
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            {/* Autoplay toggle switch */}
            <button
              onClick={() => setAutoplay(v => !v)}
              title={autoplay ? 'Autoplay ativado' : 'Autoplay desativado'}
              className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-1 py-1 transition-all"
            >
              <div className={cn(
                "w-7 h-4 rounded-full relative transition-colors duration-300",
                autoplay ? "bg-primary" : "bg-white/20"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-300",
                  autoplay ? "left-3.5" : "left-0.5"
                )} />
              </div>
              <SkipForward size={11} className={autoplay ? "text-white" : "text-white/40"} />
            </button>
            {isOwner && (
              <button onClick={() => setEditingPlaylist(true)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Pencil size={15} className="text-white" />
              </button>
            )}
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Share2 size={16} className="text-white" />
            </button>
            {!isOwner && (
              <button onClick={handleLike} className={cn("w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center", liked ? "text-red-400" : "text-white")}>
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
              </button>
            )}
            {!isOwner && playlist && (
              <ReportBlockMenu
                currentUser={user}
                targetUser={{ id: playlist.creator_id, email: playlist.creator_email, name: playlist.creator_name }}
                contentType="playlist"
                contentId={playlist.id}
                contentTitle={playlist.name}
              />
            )}
          </div>
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
              onClick={() => {
                const nextUnplayed = episodes.find(ep => !finishedUrls.has(ep.audioUrl)) || episodes[0];
                play(nextUnplayed, episodes);
                base44.entities.Playlist.update(id, { plays_count: (playlist?.plays_count || 0) + 1 });
              }}
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
              const isActive = currentEpisode?.audioUrl === ep.audioUrl;
              const isCurrentlyPlaying = isActive && isPlaying;
              const hasBeenPlayed = playedUrls.has(ep.audioUrl) && !isActive;
              const isFinished = finishedUrls.has(ep.audioUrl) && !isActive;
              const progress = isActive && duration ? (currentTime / duration) * 100 : 0;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                <SwipeableEpisodeRow
                  isFinished={isFinished}
                  onMarkFinished={() => setFinishedUrls(prev => new Set([...prev, ep.audioUrl]))}
                  onMarkUnfinished={() => setFinishedUrls(prev => { const s = new Set(prev); s.delete(ep.audioUrl); return s; })}
                >
                <button
                  onClick={() => handlePlayEpisode(ep)}
                  className={cn(
                    "w-full text-left flex flex-col gap-0 p-3 rounded-2xl border transition-all",
                    isActive
                      ? "border-primary/60 bg-primary/10"
                      : hasBeenPlayed
                      ? "border-border bg-muted/40"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                      {ep.image
                        ? <img src={ep.image} alt="" className={cn("w-full h-full object-cover", hasBeenPlayed && "opacity-50")} />
                        : <div className={cn("w-full h-full bg-gradient-to-br", gradient, hasBeenPlayed && "opacity-50")} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium line-clamp-2 underline-offset-2 hover:underline cursor-pointer",
                          isActive ? "text-primary" : hasBeenPlayed ? "text-muted-foreground" : "text-foreground"
                        )}
                        onClick={e => { e.stopPropagation(); setSelectedEpisode(ep); }}
                      >
                        {ep.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">{ep.feedTitle}</span>
                        {ep.duration && <span className="text-xs text-muted-foreground">• {ep.duration}</span>}
                        {ep.pubDate && (
                          <span className="text-xs text-muted-foreground">
                            • {format(new Date(ep.pubDate), "d MMM yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {hasBeenPlayed && <span className="text-xs text-muted-foreground/60 italic">• ouvido</span>}
                      </div>
                    </div>
                    <EpisodeActionButton
                      ep={ep}
                      isActive={isActive}
                      isCurrentlyPlaying={isCurrentlyPlaying}
                      isFinished={isFinished}
                      onShortPress={() => handlePlayEpisode(ep)}
                      onMarkFinished={() => setFinishedUrls(prev => new Set([...prev, ep.audioUrl]))}
                      onMarkUnfinished={() => setFinishedUrls(prev => { const s = new Set(prev); s.delete(ep.audioUrl); return s; })}
                    />
                  </div>

                  {/* Progress bar — only for the active episode */}
                  {isActive && (
                    <div className="mt-2.5 px-0.5">
                      <div
                        className="relative h-2 bg-border rounded-full overflow-hidden cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          seek(((e.clientX - rect.left) / rect.width) * duration);
                        }}
                        onTouchEnd={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          const touch = e.changedTouches[0];
                          const rect = e.currentTarget.getBoundingClientRect();
                          seek(((touch.clientX - rect.left) / rect.width) * duration);
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 h-full rounded-full gradient-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-primary/80">{formatDuration(Math.floor(currentTime))}</span>
                        <span className="text-xs text-muted-foreground">{formatDuration(Math.floor(duration))}</span>
                      </div>
                    </div>
                  )}
                </button>
                </SwipeableEpisodeRow>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedEpisode && (
          <EpisodeDetailModal
            episode={selectedEpisode}
            isActive={currentEpisode?.audioUrl === selectedEpisode.audioUrl}
            isPlaying={isPlaying}
            onPlay={handlePlayEpisode}
            onClose={() => setSelectedEpisode(null)}
            gradient={gradient}
          />
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
    {editingPlaylist && playlist && (
      <EditPlaylistModal
        playlist={playlist}
        onClose={() => setEditingPlaylist(false)}
        onSaved={() => refetchPlaylist()}
      />
    )}
    </>
  );
}