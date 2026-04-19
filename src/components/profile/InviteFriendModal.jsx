import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InviteFriendModal({ onClose, playlistId = null }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const handleSend = async () => {
    if (!email.trim() || !email.includes('@')) { setError('E-mail inválido'); return; }
    setSending(true);
    setError('');
    // Invite user to the platform
    await base44.users.inviteUser(email.trim(), 'user');
    // Record referral
    if (user) {
      await base44.entities.Referral.create({
        inviter_id: user.id,
        inviter_email: user.email,
        inviter_name: user.full_name || user.email.split('@')[0],
        invitee_email: email.trim(),
        status: 'pending',
        playlist_id: playlistId || '',
      });
    }
    setSending(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5 animate-slide-up" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-grotesk font-bold">Convidar Amigos</h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-secondary text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center glow-primary">
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <p className="text-lg font-semibold">Convite enviado!</p>
            <p className="text-sm text-muted-foreground text-center">
              Seu amigo receberá um e-mail para acessar o Voxyl.
            </p>
            <Button onClick={onClose} className="mt-2 rounded-full gradient-primary border-0 px-8">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-foreground">
                🎧 Convide seus amigos para descobrir e criar playlists de podcasts no Voxyl!
              </p>
            </div>

            {error && <p className="text-destructive text-sm mb-3 bg-destructive/10 px-3 py-2 rounded-xl">{error}</p>}

            <div className="relative mb-4">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@amigo.com"
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-full rounded-2xl gradient-primary border-0 py-6 text-base font-semibold"
            >
              {sending ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
              {sending ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}