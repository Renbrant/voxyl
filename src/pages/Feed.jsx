import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import { Flame, Sparkles, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export default function Feed() {
  const [user, setUser] = useState(null);
  const [likes, setLikes] = useState([]);
  const [tab, setTab] = useState('trending');
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['feed-playlists'] });
    queryClient.invalidateQueries({ queryKey: ['my-likes'] });
  }, containerRef);

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['feed-playlists'],
    queryFn: () => base44.entities.Playlist.filter({ is_public: true }, '-plays_count', 30),
  });

  const { data: likedIds = [] } = useQuery({
    queryKey: ['my-likes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const l = await base44.entities.PlaylistLike.filter({ user_id: user.id });
      setLikes(l.map(x => x.playlist_id));
      return l.map(x => x.playlist_id);
    }
  });

  const handleLike = async (playlist) => {
    if (!user) return;
    const liked = likes.includes(playlist.id);
    if (liked) {
      const records = await base44.entities.PlaylistLike.filter({ playlist_id: playlist.id, user_id: user.id });
      if (records[0]) await base44.entities.PlaylistLike.delete(records[0].id);
      setLikes(prev => prev.filter(id => id !== playlist.id));
      await base44.entities.Playlist.update(playlist.id, { likes_count: Math.max(0, (playlist.likes_count || 1) - 1) });
    } else {
      await base44.entities.PlaylistLike.create({ playlist_id: playlist.id, user_id: user.id, user_email: user.email });
      setLikes(prev => [...prev, playlist.id]);
      await base44.entities.Playlist.update(playlist.id, { likes_count: (playlist.likes_count || 0) + 1 });
    }
  };

  const sortedPlaylists = tab === 'trending'
    ? [...playlists].sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
    : [...playlists].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <VoxylHeader
        subtitle="Descubra"
        title={<span className="text-gradient font-grotesk">Voxyl</span>}
      />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {[
          { key: 'trending', label: 'Em Alta', icon: Flame },
          { key: 'recent', label: 'Recentes', icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
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

      {/* Hero card */}
      {!isLoading && sortedPlaylists[0] && (
        <div className="px-4 mb-5">
          <Link to={`/playlist/${sortedPlaylists[0].id}`}>
            <div className="relative rounded-3xl overflow-hidden h-48 bg-gradient-to-br from-purple-800 via-primary/60 to-cyan-600">
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/70 mb-0.5 font-medium">🔥 Mais tocada agora</p>
                  <h2 className="text-xl font-grotesk font-bold text-white">{sortedPlaylists[0].name}</h2>
                  <p className="text-sm text-white/70">por {sortedPlaylists[0].creator_name} • {sortedPlaylists[0].plays_count || 0} plays</p>
                </div>
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 pb-4">
        <h2 className="text-base font-semibold mb-3 text-foreground">Playlists em Alta</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedPlaylists.map((pl, i) => (
              <motion.div key={pl.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <PlaylistCard playlist={pl} liked={likes.includes(pl.id)} onLike={handleLike} />
              </motion.div>
            ))}
          </div>
        )}
        {!isLoading && sortedPlaylists.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🎧</p>
            <p className="font-medium">Nenhuma playlist pública ainda.</p>
            <p className="text-sm mt-1">Crie a primeira!</p>
          </div>
        )}
      </div>
    </div>
  );
}