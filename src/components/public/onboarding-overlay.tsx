import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, RefreshCw, CheckCircle } from 'lucide-react';

interface OnboardingOverlayProps {
  variantCount: number;
  editableCount: number;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: Eye,
    title: '👀 Przejrzyj menu',
    getDescription: (variantCount: number) =>
      `Przygotowaliśmy dla Ciebie ${variantCount > 1 ? `${variantCount} warianty menu` : 'menu'}. ${variantCount > 1 ? 'Porównaj i wybierz najlepszy.' : 'Zobacz szczegóły.'}`,
  },
  {
    icon: RefreshCw,
    title: '🔄 Personalizuj',
    getDescription: (editableCount: number) =>
      editableCount > 0
        ? `${editableCount} ${editableCount === 1 ? 'pozycja jest' : editableCount < 5 ? 'pozycje są' : 'pozycji jest'} do personalizacji — kliknij «wymień na inne» przy daniu, aby zobaczyć alternatywy.`
        : 'Przy daniach oznaczonych przyciskiem «wymień na inne» możesz wybrać alternatywę.',
  },
  {
    icon: CheckCircle,
    title: '✅ Zaakceptuj lub napisz',
    getDescription: () =>
      'Gdy oferta Ci odpowiada — zaakceptuj jednym kliknięciem. Masz pytania? Napisz do nas bezpośrednio.',
  },
];

export const OnboardingOverlay = ({ variantCount, editableCount, onDismiss }: OnboardingOverlayProps) => {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem('onboarding_seen', '1'); } catch { /* noop */ }
    setTimeout(onDismiss, 300);
  };

  const handleSkip = () => {
    try { sessionStorage.setItem('onboarding_seen', '1'); } catch { /* noop */ }
    setVisible(false);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-2xl bg-ivory p-8 shadow-premium"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="mb-6 text-center font-display text-2xl font-bold"
              style={{ color: 'var(--theme-text, #1A1A1A)' }}
            >
              Witaj w Twojej ofercie!
            </h2>

            <div className="flex flex-col gap-5">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
                  >
                    <step.icon className="h-5 w-5 text-ivory" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {step.title}
                    </p>
                    <p className="mt-0.5 font-body text-sm leading-relaxed text-charcoal/60">
                      {i === 0 ? step.getDescription(variantCount) : i === 1 ? step.getDescription(editableCount) : step.getDescription(0)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDismiss}
                className="w-full rounded-xl px-8 py-3.5 font-body font-semibold text-ivory transition-all"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
              >
                Rozumiem, pokaż ofertę
              </motion.button>
              <button
                onClick={handleSkip}
                className="font-body text-xs text-charcoal/40 underline underline-offset-2 transition-colors hover:text-charcoal/60"
              >
                Nie pokazuj ponownie
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
