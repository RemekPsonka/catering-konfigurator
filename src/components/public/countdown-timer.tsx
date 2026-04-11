import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fadeInUp } from '@/lib/animations';

interface CountdownTimerProps {
  validUntil: string | null;
  isExpired: boolean;
}

type UrgencyLevel = 'green' | 'yellow' | 'red';

const getTimeRemaining = (validUntil: string) => {
  const now = new Date().getTime();
  const end = new Date(validUntil).getTime();
  const diff = end - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, totalMs: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, totalMs: diff };
};

const getUrgencyLevel = (days: number): UrgencyLevel => {
  if (days >= 7) return 'green';
  if (days >= 3) return 'yellow';
  return 'red';
};

const urgencyStyles: Record<UrgencyLevel, { bg: string; text: string; icon: string }> = {
  green: { bg: 'bg-green-50/80 border-green-200/60', text: 'text-green-800', icon: 'text-green-600' },
  yellow: { bg: 'bg-amber-50/80 border-amber-200/60', text: 'text-amber-800', icon: 'text-amber-600' },
  red: { bg: 'bg-red-50/80 border-red-200/60', text: 'text-red-800', icon: 'text-red-600' },
};

export const CountdownTimer = ({ validUntil, isExpired }: CountdownTimerProps) => {
  const [time, setTime] = useState(() => validUntil ? getTimeRemaining(validUntil) : null);

  useEffect(() => {
    if (!validUntil || isExpired) return;
    setTime(getTimeRemaining(validUntil));
    const interval = setInterval(() => setTime(getTimeRemaining(validUntil)), 60_000);
    return () => clearInterval(interval);
  }, [validUntil, isExpired]);

  if (!validUntil || isExpired || !time || time.totalMs <= 0) return null;

  const level = getUrgencyLevel(time.days);
  const styles = urgencyStyles[level];
  const formattedDate = new Date(validUntil).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className={`w-full border-b ${styles.bg}`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
        <Clock size={18} className={`${styles.icon} ${level === 'red' ? 'animate-pulse' : ''}`} />

        {level === 'green' && (
          <span className={`text-sm font-medium ${styles.text}`}>
            Oferta ważna do {formattedDate}
          </span>
        )}

        {level === 'yellow' && (
          <>
            <span className={`text-sm font-medium ${styles.text}`}>
              Oferta ważna jeszcze {time.days} {time.days === 1 ? 'dzień' : 'dni'}
            </span>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] hover:bg-amber-100">
              Ostatnie dni!
            </Badge>
          </>
        )}

        {level === 'red' && (
          <>
            <span className={`text-sm font-semibold ${styles.text}`}>
              Zostało już tylko {time.days > 0 ? `${time.days}d ` : ''}{time.hours}h!
            </span>
            <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px] animate-pulse hover:bg-red-100">
              <AlertTriangle size={10} className="mr-0.5" />
              Czas ucieka!
            </Badge>
          </>
        )}
      </div>
    </motion.div>
  );
};
