import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/common/PageTransition';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Playlist.filter({ creator_id: userId, is_public: true }, '-created_date', 30)
      .then(data => { setPlaylists(data); setLoading(false); });
  }, [userId]);

  const creator = playlists[0]?.creator_name || 'Usuário';

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center" style={{ WebkitTapHighlightColor: 'transparent' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-grotesk font-bold">Perfil</h1>
      </div>

      <div className="flex flex-col items-center py-4 px-4 mb-4">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-2">
          <UserCircle2 size={32} className="text-white" />
        </div>
        <h2 className="text-lg font-grotesk font-bold">{creator}</h2>
        <p className="text-sm text-muted-foreground">{playlists.length} playlists públicas</p>
      </div>

      <div className="px-4 pb-4">
        <h3 className="font-semibold mb-3">Playlists</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma playlist pública</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.map((pl, i) => (
              <motion.div key={pl.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <PlaylistCard playlist={pl} compact />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}