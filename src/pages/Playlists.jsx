import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/common/PullToRefreshIndicator';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import CreatePlaylistModal from '@/components/playlist/CreatePlaylistModal';
import { Plus, ListMusic, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Playlists() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('mine');
  const queryClient = useQueryClient();
  const containerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { pullProgress, refreshing } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
    queryClient.invalidateQueries({ queryKey: ['liked-playlists'] });
  }, containerRef);

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['my-playlists', user?.id],
    enabled: !!user,
    queryFn: () => base44.entities.Playlist.filter({ creator_id: user.id }, '-created_date', 50),
  });

  const { data: likedPlaylists = [], isLoading: isLoadingLiked } = useQuery({
    queryKey: ['liked-playlists', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const likes = await base44.entities.PlaylistLike.filter({ user_id: user.id });
      if (!likes.length) return [];
      const ids = likes.map(l => l.playlist_id);
      const all = await Promise.all(ids.map(id => base44.entities.Playlist.filter({ id })));
      return all.flatMap(r => r).filter(Boolean);
    },
  });

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
    setShowCreate(false);
  };

  const handleLike = async (playlist) => {
    if (!user) return;
    const liked = likedPlaylists.some(p => p.id === playlist.id);
    if (liked) {
      const records = await base44.entities.PlaylistLike.filter({ playlist_id: playlist.id, user_id: user.id });
      if (records[0]) await base44.entities.PlaylistLike.delete(records[0].id);
      await base44.entities.Playlist.update(playlist.id, { likes_count: Math.max(0, (playlist.likes_count || 1) - 1) });
    } else {
      await base44.entities.PlaylistLike.create({ playlist_id: playlist.id, user_id: user.id, user_email: user.email });
      await base44.entities.Playlist.update(playlist.id, { likes_count: (playlist.likes_count || 0) + 1 });
    }
    queryClient.invalidateQueries({ queryKey: ['liked-playlists'] });
  };

  const likedIds = likedPlaylists.map(p => p.id);

  const tabs = [
    { key: 'mine', label: 'Minhas', icon: ListMusic },
    { key: 'liked', label: 'Curtidas', icon: Heart },
  ];

  const activeList = tab === 'mine' ? playlists : likedPlaylists;
  const loading = tab === 'mine' ? isLoading : isLoadingLiked;

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative">
      <PullToRefreshIndicator pullProgress={pullProgress} refreshing={refreshing} />
      <VoxylHeader
        title="Playlists"
        right={
          <Button
            onClick={() => setShowCreate(true)}
            size="sm"
            className="rounded-full gradient-primary border-0 glow-primary"
          >
            <Plus size={16} className="mr-1" /> Nova
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
              tab === key
                ? "gradient-primary text-white glow-primary"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-4">{tab === 'mine' ? '🎧' : '💔'}</p>
            <p className="text-lg font-semibold text-foreground">
              {tab === 'mine' ? 'Nenhuma playlist ainda' : 'Nenhuma playlist curtida'}
            </p>
            <p className="text-sm mt-1 mb-6">
              {tab === 'mine' ? 'Crie sua primeira playlist de podcasts' : 'Curta playlists no Feed para vê-las aqui'}
            </p>
            {tab === 'mine' && (
              <Button onClick={() => setShowCreate(true)} className="rounded-full gradient-primary border-0">
                <Plus size={16} className="mr-2" /> Criar Playlist
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {activeList.map((pl, i) => (
              <motion.div key={pl.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <PlaylistCard
                  playlist={pl}
                  compact
                  liked={likedIds.includes(pl.id)}
                  onLike={tab === 'liked' ? handleLike : undefined}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showCreate && user && (
        <CreatePlaylistModal user={user} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}