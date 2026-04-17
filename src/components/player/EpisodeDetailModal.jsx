import { X, Play, Pause, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/rssUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EpisodeDetailModal({ episode, isActive, isPlaying, onPlay, onClose, gradient }) {
  const formattedDate = episode.pubDate
    ? format(new Date(episode.pubDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4 flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-secondary">
            {episode.image
              ? <img src={episode.image} alt="" className="w-full h-full object-cover" />
              : <div className={cn("w-full h-full bg-gradient-to-br", gradient)} />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-grotesk font-bold text-base text-foreground leading-tight">{episode.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{episode.feedTitle}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {formattedDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar size={11} /> {formattedDate}
                </span>
              )}
              {episode.duration && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={11} /> {episode.duration}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-secondary text-muted-foreground flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Play button */}
        <button
          onClick={() => { onPlay(episode); onClose(); }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl gradient-primary text-white font-semibold mb-4 flex-shrink-0"
        >
          {isActive && isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
          {isActive && isPlaying ? 'Pausar' : 'Ouvir episódio'}
        </button>

        {/* Description */}
        {episode.description && (
          <div className="overflow-y-auto flex-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sobre este episódio</h3>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{episode.description}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}