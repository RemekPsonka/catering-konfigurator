import { useEffect, useRef } from 'react';
import { trackOfferEvent } from '@/lib/tracking';

interface OfferTrackerProps {
  offerId: string;
}

export const OfferTracker = ({ offerId }: OfferTrackerProps) => {
  const sentEvents = useRef(new Set<string>());
  const lastSentAt = useRef(new Map<string, number>());
  const startTime = useRef(Date.now());

  const canSend = (key: string, debounceMs = 30000): boolean => {
    const now = Date.now();
    const last = lastSentAt.current.get(key);
    if (last && now - last < debounceMs) return false;
    lastSentAt.current.set(key, now);
    return true;
  };

  const sendOnce = (key: string, eventType: string, data?: Record<string, unknown>) => {
    if (sentEvents.current.has(key)) return;
    sentEvents.current.add(key);
    trackOfferEvent(offerId, eventType, data);
  };

  // page_open — once per mount
  useEffect(() => {
    sendOnce('page_open', 'page_open');
  }, [offerId]);

  // section_view via IntersectionObserver
  useEffect(() => {
    const sections = document.querySelectorAll('[data-track-section]');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const name = (entry.target as HTMLElement).dataset.trackSection;
          if (!name) return;
          const key = `section_view:${name}`;
          if (canSend(key)) {
            sendOnce(key, 'section_view', { section: name });
          }
        });
      },
      { threshold: 0.3 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [offerId]);

  // scroll_depth sentinels
  useEffect(() => {
    const thresholds = [25, 50, 75, 100];
    const sentinels: HTMLDivElement[] = [];

    thresholds.forEach((pct) => {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.left = '0';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.pointerEvents = 'none';
      el.dataset.scrollDepth = String(pct);
      document.body.appendChild(el);
      sentinels.push(el);
    });

    const positionSentinels = () => {
      const docHeight = document.documentElement.scrollHeight;
      sentinels.forEach((el) => {
        const pct = Number(el.dataset.scrollDepth);
        el.style.top = `${(docHeight * pct) / 100 - 1}px`;
      });
    };

    positionSentinels();
    const resizeObs = new ResizeObserver(positionSentinels);
    resizeObs.observe(document.body);

    const intObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const pct = Number((entry.target as HTMLElement).dataset.scrollDepth);
          sendOnce(`scroll_depth:${pct}`, 'scroll_depth', { depth: pct });
        });
      },
      { threshold: 1.0 },
    );

    sentinels.forEach((s) => intObs.observe(s));

    return () => {
      intObs.disconnect();
      resizeObs.disconnect();
      sentinels.forEach((s) => s.remove());
    };
  }, [offerId]);

  // time_on_page
  useEffect(() => {
    const sendTime = () => {
      const seconds = Math.round((Date.now() - startTime.current) / 1000);
      if (seconds >= 5 && canSend('time_on_page', 0)) {
        trackOfferEvent(offerId, 'time_on_page', { seconds });
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') sendTime();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', sendTime);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', sendTime);
    };
  }, [offerId]);

  return null;
};
