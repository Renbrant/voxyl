import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, UserCheck, UserX, UserCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FollowRequestsModal({ currentUser, onClose, onCountChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    base44.entities.Follow.filter({ following_id: currentUser.id, status: 'pending' })
      .then(data => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentUser.id]);

  const handleAccept = async (follow) => {
    setActionLoading(follow.id);
    await base44.entities.Follow.update(follow.id, { status: 'accepted' });
    const updated = requests.filter(r => r.id !== follow.id);
    setRequests(updated);
    onCountChange?.(updated.length);
    setActionLoading(null);
  };

  const handleReject = async (follow) => {
    setActionLoading(follow.id);
    await base44.entities.Follow.delete(follow.id);
    const updated = requests.filter(r => r.id !== follow.id);
    setRequests(updated);
    onCountChange?.(updated.length);
    setActionLoading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md bg-card border-t border-border rounded-t-3xl flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-base font-grotesk font-bold">Pedidos para seguir</h2>
            {requests.length > 0 && (
              <p className="text-xs text-muted-foreground">{requests.length} pedido{requests.length > 1 ? 's' : ''} pendente{requests.length > 1 ? 's' : ''}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-secondary text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-sm">Nenhum pedido pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {requests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-secondary border border-border"
                  >
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <UserCircle2 size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {req.follower_username ? `@${req.follower_username}` : (req.follower_name || 'Usuário')}
                      </p>
                    </div>
                    {actionLoading === req.id ? (
                      <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req)}
                          className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center"
                          title="Aceitar"
                        >
                          <UserCheck size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center"
                          title="Recusar"
                        >
                          <UserX size={16} className="text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}