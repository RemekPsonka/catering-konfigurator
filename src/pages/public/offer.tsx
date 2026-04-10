import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { usePublicOffer, useMarkOfferViewed } from '@/hooks/use-public-offer';
import { fireNotification } from '@/hooks/use-notifications';
import { usePublicEventProfile, usePublicEventPhotos } from '@/hooks/use-public-event-profile';
import { EVENT_TYPE_OPTIONS, DELIVERY_TYPE_LABELS } from '@/lib/offer-constants';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';
import { fadeInUp, fadeIn, staggerContainer, scaleIn } from '@/lib/animations';
import {
  Calendar,
  Users,
  MapPin,
  Truck,
  Clock,
  PartyPopper,
  Sparkles,
  FileX2,
  Phone,
  Mail,
  Search,
  FileDown,
  Check,
  ChevronDown,
} from 'lucide-react';
import { MenuVariantsSection } from '@/components/public/menu-variants-section';
import { ServicesLogisticsSection } from '@/components/public/services-logistics-section';
import { CalculationSection } from '@/components/public/calculation-section';
import { ChangesPanel } from '@/components/public/changes-panel';
import { TermsSection } from '@/components/public/terms-section';
import { CommunicationSection } from '@/components/public/communication-section';
import { AcceptanceSection } from '@/components/public/acceptance-section';
import { ContactSection } from '@/components/public/contact-section';
import { OnboardingOverlay } from '@/components/public/onboarding-overlay';
import { EditableTooltip } from '@/components/public/editable-tooltip';

import type { DishModification } from '@/components/public/dish-edit-panel';
import { getItemPrice } from '@/hooks/use-offer-variants';
import type { VariantWithItems } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';
import { COMPANY } from '@/lib/company-config';

