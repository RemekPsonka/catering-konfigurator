import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

export const FeaturesSection = ({ features }: FeaturesSectionProps) => {
  if (!features || features.length === 0) return null;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Dlaczego my
        </motion.h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)' }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-ivory p-6 text-center shadow-premium transition-shadow"
            >
              <span className="text-4xl">{feature.icon}</span>
              <h3
                className="font-display text-lg font-bold"
                style={{ color: 'var(--theme-text, #1A1A1A)' }}
              >
                {feature.title}
              </h3>
              <p
                className="font-body text-sm"
                style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.7 }}
              >
                {feature.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
