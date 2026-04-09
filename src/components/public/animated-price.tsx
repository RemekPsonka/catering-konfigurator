import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { formatCurrency } from '@/lib/calculations';

interface AnimatedPriceProps {
  value: number;
  className?: string;
}

export const AnimatedPrice = ({ value, className = '' }: AnimatedPriceProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const prevValue = useRef(value);
  const direction = useMemo(() => {
    if (prevValue.current === value) return 'none';
    return value > prevValue.current ? 'up' : 'down';
  }, [value]);

  // Initial count-up on scroll into view
  useEffect(() => {
    if (!isInView || hasAnimated) return;
    let start = 0;
    const duration = 1000;
    const target = value;
    const step = (timestamp: number) => {
      start = start || timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayed(Math.floor(eased * target * 100) / 100);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayed(target);
        setHasAnimated(true);
      }
    };
    requestAnimationFrame(step);
  }, [isInView, value, hasAnimated]);

  // Update on value change after initial animation
  useEffect(() => {
    if (!hasAnimated) return;
    prevValue.current = displayed;
    setDisplayed(value);
  }, [value, hasAnimated]);

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  const flashColor = direction === 'up' ? 'rgba(34, 197, 94, 0.3)' : direction === 'down' ? 'rgba(239, 68, 68, 0.3)' : 'transparent';

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={hasAnimated ? { opacity: 0, y: 10, backgroundColor: flashColor } : false}
          animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="inline-block rounded-lg px-1"
        >
          {formatCurrency(displayed)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
