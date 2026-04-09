import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

interface AboutCateringSectionProps {
  descriptionLong: string;
}

export const AboutCateringSection = ({ descriptionLong }: AboutCateringSectionProps) => {
  if (!descriptionLong) return null;

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-16 md:py-24"
      style={{ backgroundColor: 'color-mix(in srgb, var(--theme-bg, #FAF7F2) 50%, var(--theme-secondary, #e8e4dd))' }}
    >
      <div className="mx-auto max-w-prose px-6">
        <h2
          className="mb-8 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          O naszym cateringu
        </h2>
        <p
          className="font-body text-lg leading-relaxed"
          style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.85 }}
        >
          {descriptionLong}
        </p>
      </div>
    </motion.section>
  );
};
