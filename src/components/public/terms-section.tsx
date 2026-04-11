import { motion } from 'framer-motion';
import { useOfferTerms } from '@/hooks/use-public-offer';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface TermsSectionProps {
  offerId?: string;
}

export const TermsSection = ({ offerId }: TermsSectionProps) => {
  const { data: terms, isLoading } = useOfferTerms(offerId);

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

        <motion.div variants={fadeInUp} className="space-y-3">
          {terms.map((term) => (
            <p key={term.id} className="font-body text-sm leading-relaxed text-charcoal/80">
              <span className="font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                {term.label}:
              </span>{' '}
              {term.value}
            </p>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};
