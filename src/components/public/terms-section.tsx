import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useOfferTerms } from '@/hooks/use-public-offer';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const TERM_ICONS: Record<string, string> = {
  deposit: '💰',
  payment: '💳',
  deadline: '📅',
  cancellation: '❌',
  changes: '🔄',
  validity: '⏰',
  delivery: '🚚',
  minimum: '📊',
};

export const TermsSection = () => {
  const { data: terms, isLoading } = useOfferTerms();
  const [openIndex, setOpenIndex] = useState(0);

  if (isLoading || !terms || terms.length === 0) return null;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-3xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Warunki oferty
        </motion.h2>

        <div className="space-y-3">
          {terms.map((term, index) => {
            const isOpen = openIndex === index;
            const icon = TERM_ICONS[term.key] ?? '📋';

            return (
              <motion.div
                key={term.id}
                variants={fadeInUp}
                className="overflow-hidden rounded-2xl bg-ivory shadow-premium"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-display text-base font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {term.label}
                    </span>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-5 w-5 text-charcoal/40" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <div
                          className="h-px w-full mb-4"
                          style={{ background: 'linear-gradient(to right, var(--theme-primary, #1A1A1A), transparent)' }}
                        />
                        <p className="font-body text-sm leading-relaxed text-charcoal/70 whitespace-pre-line">
                          {term.value}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
