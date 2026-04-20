import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function SelectBottomSheet({ value, onChange, options, placeholder, activeColor = 'primary' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(opt => opt.value === value);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 transition-all no-select flex items-center gap-1",
          value && activeColor === 'primary'
            ? "bg-primary/20 text-primary border-primary/40"
            : value && activeColor === 'accent'
            ? "bg-accent/20 text-accent border-accent/40"
            : "bg-secondary text-muted-foreground border-border focus:border-primary"
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown size={12} className="flex-shrink-0" />
      </button>

      {/* Bottom sheet backdrop and content */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="p-4">
                {/* Handle bar */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-1 bg-border rounded-full" />
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-sm text-left transition-all no-select",
                        value === opt.value
                          ? "bg-primary/20 text-primary font-medium"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      )}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}