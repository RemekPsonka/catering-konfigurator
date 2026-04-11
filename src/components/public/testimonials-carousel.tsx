import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTestimonials } from '@/hooks/use-social-proof';
import { staggerContainer, fadeInUp } from '@/lib/animations';

interface TestimonialsCarouselProps {
  eventType?: string;
}

export const TestimonialsCarousel = ({ eventType }: TestimonialsCarouselProps) => {
  const { data: testimonials } = useTestimonials(eventType);

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-10 md:py-16"
      style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-2 text-center font-display text-xl md:text-2xl font-bold"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Co mówią nasi klienci
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mb-8 text-center font-body text-sm"
          style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}
        >
          Opinie gości z naszych wydarzeń
        </motion.p>

        <div className={`grid gap-5 ${testimonials.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : testimonials.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {testimonials.map((t) => (
            <motion.div
              key={t.id}
              variants={fadeInUp}
              className="rounded-2xl p-5 md:p-6 shadow-sm flex flex-col"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 4%, var(--theme-bg, #FAF7F2))',
                border: '1px solid color-mix(in srgb, var(--theme-primary, #1A1A1A) 8%, transparent)',
              }}
            >
              {t.rating && t.rating > 0 && (
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4"
                      style={{
                        color: i < t.rating! ? 'var(--theme-accent, #c9a84c)' : 'var(--theme-text, #1A1A1A)',
                        opacity: i < t.rating! ? 1 : 0.15,
                        fill: i < t.rating! ? 'var(--theme-accent, #c9a84c)' : 'none',
                      }}
                    />
                  ))}
                </div>
              )}

              <blockquote
                className="font-body text-sm leading-relaxed italic flex-1 mb-4"
                style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.8 }}
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div>
                <p
                  className="font-display text-sm font-semibold"
                  style={{ color: 'var(--theme-text, #1A1A1A)' }}
                >
                  {t.client_name}
                </p>
                {t.event_description && (
                  <p
                    className="font-body text-xs mt-0.5"
                    style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}
                  >
                    {t.event_description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
