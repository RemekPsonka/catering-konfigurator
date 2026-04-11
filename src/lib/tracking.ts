import { supabase } from '@/integrations/supabase/client';

const getSessionId = (): string => {
  const key = 'offer_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
};

const getDeviceType = (): string => {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};

const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
};

export const trackOfferEvent = (
  offerId: string,
  eventType: string,
  eventData?: Record<string, unknown>,
): void => {
  supabase
    .from('offer_events')
    .insert([{
      offer_id: offerId,
      event_type: eventType,
      event_data: (eventData ?? null) as import('@/integrations/supabase/types').Json,
      session_id: getSessionId(),
      device_type: getDeviceType(),
      browser: getBrowser(),
    }])
    .then(() => {});
};
