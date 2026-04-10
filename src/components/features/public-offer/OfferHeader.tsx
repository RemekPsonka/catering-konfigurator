import { motion, MotionValue, useTransform } from 'framer-motion';
import {
  Calendar, Users, MapPin, Truck, Clock,
  PartyPopper, Check, ChevronDown, FileDown,
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { COMPANY } from '@/lib/company-config';
import { DELIVERY_TYPE_LABELS, EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { formatOfferDate, formatOfferTime, truncateText } from './offer-utils';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Tables } from '@/integrations/supabase/types';
import { GREETING_WORD_LIMIT } from '@/lib/app-limits';
import { useState, useCallback } from 'react';

interface OfferHeaderProps {
  offer: PublicOffer;
  heroPhoto: Tables<'event_type_photos'> | null;
  scrollY: MotionValue<number>;
  isExpired: boolean;
  isAccepted: boolean;
  isWon: boolean;
}

export const OfferHeader = ({ offer, heroPhoto, scrollY, isExpired, isAccepted, isWon }: OfferHeaderProps) => {
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);
  const [greetingExpanded, setGreetingExpanded] = useState(false);

  const eventTypeInfo = EVENT_TYPE_OPTIONS.find((e) => e.value === offer.event_type);

  const handlePrint = useCallback(() => {
    const originalTitle = document.title;
    const safeName = (offer.offer_number ?? 'oferta').replace(/[^a-zA-Z0-9-]/g, '_');
    document.title = `Oferta_${safeName}_Catering_Slaski`;
    window.print();
    document.title = originalTitle;
  }, [offer.offer_number]);

  const heroHeadline = eventTypeInfo ? `${eventTypeInfo.emoji} ${eventTypeInfo.label}` : COMPANY.name;

  const deliveryLabel = offer.delivery_type ? DELIVERY_TYPE_LABELS[offer.delivery_type] : null;

  const eventDetails = [
    { icon: PartyPopper, label: 'Rodzaj', value: eventTypeInfo ? `${eventTypeInfo.emoji} ${eventTypeInfo.label}` : offer.event_type },
    {
      icon: Calendar, label: 'Data',
      value: [
        formatOfferDate(offer.event_date),
        offer.event_time_from && offer.event_time_to
          ? `${formatOfferTime(offer.event_time_from)} – ${formatOfferTime(offer.event_time_to)}`
          : formatOfferTime(offer.event_time_from),
      ].filter(Boolean).join(', '),
    },
    { icon: Users, label: 'Liczba osób', value: `${offer.people_count}` },
    offer.event_location ? { icon: MapPin, label: 'Lokalizacja', value: offer.event_location } : null,
    deliveryLabel ? { icon: Truck, label: 'Forma dostawy', value: deliveryLabel } : null,
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  const combinedGreeting = [offer.greeting_text, offer.ai_summary].filter(Boolean).join('\n\n');
  const greetingTruncation = combinedGreeting ? truncateText(combinedGreeting, GREETING_WORD_LIMIT) : null;

  return (
    <>
      {/* Status banners */}
      {isExpired && (
        <div className="no-print sticky top-0 z-50 border-b px-4 py-3 text-center font-body text-sm" style={{ backgroundColor: '#fef3cd', borderColor: '#ffc107', color: '#856404' }}>
          <Clock className="mr-2 inline h-4 w-4" />
          Termin ważności oferty minął {offer.valid_until ? formatOfferDate(offer.valid_until) : ''}. Skontaktuj się z nami w celu przedłużenia.
        </div>
      )}
      {isAccepted && (
        <div className="no-print sticky top-0 z-50 border-b px-4 py-3 text-center font-body text-sm" style={{ backgroundColor: '#d4edda', borderColor: '#28a745', color: '#155724' }}>
          <Check className="mr-2 inline h-4 w-4" />
          Oferta zaakceptowana {offer.accepted_at ? formatOfferDate(offer.accepted_at) : ''}
        </div>
      )}
      {isWon && (
        <div className="no-print sticky top-0 z-50 border-b px-4 py-3 text-center font-body text-sm" style={{ backgroundColor: '#d4edda', borderColor: '#28a745', color: '#155724' }}>
          <Check className="mr-2 inline h-4 w-4" />
          Zamówienie potwierdzone
        </div>
      )}

      {/* Print-only header */}
      <div className="print-only hidden">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 0', borderBottom: '2px solid #1A1A1A', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: 0 }}>{COMPANY.name}</h1>
            <p style={{ fontSize: '11pt', color: '#666', margin: '4px 0 0 0' }}>Oferta cateringowa</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10pt', color: '#444' }}>
            <p style={{ fontWeight: 'bold', margin: 0 }}>{offer.offer_number}</p>
            <p style={{ margin: '2px 0 0 0' }}>Dla: {offer.clients?.name ?? '—'}</p>
            <p style={{ margin: '2px 0 0 0' }}>Data: {formatOfferDate(offer.created_at)}</p>
            {offer.valid_until && <p style={{ margin: '2px 0 0 0' }}>Ważna do: {formatOfferDate(offer.valid_until)}</p>}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          {heroPhoto ? (
            <img src={heroPhoto.photo_url} alt={heroPhoto.alt_text || heroHeadline} className="h-full w-full object-cover object-center" style={{ minHeight: '110%' }} />
          ) : (
            <div className="h-full w-full" style={{ background: `linear-gradient(135deg, var(--theme-primary, #1A1A1A), var(--theme-secondary, #333))` }} />
          )}
        </motion.div>
        <div className="absolute inset-0" style={{ background: heroPhoto ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)' : 'rgba(0,0,0,0.2)' }} />
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 text-center md:py-16">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h1 className="font-display text-3xl font-bold text-ivory md:text-4xl">{COMPANY.name}</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-3 flex flex-wrap items-center justify-center gap-3 font-body text-sm text-ivory/70 tracking-wide">
            <span>{offer.offer_number}</span>
            <span className="hidden sm:inline">•</span>
            <span>{heroHeadline}</span>
            {offer.valid_until && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Ważna do: {formatOfferDate(offer.valid_until)}</span>
              </>
            )}
          </motion.div>
          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }} onClick={handlePrint} className="no-print mt-4 inline-flex items-center gap-2 rounded-xl bg-ivory/15 px-4 py-2 font-body text-sm font-medium text-ivory/90 backdrop-blur-md transition-all hover:bg-ivory/25">
            <FileDown className="h-4 w-4" />Pobierz PDF
          </motion.button>
        </div>
      </section>

      {/* Greeting + AI summary */}
      {combinedGreeting && (
        <motion.section variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="py-6 md:py-8">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="font-body text-base leading-relaxed md:text-lg" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.8 }}>
              {greetingExpanded || !greetingTruncation?.isTruncated ? combinedGreeting : greetingTruncation.truncated}
            </p>
            {greetingTruncation?.isTruncated && (
              <button onClick={() => setGreetingExpanded(!greetingExpanded)} className="mt-2 inline-flex items-center gap-1 font-body text-sm font-medium transition-colors" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                {greetingExpanded ? 'Zwiń' : 'Czytaj więcej'}
                <ChevronDown className={`h-4 w-4 transition-transform ${greetingExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </motion.section>
      )}

      {/* Event details */}
      <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="py-6 md:py-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.h2 variants={fadeInUp} className="mb-4 text-center font-display text-xl font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Szczegóły wydarzenia
          </motion.h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {eventDetails.map((detail) => (
              <motion.div key={detail.label} variants={fadeInUp} className="flex items-center gap-3 rounded-xl bg-ivory px-4 py-3 shadow-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}>
                  <detail.icon className="h-4 w-4" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-charcoal/50">{detail.label}</span>
                  <span className="font-body text-sm font-semibold text-charcoal">{detail.value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </>
  );
};
