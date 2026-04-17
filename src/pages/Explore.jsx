import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Explore() {
  const [search, setSearch] = useState('');

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['explore-playlists'],
    queryFn: () => base44.entities.Playlist.filter({ is_public: true }, '-created_date', 50),
  });

  const filtered = playlists.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.creator_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <VoxylHeader title="Explorar" subtitle="Descubra novas playlists" />

      <div className="px-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar playlists, criadores..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((pl, i) => (
              <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <PlaylistCard playlist={pl} compact />
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">🔍</p>
                <p>Nenhum resultado encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}