import { Plus, Mic } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PodcastResultCard({ podcast, index, onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
    >
      {podcast.image ? (
        <img
          src={podcast.image}
          alt={podcast.title}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-secondary"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        className="w-14 h-14 rounded-xl flex-shrink-0 bg-secondary items-center justify-center"
        style={{ display: podcast.image ? 'none' : 'flex' }}
      >
        <Mic size={20} className="text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-foreground">{podcast.title}</p>
        <p className="text-xs text-primary truncate">{podcast.author}</p>
        {podcast.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{podcast.description}</p>
        )}
      </div>

      <button
        onClick={() => onAdd(podcast)}
        className="flex-shrink-0 w-9 h-9 rounded-full gradient-primary flex items-center justify-center glow-primary hover:opacity-90 transition-opacity self-center"
      >
        <Plus size={18} className="text-white" />
      </button>
    </motion.div>
  );
}