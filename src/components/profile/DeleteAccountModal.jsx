import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Trash2, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// Multi-step deletion with 3 confirmation stages
const STEPS = [
  {
    title: 'Tem certeza?',
    body: 'Você está prestes a excluir permanentemente sua conta no Voxyl. Esta ação não pode ser desfeita.',
    warning: 'Suas playlists permanecerão no app, mas sem seu nome associado.',
    confirmLabel: 'Sim, quero excluir minha conta',
    cancelLabel: 'Não, voltar',
  },
  {
    title: 'Tem absoluta certeza?',
    body: 'Após a exclusão, você perderá acesso a todas as suas configurações, curtidas e histórico de escuta.',
    warning: 'Esta ação é permanente. Não há como recuperar sua conta depois.',
    confirmLabel: 'Sim, tenho certeza',
    cancelLabel: 'Cancelar',
  },
  {
    title: 'Confirmação final',
    body: 'Para confirmar definitivamente, digite exatamente o texto abaixo:',
    warning: null,
    confirmLabel: null, // uses input
    cancelLabel: 'Desistir',
  },
];

export default function DeleteAccountModal({ user, onClose }) {
  const [step, setStep] = useState(0);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const REQUIRED_TEXT = 'EXCLUIR MINHA CONTA';
  const canDelete = confirm.trim() === REQUIRED_TEXT;

  const handleNext = () => {
    if (step < 2) setStep(s => s + 1);
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      // Anonymize playlists — keep them but remove user identity
      const playlists = await base44.entities.Playlist.filter({ creator_id: user.id });
      await Promise.all(playlists.map(p =>
        base44.entities.Playlist.update(p.id, {
          creator_name: 'Usuário removido',
          creator_username: '',
          creator_email: '',
          creator_id: 'deleted',
          creator_picture: '',
          creator_hidden: true,
        })
      ));

      // Delete likes and follows
      const likes = await base44.entities.PlaylistLike.filter({ user_id: user.id });
      await Promise.all(likes.map(l => base44.entities.PlaylistLike.delete(l.id)));
      const follows = await base44.entities.Follow.filter({ follower_id: user.id });
      await Promise.all(follows.map(f => base44.entities.Follow.delete(f.id)));
    } catch {
      // continue to logout even if cleanup partially fails
    }
    base44.auth.logout('/');
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        key={step}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5 pb-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert size={18} />
            <h2 className="text-base font-grotesk font-bold">Excluir Conta</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-secondary text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-destructive' : 'bg-border'}`}
            />
          ))}
        </div>

        {/* Warning box */}
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 mb-5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-semibold mb-1">{current.title}</p>
              <p className="text-xs text-muted-foreground">{current.body}</p>
              {current.warning && (
                <p className="text-xs text-destructive/80 mt-2 font-medium">{current.warning}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: text input */}
        {step === 2 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">
              Digite: <span className="font-mono font-bold text-destructive">{REQUIRED_TEXT}</span>
            </p>
            <input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={REQUIRED_TEXT}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-destructive font-mono"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="flex-1 rounded-2xl"
          >
            {current.cancelLabel}
          </Button>

          {step < 2 ? (
            <Button
              onClick={handleNext}
              className="flex-1 rounded-2xl bg-destructive hover:bg-destructive/90 text-white border-0"
            >
              {current.confirmLabel}
            </Button>
          ) : (
            <Button
              onClick={handleDelete}
              disabled={!canDelete || loading}
              className="flex-1 rounded-2xl bg-destructive hover:bg-destructive/90 text-white border-0 disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-1" /> : <Trash2 size={16} className="mr-1" />}
              {loading ? 'Excluindo...' : 'Excluir definitivamente'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}