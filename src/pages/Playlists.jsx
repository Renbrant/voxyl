import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ListMusic, Mic, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import CreatePlaylistModal from '@/components/playlist/CreatePlaylistModal';
import LikedPodcastCard from '@/components/explore/LikedPodcastCard';
import PullToRefreshIndicator from '@/components/common/PullToRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import DownloadedEpisodeCard from '@/components/downloads/DownloadedEpisodeCard';
import { getDownloads } from '@/lib/downloads';
import { getCache, setCache, invalidateCache, TTL_5MIN } from '@/lib/appCache';

const TABS = [
  { key: 'playlists', label: 'Playlists', icon: ListMusic },
  { key: 'podcasts', label: 'Podcasts', icon: Mic },
  { key: 'downloads', label: 'Baixados', icon: Download },
];

export default function Playlists() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('playlists');
  const [showCreate, setShowCreate] = useState(false);
  const [downloads, setDownloads] = useState([]);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  const { pullProgress, refreshing } = usePullToRefresh(() => {
    invalidateCache(`my-playlists-${user?.id}`);
    invalidateCache(`liked-playlists-${user?.id}`);
    invalidateCache(`liked-podcasts-${user?.id}`);
    queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
    queryClient.invalidateQueries({ queryKey: ['liked-playlists'] });
    queryClient.invalidateQueries({ queryKey: ['liked-podcasts'] });
  }, containerRef);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setDownloads(getDownloads());
  }, []);

  // My playlists
  const { data: myPlaylists = [], refetch: refetchMine } = useQuery({
    queryKey: ['my-playlists', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const cacheKey = `my-playlists-${user.id}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;
      const data = await base44.entities.Playlist.filter({ creator_id: user.id }, '-created_date', 50);
      setCache(cacheKey, data, TTL_5MIN);
      return data;
    },
    initialData: () => user ? getCache(`my-playlists-${user.id}`) || undefined : undefined,
  });

  // Liked playlist IDs
  const { data: likedPlaylistRecords = [] } = useQuery({
    queryKey: ['liked-playlists', user?.id],
    enabled: !!user && tab === 'playlists',
    queryFn: async () => {
      const cacheKey = `liked-playlists-${user.id}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;
      const data = await base44.entities.PlaylistLike.filter({ user_id: user.id });
      setCache(cacheKey, data, TTL_5MIN);
      return data;
    },
    initialData: () => user ? getCache(`liked-playlists-${user.id}`) || undefined : undefined,
  });

  const likedPlaylistIds = likedPlaylistRecords.map(r => r.playlist_id);
  const myPlaylistIds = new Set(myPlaylists.map(p => p.id));

  // Liked playlists data (excluding ones I own, since they already appear above)
  const { data: likedPlaylists = [] } = useQuery({
    queryKey: ['liked-playlists-data', likedPlaylistIds.join(',')],
    enabled: likedPlaylistIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        likedPlaylistIds
          .filter(id => !myPlaylistIds.has(id))
          .map(id => base44.entities.Playlist.filter({ id }).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
  });

  // Liked podcasts
  const { data: likedPodcasts = [], refetch: refetchPodcasts } = useQuery({
    queryKey: ['liked-podcasts', user?.id],
    enabled: !!user && tab === 'podcasts',
    queryFn: () => base44.entities.PodcastLike.filter({ user_id: user.id }, '-created_date', 100),
  });

  const handleUnlikePodcast = async (podcastLike) => {
    await base44.entities.PodcastLike.delete(podcastLike.id);
    refetchPodcasts();
  };

  const handleLikePlaylist = async (playlist) => {
    if (!user) return;
    await base44.functions.invoke('togglePlaylistLike', { playlist_id: playlist.id });
    queryClient.invalidateQueries({ queryKey: ['liked-playlists', user?.id] });
  };

  return (
    <div ref={containerRef} className="bg-background pb-24 relative">
      <PullToRefreshIndicator pullProgress={pullProgress} refreshing={refreshing} />
      <VoxylHeader
        title="Curtidas"
        subtitle="Suas playlists e podcasts salvos"
        right={
          tab === 'playlists' && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center glow-primary"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Plus size={18} className="text-white" />
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0',
              tab === key ? 'gradient-primary text-white glow-primary' : 'bg-secondary text-muted-foreground'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2">
        {/* Playlists tab: mine first, then liked */}
        {tab === 'playlists' && (
          <>
            {/* My playlists */}
            {myPlaylists.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium pb-1">Minhas playlists</p>
                {myPlaylists.map((pl, i) => (
                  <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <PlaylistCard
                      playlist={pl}
                      compact
                      liked={likedPlaylistIds.includes(pl.id)}
                      currentUser={user}
                      onEdited={refetchMine}
                    />
                  </motion.div>
                ))}
              </>
            )}

            {/* Liked playlists from others */}
            {likedPlaylists.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium pt-3 pb-1">Playlists curtidas</p>
                {likedPlaylists.map((pl, i) => (
                  <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <PlaylistCard
                      playlist={pl}
                      compact
                      liked
                      onLike={handleLikePlaylist}
                      currentUser={user}
                    />
                  </motion.div>
                ))}
              </>
            )}

            {myPlaylists.length === 0 && likedPlaylists.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">🎵</p>
                <p className="font-medium text-foreground">Nenhuma playlist ainda</p>
                <p className="text-sm mt-1">Crie ou curta playlists para vê-las aqui!</p>
              </div>
            )}
          </>
        )}

        {/* Downloads tab */}
        {tab === 'downloads' && (
          downloads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📥</p>
              <p className="font-medium text-foreground">Nenhum episódio baixado</p>
              <p className="text-sm mt-1">Abra um episódio e toque em "Baixar" para salvá-lo aqui.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {downloads.map((ep, i) => (
                <motion.div key={ep.audioUrl} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <DownloadedEpisodeCard
                    episode={ep}
                    onRemoved={() => setDownloads(getDownloads())}
                  />
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* Podcasts tab */}
        {tab === 'podcasts' && (
          likedPodcasts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🎙️</p>
              <p className="font-medium text-foreground">Nenhum podcast curtido</p>
              <p className="text-sm mt-1">Explore e curta podcasts para salvá-los aqui!</p>
            </div>
          ) : (
            likedPodcasts.map((like, i) => (
              <motion.div key={like.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <LikedPodcastCard
                  podcastLike={like}
                  onUnlike={() => handleUnlikePodcast(like)}
                />
              </motion.div>
            ))
          )
        )}
      </div>

      {showCreate && user && (
        <CreatePlaylistModal
          user={user}
          playlistCount={myPlaylists.length}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            invalidateCache(`my-playlists-${user.id}`);
            setShowCreate(false);
            refetchMine();
          }}
        />
      )}
    </div>
  );
}