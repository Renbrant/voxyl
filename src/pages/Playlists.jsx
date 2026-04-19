import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ListMusic, Heart, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import CreatePlaylistModal from '@/components/playlist/CreatePlaylistModal';
import LikedPodcastCard from '@/components/explore/LikedPodcastCard';

const TABS = [
  { key: 'mine', label: 'Minhas', icon: ListMusic },
  { key: 'liked', label: 'Playlists', icon: Heart },
  { key: 'podcasts', label: 'Podcasts', icon: Mic },
];

export default function Playlists() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('mine');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myPlaylists = [], refetch: refetchMine } = useQuery({
    queryKey: ['my-playlists', user?.id],
    enabled: !!user,
    queryFn: () => base44.entities.Playlist.filter({ creator_id: user.id }, '-created_date', 50),
  });

  const { data: likedPlaylistRecords = [] } = useQuery({
    queryKey: ['liked-playlists', user?.id],
    enabled: !!user && tab === 'liked',
    queryFn: () => base44.entities.PlaylistLike.filter({ user_id: user.id }),
  });

  const likedPlaylistIds = likedPlaylistRecords.map(r => r.playlist_id);

  const { data: likedPlaylists = [] } = useQuery({
    queryKey: ['liked-playlists-data', likedPlaylistIds.join(',')],
    enabled: likedPlaylistIds.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        likedPlaylistIds.map(id => base44.entities.Playlist.filter({ id }).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
  });

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
    const liked = likedPlaylistIds.includes(playlist.id);
    if (liked) {
      const records = await base44.entities.PlaylistLike.filter({ playlist_id: playlist.id, user_id: user.id });
      if (records[0]) await base44.entities.PlaylistLike.delete(records[0].id);
      await base44.entities.Playlist.update(playlist.id, { likes_count: Math.max(0, (playlist.likes_count || 1) - 1) });
    } else {
      await base44.entities.PlaylistLike.create({ playlist_id: playlist.id, user_id: user.id, user_email: user.email });
      await base44.entities.Playlist.update(playlist.id, { likes_count: (playlist.likes_count || 0) + 1 });
    }
    queryClient.invalidateQueries({ queryKey: ['liked-playlists', user?.id] });
  };

  return (
    <div className="bg-background pb-24">
      <VoxylHeader
        title="Curtidas"
        subtitle="Suas playlists e podcasts salvos"
        right={
          tab === 'mine' && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center glow-primary"
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
        {/* My Playlists */}
        {tab === 'mine' && (
          myPlaylists.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🎵</p>
              <p className="font-medium text-foreground">Nenhuma playlist ainda</p>
              <p className="text-sm mt-1">Crie sua primeira playlist!</p>
            </div>
          ) : (
            myPlaylists.map((pl, i) => (
              <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <PlaylistCard
                  playlist={pl}
                  compact
                  liked={false}
                  currentUser={user}
                  onEdited={refetchMine}
                />
              </motion.div>
            ))
          )
        )}

        {/* Liked Playlists */}
        {tab === 'liked' && (
          likedPlaylists.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">❤️</p>
              <p className="font-medium text-foreground">Nenhuma playlist curtida</p>
              <p className="text-sm mt-1">Explore e curta playlists!</p>
            </div>
          ) : (
            likedPlaylists.map((pl, i) => (
              <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <PlaylistCard
                  playlist={pl}
                  compact
                  liked
                  onLike={handleLikePlaylist}
                  currentUser={user}
                />
              </motion.div>
            ))
          )
        )}

        {/* Liked Podcasts */}
        {tab === 'podcasts' && (
          likedPodcasts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🎙️</p>
              <p className="font-medium text-foreground">Nenhum podcast curtido</p>
              <p className="text-sm mt-1">Explore e curta podcasts!</p>
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
          onCreated={() => { setShowCreate(false); refetchMine(); }}
        />
      )}
    </div>
  );
}