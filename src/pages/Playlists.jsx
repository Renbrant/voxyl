import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/common/PullToRefreshIndicator';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import CreatePlaylistModal from '@/components/playlist/CreatePlaylistModal';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Playlists() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const containerRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { pullProgress, refreshing } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
  }, containerRef);

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['my-playlists', user?.id],
    enabled: !!user,
    queryFn: () => base44.entities.Playlist.filter({ creator_id: user.id }, '-created_date', 50),
  });

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['my-playlists'] });
    setShowCreate(false);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative">
      <PullToRefreshIndicator pullProgress={pullProgress} refreshing={refreshing} />
      <VoxylHeader
        title="Minhas Playlists"
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

      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-4">🎧</p>
            <p className="text-lg font-semibold text-foreground">Nenhuma playlist ainda</p>
            <p className="text-sm mt-1 mb-6">Crie sua primeira playlist de podcasts</p>
            <Button onClick={() => setShowCreate(true)} className="rounded-full gradient-primary border-0">
              <Plus size={16} className="mr-2" /> Criar Playlist
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.map((pl, i) => (
              <motion.div key={pl.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <PlaylistCard playlist={pl} compact />
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