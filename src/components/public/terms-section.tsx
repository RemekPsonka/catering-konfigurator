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
  const [openIndex, setOpenIndex] = useState(-1);

  if (isLoading || !terms || terms.length === 0) return null;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-8 md:py-12"
    >
      <div className="mx-auto max-w-3xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-6 text-center font-display text-xl font-bold"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Warunki oferty
        </motion.h2>

        <div className="space-y-2">
          {terms.map((term, index) => {
            const isOpen = openIndex === index;
            const icon = TERM_ICONS[term.key] ?? '📋';

            return (
              <motion.div
                key={term.id}
                variants={fadeInUp}
                className="overflow-hidden rounded-xl bg-ivory shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="font-display text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {term.label}
                    </span>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4 text-charcoal/40" />
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
                      <div className="px-3 pb-3">
                        <div
                          className="h-px w-full mb-3"
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