const loadGoogleFont = (fontFamily: string | null) => {
  if (!fontFamily) return;
  const id = `gfont-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

const isValidToken = (token: string | undefined): boolean => {
  if (!token || token.length === 0) return false;
  if (/^[a-f0-9]{64}$/.test(token)) return true;
  if (/^[A-HJ-NP-Za-hj-km-np-z2-9]{12}$/.test(token)) return true;
  return false;
};

import { GREETING_WORD_LIMIT } from '@/lib/app-limits';

const truncateText = (text: string, wordLimit: number) => {
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) return { truncated: text, isTruncated: false };
  return { truncated: words.slice(0, wordLimit).join(' ') + '…', isTruncated: true };
};

export const PublicOfferPage = () => {
  const { publicToken } = useParams<{ publicToken: string }>();
  const tokenValid = isValidToken(publicToken);
  const { data: offer, isLoading, error } = usePublicOffer(tokenValid ? publicToken : undefined);
  const markViewed = useMarkOfferViewed();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);

  const [modifications, setModifications] = useState<Map<string, DishModification>>(new Map());
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [greetingExpanded, setGreetingExpanded] = useState(false);
  const isFirstVisitRef = useRef<boolean | null>(null);

  const { data: eventProfile } = usePublicEventProfile(offer?.event_type);
  const { data: eventPhotos } = usePublicEventPhotos(offer?.event_type);

  // Initialize activeVariantId when offer loads
  useEffect(() => {
    if (offer && !activeVariantId) {
      const sorted = [...offer.offer_variants].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      if (sorted.length > 0) setActiveVariantId(sorted[0].id);
    }
  }, [offer, activeVariantId]);

  const heroPhoto = useMemo(
    () => eventPhotos?.find((p) => p.is_hero) ?? null,
    [eventPhotos],
  );

  const handleModificationChange = useCallback((itemId: string, mod: DishModification | undefined) => {
    setModifications((prev) => {
      const next = new Map(prev);
      if (mod) {
        next.set(itemId, mod);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const handleClearModifications = useCallback(() => {
    setModifications(new Map());
  }, []);

  const handlePrint = useCallback(() => {
    const originalTitle = document.title;
    const safeName = (offer?.offer_number ?? 'oferta').replace(/[^a-zA-Z0-9-]/g, '_');
    document.title = `Oferta_${safeName}_Catering_Slaski`;
    window.print();
    document.title = originalTitle;
  }, [offer?.offer_number]);

  const { originalTotal, proposedTotal } = useMemo(() => {
    if (!offer) return { originalTotal: 0, proposedTotal: 0 };
    const variants = offer.offer_variants as unknown as VariantWithItems[];
    const services = offer.offer_services as unknown as OfferServiceWithService[];
    const pc = offer.people_count ?? 1;
    const origTotals = calculateOfferTotals(
      offer.pricing_mode, pc, variants, services,
      offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0,
    );

    const adjustedVariants = variants.map((v) => ({
      ...v,
      variant_items: v.variant_items.map((item) => {
        const mod = modifications.get(item.id);
        if (!mod) return item;
        let priceAdj = 0;
        if (mod.type === 'swap' && mod.swapPriceDiff != null) priceAdj = mod.swapPriceDiff;
        if (mod.type === 'variant' && mod.variantPriceModifier != null) priceAdj = mod.variantPriceModifier;
        if (priceAdj === 0) return item;
        const basePrice = item.custom_price != null ? Number(item.custom_price) : getItemPrice(item as never);
        return { ...item, custom_price: basePrice + priceAdj };
      }),
    })) as unknown as VariantWithItems[];

    const propTotals = calculateOfferTotals(
      offer.pricing_mode, pc, adjustedVariants, services,
      offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0,
    );

    return { originalTotal: origTotals.grandTotal, proposedTotal: propTotals.grandTotal };
  }, [offer, modifications]);

  useEffect(() => {
    if (!offer?.offer_themes) return;
    const t = offer.offer_themes;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', t.primary_color);
    root.style.setProperty('--theme-secondary', t.secondary_color);
    root.style.setProperty('--theme-accent', t.accent_color);
    root.style.setProperty('--theme-bg', t.background_color);
    root.style.setProperty('--theme-text', t.text_color);
    root.style.setProperty('--theme-font', t.font_family);
    root.style.setProperty('--theme-header-font', t.header_font ?? t.font_family);

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };
    try {
      root.style.setProperty('--theme-primary-rgb', hexToRgb(t.primary_color));
    } catch { /* ignore */ }

    loadGoogleFont(t.font_family);
    loadGoogleFont(t.header_font);

    return () => {
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-secondary');
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-bg');
      root.style.removeProperty('--theme-text');
      root.style.removeProperty('--theme-font');
      root.style.removeProperty('--theme-header-font');
      root.style.removeProperty('--theme-primary-rgb');
    };
  }, [offer?.offer_themes]);

  useEffect(() => {
    if (offer && isFirstVisitRef.current === null) {
      isFirstVisitRef.current = !offer.viewed_at;
    }
  }, [offer]);

  useEffect(() => {
    if (offer && !offer.viewed_at && offer.status === 'sent') {
      markViewed.mutate(offer.id);
      const clientName = offer.clients?.name ?? 'Klient';
      const eventTypeLabel = eventTypeInfo?.label ?? offer.event_type;
      fireNotification({
        offerId: offer.id,
        eventType: 'offer_viewed',
        title: `👁️ Klient otworzył ofertę ${offer.offer_number ?? ''}`,
        body: `${clientName} otworzył(a) ofertę. Typ: ${eventTypeLabel}, ${offer.people_count ?? '?'} osób.`,
        link: `/admin/offers/${offer.id}/edit`,
      });
    }
  }, [offer?.id, offer?.viewed_at, offer?.status]);

  const eventTypeInfo = useMemo(
    () => EVENT_TYPE_OPTIONS.find((e) => e.value === offer?.event_type),
    [offer?.event_type],
  );

  const isExpired = useMemo(() => {
    if (!offer?.valid_until) return false;
    return new Date() > new Date(offer.valid_until);
  }, [offer?.valid_until]);

  const editableCount = useMemo(() => {
    if (!offer) return 0;
    return offer.offer_variants.reduce((acc, v) => acc + v.variant_items.filter((item) => {
      const mods = (item.allowed_modifications ?? item.dishes?.modifiable_items) as unknown;
      return item.is_client_editable && mods && typeof mods === 'object';
    }).length, 0);
  }, [offer]);

  // Invalid token format
  if (!tokenValid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Nieprawidłowy link do oferty</h1>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Sprawdź poprawność linku lub skontaktuj się z nami.</p>
          <a href="/offer/find" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 font-body font-semibold text-ivory tracking-wide transition-all hover:bg-charcoal/90">
            <Search className="h-4 w-4" /> Znajdź ofertę
          </a>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-charcoal/20 border-t-charcoal" />
          <p className="font-body text-charcoal/60 tracking-wide">Ładowanie oferty...</p>
        </motion.div>
      </div>
    );
  }

  if (!offer || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Nie znaleziono oferty</h1>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Sprawdź link lub skontaktuj się z nami.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a href="/offer/find" className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 font-body font-semibold text-ivory tracking-wide transition-all hover:bg-charcoal/90">
              <Search className="h-4 w-4" /> Szukaj oferty
            </a>
            <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal">
              <Mail className="h-4 w-4" /> Skontaktuj się z nami
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const isDraft = offer?.status === 'draft';
  const isLost = offer?.status === 'lost';
  const isAccepted = offer?.status === 'accepted';
  const isWon = offer?.status === 'won';
  const actionsDisabled = isDraft || isLost || isAccepted || isWon || isExpired;

  if (isDraft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg text-center">
          <Sparkles className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Ta oferta jest w trakcie aktualizacji</h1>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Wróć później lub skontaktuj się z nami.</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-body text-charcoal/80 transition-colors hover:text-charcoal">
              <Phone className="h-4 w-4" /> {COMPANY.phone}
            </a>
            <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal">
              <Mail className="h-4 w-4" /> {COMPANY.email}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLost) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg text-center">
          <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Oferta zamknięta</h1>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Ta oferta została zamknięta. Jeśli chcesz wznowić rozmowę, skontaktuj się z nami.</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-body text-charcoal/80 transition-colors hover:text-charcoal">
              <Phone className="h-4 w-4" /> {COMPANY.phone}
            </a>
            <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal">
              <Mail className="h-4 w-4" /> {COMPANY.email}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

  const formatTime = (t: string | null) => (t ? t.slice(0, 5) : null);

  const deliveryLabel = offer.delivery_type
    ? DELIVERY_TYPE_LABELS[offer.delivery_type]
    : null;

  const eventDetails = [
    {
      icon: PartyPopper,
      label: 'Rodzaj',
      value: eventTypeInfo ? `${eventTypeInfo.emoji} ${eventTypeInfo.label}` : offer.event_type,
    },
    {
      icon: Calendar,
      label: 'Data',
      value: [
        formatDate(offer.event_date),
        offer.event_time_from && offer.event_time_to
          ? `${formatTime(offer.event_time_from)} – ${formatTime(offer.event_time_to)}`
          : formatTime(offer.event_time_from),
      ]
        .filter(Boolean)
        .join(', '),
    },
    {
      icon: Users,
      label: 'Liczba osób',
      value: `${offer.people_count}`,
    },
    offer.event_location
      ? { icon: MapPin, label: 'Lokalizacja', value: offer.event_location }
      : null,
    deliveryLabel
      ? { icon: Truck, label: 'Forma dostawy', value: deliveryLabel }
      : null,
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  const heroHeadline = eventProfile?.headline || (eventTypeInfo ? `${eventTypeInfo.emoji} ${eventTypeInfo.label}` : COMPANY.name);

  const showOnboarding = isFirstVisitRef.current === true && !onboardingDismissed;

  // Combine greeting + ai_summary into one collapsible text
  const combinedGreeting = [offer.greeting_text, offer.ai_summary].filter(Boolean).join('\n\n');
  const greetingTruncation = combinedGreeting ? truncateText(combinedGreeting, GREETING_WORD_LIMIT) : null;

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)', color: 'var(--theme-text, #1A1A1A)' }}>
      {/* Status banners */}
      {isExpired && (
        <div className="no-print sticky top-0 z-50 border-b px-4 py-3 text-center font-body text-sm" style={{ backgroundColor: '#fef3cd', borderColor: '#ffc107', color: '#856404' }}>
          <Clock className="mr-2 inline h-4 w-4" />
          Termin ważności oferty minął {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}. Skontaktuj się z nami w celu przedłużenia.
        </div>
      )}
      {isAccepted && (
        <div className="no-print sticky top-0 z-50 border-b px-4 py-3 text-center font-body text-sm" style={{ backgroundColor: '#d4edda', borderColor: '#28a745', color: '#155724' }}>
          <Check className="mr-2 inline h-4 w-4" />
          Oferta zaakceptowana {offer.accepted_at ? new Date(offer.accepted_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
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
            <p style={{ margin: '2px 0 0 0' }}>Data: {formatDate(offer.created_at)}</p>
            {offer.valid_until && <p style={{ margin: '2px 0 0 0' }}>Ważna do: {formatDate(offer.valid_until)}</p>}
          </div>
        </div>
      </div>

      {/* Onboarding overlay */}
      <div className="no-print">
        {showOnboarding && (
          <OnboardingOverlay
            variantCount={offer.offer_variants.length}
            editableCount={editableCount}
            onDismiss={() => setOnboardingDismissed(true)}
          />
        )}
        <EditableTooltip show={onboardingDismissed && editableCount > 0} onDismiss={() => {}} />
      </div>

      {/* 1. COMPACT HERO */}
      <section className="relative overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          {heroPhoto ? (
            <img
              src={heroPhoto.photo_url}
              alt={heroPhoto.alt_text || heroHeadline}
              className="h-full w-full object-cover object-center"
              style={{ minHeight: '110%' }}
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary, #1A1A1A), var(--theme-secondary, #333))`,
              }}
            />
          )}
        </motion.div>
        <div
          className="absolute inset-0"
          style={{
            background: heroPhoto
              ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)'
              : 'rgba(0,0,0,0.2)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 text-center md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="font-display text-3xl font-bold text-ivory md:text-4xl">
              {COMPANY.name}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-3 flex flex-wrap items-center justify-center gap-3 font-body text-sm text-ivory/70 tracking-wide"
          >
            <span>{offer.offer_number}</span>
            <span className="hidden sm:inline">•</span>
            <span>{heroHeadline}</span>
            {offer.valid_until && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Ważna do: {formatDate(offer.valid_until)}
                </span>
              </>
            )}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            onClick={handlePrint}
            className="no-print mt-4 inline-flex items-center gap-2 rounded-xl bg-ivory/15 px-4 py-2 font-body text-sm font-medium text-ivory/90 backdrop-blur-md transition-all hover:bg-ivory/25"
          >
            <FileDown className="h-4 w-4" />
            Pobierz PDF
          </motion.button>
        </div>
      </section>

      {/* 2. GREETING + AI SUMMARY — collapsed */}
      {combinedGreeting && (
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="py-6 md:py-8"
        >
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p
              className="font-body text-base leading-relaxed md:text-lg"
              style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.8 }}
            >
              {greetingExpanded || !greetingTruncation?.isTruncated
                ? combinedGreeting
                : greetingTruncation.truncated}
            </p>
            {greetingTruncation?.isTruncated && (
              <button
                onClick={() => setGreetingExpanded(!greetingExpanded)}
                className="mt-2 inline-flex items-center gap-1 font-body text-sm font-medium transition-colors"
                style={{ color: 'var(--theme-primary, #1A1A1A)' }}
              >
                {greetingExpanded ? 'Zwiń' : 'Czytaj więcej'}
                <ChevronDown className={`h-4 w-4 transition-transform ${greetingExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </motion.section>
      )}

      {/* 3. EVENT DETAILS — compact grid */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="py-6 md:py-8"
      >
        <div className="mx-auto max-w-4xl px-6">
          <motion.h2
            variants={fadeInUp}
            className="mb-4 text-center font-display text-xl font-bold"
            style={{ color: 'var(--theme-text, #1A1A1A)' }}
          >
            Szczegóły wydarzenia
          </motion.h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {eventDetails.map((detail) => (
              <motion.div
                key={detail.label}
                variants={fadeInUp}
                className="flex items-center gap-3 rounded-xl bg-ivory px-4 py-3 shadow-sm"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
                >
                  <detail.icon className="h-4 w-4" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
                    {detail.label}
                  </span>
                  <span className="font-body text-sm font-semibold text-charcoal">
                    {detail.value}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 4. MENU */}
      {offer.offer_variants.length > 0 && (
        <MenuVariantsSection
          variants={offer.offer_variants}
          pricingMode={offer.pricing_mode}
          peopleCount={offer.people_count ?? 1}
          priceDisplayMode={offer.price_display_mode}
          activeVariantId={activeVariantId ?? undefined}
          onActiveVariantChange={setActiveVariantId}
          modifications={modifications}
          onModificationChange={handleModificationChange}
        />
      )}

      {/* 6. SERVICES & LOGISTICS */}
      <ServicesLogisticsSection
        offer={offer}
        priceDisplayMode={offer.price_display_mode}
      />

      {/* 7. CALCULATION */}
      <CalculationSection offer={offer} modifications={modifications} />

      {/* 8. TERMS */}
      <TermsSection />

      {/* 9. COMMUNICATION */}
      <div className="no-print">
        <CommunicationSection offerId={offer.id} offerNumber={offer.offer_number} clientName={offer.clients?.name ?? undefined} actionsDisabled={actionsDisabled} />
      </div>

      {/* 10. ACCEPTANCE */}
      <div className="no-print">
        {!offerAccepted && (
          <div id="acceptance-section">
            <AcceptanceSection offer={offer} onAccepted={() => setOfferAccepted(true)} activeVariantId={activeVariantId} actionsDisabled={actionsDisabled} />
          </div>
        )}
      </div>

      {/* 11. CONTACT */}
      <ContactSection onPrint={handlePrint} />

      {/* Floating changes panel */}
      <div className="no-print">
        <ChangesPanel
          modifications={modifications}
          offer={offer}
          onClearModifications={handleClearModifications}
          originalTotal={originalTotal}
          proposedTotal={proposedTotal}
          actionsDisabled={actionsDisabled}
        />
      </div>

      {/* FOOTER — compact */}
      <footer
        className="py-4 text-center"
        style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
      >
        <p className="font-body text-sm text-ivory/60">
          © {new Date().getFullYear()} {COMPANY.name}
        </p>
      </footer>

      {/* Print-only footer */}
      <div className="print-only hidden" style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #ccc', marginTop: '20px', fontSize: '9pt', color: '#666' }}>
        {COMPANY.name} | {COMPANY.email} | Wygenerowano: {new Date().toLocaleDateString('pl-PL')}
      </div>
    </div>
  );
};
