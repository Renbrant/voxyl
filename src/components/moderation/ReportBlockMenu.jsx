import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MoreVertical, Flag, Ban, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Conteúdo inapropriado' },
  { value: 'spam', label: 'Spam' },
  { value: 'hate_speech', label: 'Discurso de ódio' },
  { value: 'misinformation', label: 'Desinformação' },
  { value: 'other', label: 'Outro' },
];

export default function ReportBlockMenu({ targetUser, contentType = 'playlist', contentId, contentTitle, currentUser }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'report' | 'block' | 'done'
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser || currentUser.id === targetUser?.id) return null;

  const handleReport = async (e) => {
    e?.preventDefault(); e?.stopPropagation();
    if (!reason) return;
    setLoading(true);
    await base44.entities.Report.create({
      reporter_id: currentUser.id,
      reporter_email: currentUser.email,
      reported_user_id: targetUser.id,
      reported_user_email: targetUser.email || '',
      content_type: contentType,
      content_id: contentId,
      content_title: contentTitle,
      reason,
      details,
    });
    setLoading(false);
    setMode('done');
  };

  const handleBlock = async (e) => {
    e?.preventDefault(); e?.stopPropagation();
    setLoading(true);
    const existing = await base44.entities.Block.filter({ blocker_id: currentUser.id, blocked_id: targetUser.id });
    if (!existing.length) {
      await base44.entities.Block.create({
        blocker_id: currentUser.id,
        blocker_email: currentUser.email,
        blocked_id: targetUser.id,
        blocked_email: targetUser.email || '',
        blocked_name: targetUser.name || '',
      });
    }
    setLoading(false);
    setMode('done');
  };

  const close = (e) => { e?.preventDefault(); e?.stopPropagation(); setOpen(false); setMode(null); setReason(''); setDetails(''); };

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={close} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5"
              onClick={e => e.stopPropagation()}
            >
              {/* Done state */}
              {mode === 'done' && (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold text-foreground">Obrigado pelo aviso</p>
                  <p className="text-sm text-muted-foreground mt-1">Nossa equipe irá analisar em breve.</p>
                  <button onClick={close} className="mt-4 px-6 py-2 rounded-full bg-secondary text-sm font-medium">Fechar</button>
                </div>
              )}

              {/* Report form */}
              {mode === 'report' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-grotesk font-bold text-base">Denunciar conteúdo</h3>
                    <button onClick={close}><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Qual é o problema?</p>
                  <div className="space-y-2 mb-3">
                    {REPORT_REASONS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setReason(r.value)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                          reason === r.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-foreground'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Detalhes adicionais (opcional)..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none mb-3"
                  />
                  <button
                    onClick={handleReport}
                    disabled={!reason || loading}
                    className="w-full py-3 rounded-2xl bg-destructive text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar denúncia'}
                  </button>
                </>
              )}

              {/* Block confirmation */}
              {mode === 'block' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-grotesk font-bold text-base">Bloquear usuário</h3>
                    <button onClick={close}><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Você não verá mais o conteúdo de <strong className="text-foreground">{targetUser?.name || 'este usuário'}</strong>. Esta ação pode ser desfeita no seu perfil.
                  </p>
                  <button
                    onClick={handleBlock}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-destructive text-white font-semibold text-sm disabled:opacity-50 mb-2"
                  >
                    {loading ? 'Bloqueando...' : 'Bloquear'}
                  </button>
                  <button onClick={close} className="w-full py-3 rounded-2xl bg-secondary text-sm font-medium">Cancelar</button>
                </>
              )}

              {/* Main menu */}
              {!mode && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-grotesk font-bold text-base">Opções</h3>
                    <button onClick={close}><X size={18} className="text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setMode('report')}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Flag size={18} className="text-yellow-400" />
                      <span className="text-sm font-medium flex-1 text-left">Denunciar conteúdo</span>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setMode('block')}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Ban size={18} className="text-destructive" />
                      <span className="text-sm font-medium flex-1 text-left">Bloquear usuário</span>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}