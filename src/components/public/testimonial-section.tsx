import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations';

interface TestimonialSectionProps {
  text: string;
  author?: string | null;
  event?: string | null;
}

export const TestimonialSection = ({ text, author, event }: TestimonialSectionProps) => {
  if (!text) return null;

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="relative py-16 md:py-24"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, var(--theme-bg, #FAF7F2))',
        borderTop: '1px solid color-mix(in srgb, var(--theme-primary, #1A1A1A) 10%, transparent)',
        borderBottom: '1px solid color-mix(in srgb, var(--theme-primary, #1A1A1A) 10%, transparent)',
      }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span
          className="font-display text-6xl leading-none opacity-20"
          style={{ color: 'var(--theme-primary, #1A1A1A)' }}
        >
          „
        </span>
        <p
          className="mt-2 font-body text-xl italic leading-relaxed md:text-2xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          {text}
        </p>
        <span
          className="inline-block font-display text-6xl leading-none opacity-20"
          style={{ color: 'var(--theme-primary, #1A1A1A)' }}
        >
          "
        </span>

        {(author || event) && (
          <div className="mt-6">
            {author && (
              <p
                className="font-body text-base font-bold"
                style={{ color: 'var(--theme-text, #1A1A1A)' }}
              >
                {author}
              </p>
            )}
            {event && (
              <p
                className="mt-1 font-body text-sm"
                style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.6 }}
              >
                {event}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
};
