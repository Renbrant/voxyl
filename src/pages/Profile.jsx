import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import InviteFriendModal from '@/components/profile/InviteFriendModal';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import ShareAppModal from '@/components/profile/ShareAppModal';
import { UserCircle2, Mail, Users, ListMusic, Trash2, Share2, Shield, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: playlists = [] } = useQuery({
    queryKey: ['profile-playlists', user?.id],
    enabled: !!user,
    queryFn: () => base44.entities.Playlist.filter({ creator_id: user.id }, '-created_date', 20),
  });

  const publicPlaylists = playlists.filter(p => p.visibility === 'public' || (!p.visibility && p.is_public));

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <VoxylHeader title="Perfil" />

      <div className="px-4">
        {/* Avatar & Info */}
        <div className="flex flex-col items-center py-6 mb-4">
          <div className="w-20 h-20 rounded-full mb-3 flex-shrink-0">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.full_name}
                className="w-full h-full rounded-full object-cover glow-primary"
              />
            ) : (
              <div className="w-full h-full rounded-full gradient-primary flex items-center justify-center glow-primary">
                <UserCircle2 size={40} className="text-white" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-grotesk font-bold">{user.full_name || 'Usuário'}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Mail size={12} /> {user.email}
          </p>

          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{playlists.length}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><ListMusic size={10} /> playlists</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{publicPlaylists.length}</p>
              <p className="text-xs text-muted-foreground">públicas</p>
            </div>
          </div>
        </div>

        {/* Invite */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Convide seus amigos!</p>
              <p className="text-xs text-muted-foreground">Compartilhe o Voxyl com quem você ama</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowShare(true)}
                size="sm"
                variant="ghost"
                className="rounded-full text-xs px-2"
              >
                <Share2 size={14} />
              </Button>
              <Button
                onClick={() => setShowInvite(true)}
                size="sm"
                className="rounded-full gradient-primary border-0 text-xs"
              >
                Convidar
              </Button>
            </div>
          </div>
        </div>

        {/* Playlists */}
        <div>
          <h3 className="font-semibold mb-3 text-foreground">Minhas Playlists Públicas</h3>
          {publicPlaylists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">🎧</p>
              <p className="text-sm">Nenhuma playlist pública</p>
            </div>
          ) : (
            <div className="space-y-2">
              {publicPlaylists.map((pl, i) => (
                <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <PlaylistCard playlist={pl} compact />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Danger zone */}
        <div className="mt-8 mb-6 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut size={14} />
                Sair
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 text-sm text-destructive/70 hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
                Excluir conta
              </button>
            </div>
            <Link
              to="/privacy"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield size={12} />
              Política de Privacidade
            </Link>
          </div>
        </div>

      {showInvite && <InviteFriendModal onClose={() => setShowInvite(false)} />}
      <AnimatePresence>
        {showDelete && user && (
          <DeleteAccountModal user={user} onClose={() => setShowDelete(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showShare && (
          <ShareAppModal onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}