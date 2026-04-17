import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function DeleteAccountModal({ user, onClose }) {
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const canDelete = confirm.trim().toLowerCase() === 'excluir';

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    // Delete user's playlists and likes before logging out
    const playlists = await base44.entities.Playlist.filter({ creator_id: user.id });
    await Promise.all(playlists.map(p => base44.entities.Playlist.delete(p.id)));
    const likes = await base44.entities.PlaylistLike.filter({ user_id: user.id });
    await Promise.all(likes.map(l => base44.entities.PlaylistLike.delete(l.id)));
    base44.auth.logout('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={18} />
            <h2 className="text-base font-grotesk font-bold">Excluir Conta</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-secondary text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 mb-5">
          <p className="text-sm text-foreground font-medium mb-1">⚠️ Esta ação é irreversível</p>
          <p className="text-xs text-muted-foreground">Todas as suas playlists e dados serão excluídos permanentemente.</p>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          Digite <span className="font-mono font-bold text-foreground">excluir</span> para confirmar:
        </p>
        <input
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="excluir"
          className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-destructive mb-4"
        />

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-2xl">
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="flex-1 rounded-2xl bg-destructive hover:bg-destructive/90 text-white border-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? 'Excluindo...' : 'Excluir conta'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}