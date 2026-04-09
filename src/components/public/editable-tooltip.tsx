import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditableTooltipProps {
  show: boolean;
  onDismiss: () => void;
}

export const EditableTooltip = ({ show, onDismiss }: EditableTooltipProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    try {
      if (sessionStorage.getItem('edit_tooltip_seen')) return;
    } catch { /* noop */ }
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem('edit_tooltip_seen', '1'); } catch { /* noop */ }
      onDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  const handleClick = () => {
    setVisible(false);
    try { sessionStorage.setItem('edit_tooltip_seen', '1'); } catch { /* noop */ }
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-xl px-5 py-3 shadow-lg"
          style={{
            backgroundColor: 'var(--theme-primary, #1A1A1A)',
            color: '#FFFFF0',
            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
          onClick={handleClick}
        >
          <p className="font-body text-sm font-medium">
            Kliknij 🔄 aby zobaczyć alternatywy dla dania
          </p>
          <div
            className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid var(--theme-primary, #1A1A1A)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
