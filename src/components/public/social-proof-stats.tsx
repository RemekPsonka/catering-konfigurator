import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useCompanyStats } from '@/hooks/use-social-proof';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const CountUp = ({ value, suffix }: { value: number; suffix: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
};

const parseStatValue = (val: string): { num: number; suffix: string } => {
  const match = val.match(/^([\d\s]+)(.*)/);
  if (!match) return { num: 0, suffix: val };
  return { num: parseInt(match[1].replace(/\s/g, ''), 10) || 0, suffix: match[2] };
};

export const SocialProofStats = () => {
  const { data: stats } = useCompanyStats();

  if (!stats || stats.length === 0) return null;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-10 md:py-16"
      style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => {
            const { num, suffix } = parseStatValue(stat.stat_value);
            return (
              <motion.div
                key={stat.id}
                variants={fadeInUp}
                className="flex flex-col items-center text-center"
              >
                {stat.stat_icon && (
                  <span className="text-2xl md:text-3xl mb-2">{stat.stat_icon}</span>
                )}
                <span
                  className="font-display text-3xl md:text-4xl font-bold text-ivory"
                >
                  <CountUp value={num} suffix={suffix} />
                </span>
                <span className="mt-1 font-body text-xs md:text-sm text-ivory/60">
                  {stat.stat_label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
