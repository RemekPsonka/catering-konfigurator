import { GREETING_WORD_LIMIT } from '@/lib/app-limits';

export const loadGoogleFont = (fontFamily: string | null) => {
  if (!fontFamily) return;
  const id = `gfont-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

export const isValidToken = (token: string | undefined): boolean => {
  if (!token || token.length === 0) return false;
  if (/^[a-f0-9]{64}$/.test(token)) return true;
  if (/^[A-HJ-NP-Za-hj-km-np-z2-9]{12}$/.test(token)) return true;
  return false;
};

export const truncateText = (text: string, wordLimit: number = GREETING_WORD_LIMIT) => {
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) return { truncated: text, isTruncated: false };
  return { truncated: words.slice(0, wordLimit).join(' ') + '…', isTruncated: true };
};

export const formatOfferDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

export const formatOfferTime = (t: string | null) => (t ? t.slice(0, 5) : null);
