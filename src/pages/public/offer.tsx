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
} from 'lucide-react';
import { MenuVariantsSection } from '@/components/public/menu-variants-section';
import { ServicesSection } from '@/components/public/services-section';
import { CalculationSection } from '@/components/public/calculation-section';
import { ChangesPanel } from '@/components/public/changes-panel';
import { TermsSection } from '@/components/public/terms-section';
import { CommunicationSection } from '@/components/public/communication-section';
import { AcceptanceSection } from '@/components/public/acceptance-section';
import { ContactSection } from '@/components/public/contact-section';
import { LogisticsSection } from '@/components/public/logistics-section';
import { OnboardingOverlay } from '@/components/public/onboarding-overlay';
import { EditableTooltip } from '@/components/public/editable-tooltip';
import { VariantComparisonSection } from '@/components/public/variant-comparison-section';
import { AboutCateringSection } from '@/components/public/about-catering-section';
import { FeaturesSection } from '@/components/public/features-section';
import { EventGallerySection } from '@/components/public/event-gallery-section';
import { TestimonialSection } from '@/components/public/testimonial-section';
import type { DishModification } from '@/components/public/dish-edit-panel';
import { getItemPrice } from '@/hooks/use-offer-variants';
import type { VariantWithItems } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

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
  // Old format: 64-char hex
  if (/^[a-f0-9]{64}$/.test(token)) return true;
  // New format: 12-char alphanumeric (safe chars, no 0/O/1/l/I)
  if (/^[A-HJ-NP-Za-hj-km-np-z2-9]{12}$/.test(token)) return true;
  return false;
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
  const [preSelectedVariantId, setPreSelectedVariantId] = useState<string | null>(null);
  const isFirstVisitRef = useRef<boolean | null>(null);

  // Fetch event profile data
  const { data: eventProfile } = usePublicEventProfile(offer?.event_type);
  const { data: eventPhotos } = usePublicEventPhotos(offer?.event_type);

  const heroPhoto = useMemo(
    () => eventPhotos?.find((p) => p.is_hero) ?? null,
    [eventPhotos],
  );

  const features = useMemo(() => {
    if (!eventProfile?.features) return [];
    try {
      const parsed = eventProfile.features as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [eventProfile?.features]);

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

  // Calculate totals for changes panel
  const { originalTotal, proposedTotal } = useMemo(() => {
    if (!offer) return { originalTotal: 0, proposedTotal: 0 };
    const variants = offer.offer_variants as unknown as VariantWithItems[];
    const services = offer.offer_services as unknown as OfferServiceWithService[];
    const origTotals = calculateOfferTotals(
      offer.pricing_mode, offer.people_count, variants, services,
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
      offer.pricing_mode, offer.people_count, adjustedVariants, services,
      offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0,
    );

    return { originalTotal: origTotals.grandTotal, proposedTotal: propTotals.grandTotal };
  }, [offer, modifications]);

  // Set CSS custom properties from theme
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

  // Track first visit before marking as viewed
  useEffect(() => {
    if (offer && isFirstVisitRef.current === null) {
      isFirstVisitRef.current = !offer.viewed_at;
    }
  }, [offer]);

  // Mark as viewed on first open + fire notification
  useEffect(() => {
    if (offer && !offer.viewed_at && offer.status === 'sent') {
      markViewed.mutate(offer.id);
      // Fire-and-forget notification
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

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-charcoal/20 border-t-charcoal" />
          <p className="font-body text-charcoal/60 tracking-wide">Ładowanie oferty...</p>
        </motion.div>
      </div>
    );
  }

  // Not found
  if (!offer || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">
            Nie znaleziono oferty
          </h1>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">
            Sprawdź link lub skontaktuj się z nami.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/offer/find"
              className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 font-body font-semibold text-ivory tracking-wide transition-all hover:bg-charcoal/90"
            >
              <Search className="h-4 w-4" />
              Szukaj oferty
            </a>
            <a
              href="mailto:zamowienia@cateringslaski.pl"
              className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal"
            >
              <Mail className="h-4 w-4" />
              Skontaktuj się z nami
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Status flags for conditional rendering
  const isDraft = offer?.status === 'draft';
  const isLost = offer?.status === 'lost';
  const isAccepted = offer?.status === 'accepted';
  const isWon = offer?.status === 'won';

  // Actions are disabled for: draft, accepted, won, lost, expired
  const actionsDisabled = isDraft || isLost || isAccepted || isWon || isExpired;

  // Draft — show "being updated" page (no content)
  if (isDraft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg text-center">
          <Sparkles className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Ta oferta jest w trakcie aktualizacji</h1>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">
            Wróć później lub skontaktuj się z nami.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <a href="tel:+48123456789" className="inline-flex items-center gap-2 font-body text-charcoal/80 transition-colors hover:text-charcoal">
              <Phone className="h-4 w-4" /> +48 123 456 789
            </a>
            <a href="mailto:zamowienia@cateringslaski.pl" className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal">
              <Mail className="h-4 w-4" /> zamowienia@cateringslaski.pl
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Lost — show "offer closed" page (no content)
  if (isLost) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg text-center">
          <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Oferta zamknięta</h1>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">
            Ta oferta została zamknięta. Jeśli chcesz wznowić rozmowę, skontaktuj się z nami.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <a href="tel:+48123456789" className="inline-flex items-center gap-2 font-body text-charcoal/80 transition-colors hover:text-charcoal">
              <Phone className="h-4 w-4" /> +48 123 456 789
            </a>
            <a href="mailto:zamowienia@cateringslaski.pl" className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal">
              <Mail className="h-4 w-4" /> zamowienia@cateringslaski.pl
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString('pl-PL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
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

  const heroHeadline = eventProfile?.headline || (eventTypeInfo ? `${eventTypeInfo.emoji} ${eventTypeInfo.label}` : 'Catering Śląski');

  const showOnboarding = isFirstVisitRef.current === true && !onboardingDismissed;

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
            <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: 0 }}>Catering Śląski</h1>
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

        {/* Editable tooltip */}
        <EditableTooltip show={onboardingDismissed && editableCount > 0} onDismiss={() => {}} />
      </div>
      {/* 1. HERO */}
      <section className="relative min-h-[50vh] overflow-hidden md:min-h-[60vh]">
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0"
        >
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
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: heroPhoto
              ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)'
              : 'rgba(0,0,0,0.2)',
          }}
        />

        <div className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center px-4 text-center md:min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="font-display text-4xl font-bold text-ivory md:text-6xl lg:text-7xl">
              Catering Śląski
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-3 font-body text-ivory/70 tracking-wide"
          >
            {offer.offer_number}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            onClick={handlePrint}
            className="no-print mt-4 inline-flex items-center gap-2 rounded-xl bg-ivory/15 px-5 py-2.5 font-body text-sm font-medium text-ivory/90 backdrop-blur-md transition-all hover:bg-ivory/25"
          >
            <FileDown className="h-4 w-4" />
            Pobierz ofertę PDF
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-6 font-display text-xl font-semibold text-ivory/90 md:text-2xl"
          >
            {heroHeadline}
          </motion.div>

          {offer.valid_until && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-ivory/10 px-5 py-2.5 backdrop-blur-md"
            >
              <Clock className="h-4 w-4 text-ivory/80" />
              <span className="font-body text-sm text-ivory/80 tracking-wide">
                Ważna do: {formatDate(offer.valid_until)}
              </span>
            </motion.div>
          )}
        </div>
      </section>

      {/* 2. POWITANIE */}
      {offer.greeting_text && (
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="py-16 md:py-24"
        >
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="relative font-display text-xl leading-relaxed md:text-2xl" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
              <span className="absolute -left-4 -top-6 text-5xl opacity-20 md:-left-8 md:text-7xl" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                „
              </span>
              {offer.greeting_text}
              <span className="absolute -bottom-8 -right-4 text-5xl opacity-20 md:-right-8 md:text-7xl" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                "
              </span>
            </div>
          </div>
        </motion.section>
      )}

      {/* 3. AI PODSUMOWANIE */}
      {offer.ai_summary && (
        <motion.section
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="py-16 md:py-24"
          style={{ backgroundColor: 'var(--theme-secondary, #f0ebe3)', opacity: 0.97 }}
        >
          <div className="mx-auto max-w-3xl px-6 text-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="mb-4 inline-block"
            >
              <Sparkles className="h-7 w-7" style={{ color: 'var(--theme-accent, #c9a84c)' }} />
            </motion.div>
            <p className="font-body text-lg italic leading-relaxed text-charcoal/80 md:text-xl">
              {offer.ai_summary}
            </p>
          </div>
        </motion.section>
      )}

      {/* 4. O NASZYM CATERINGU */}
      {eventProfile?.description_long && (
        <AboutCateringSection descriptionLong={eventProfile.description_long} />
      )}

      {/* 5. DLACZEGO MY — wyróżniki */}
      {features.length > 0 && <FeaturesSection features={features} />}

      {/* 6. GALERIA REALIZACJI */}
      {eventPhotos && eventPhotos.length > 0 && (
        <EventGallerySection photos={eventPhotos} />
      )}

      {/* 7. SZCZEGÓŁY EVENTU */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="py-16 md:py-24"
      >
        <div className="mx-auto max-w-4xl px-6">
          <motion.h2
            variants={fadeInUp}
            className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
            style={{ color: 'var(--theme-text, #1A1A1A)' }}
          >
            Szczegóły wydarzenia
          </motion.h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {eventDetails.map((detail) => (
              <motion.div
                key={detail.label}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex items-start gap-4 rounded-2xl bg-ivory p-6 shadow-premium"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
                >
                  <detail.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
                    {detail.label}
                  </p>
                  <p className="mt-1 font-body text-base font-semibold text-charcoal">
                    {detail.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 8. WARIANTY MENU */}
      {offer.offer_variants.length > 0 && (
        <MenuVariantsSection
          variants={offer.offer_variants}
          pricingMode={offer.pricing_mode}
          peopleCount={offer.people_count}
          priceDisplayMode={offer.price_display_mode}
          modifications={modifications}
          onModificationChange={handleModificationChange}
        />
      )}

      {/* 9. USŁUGI DODATKOWE */}
      {offer.offer_services.length > 0 && (
        <ServicesSection
          services={offer.offer_services}
          priceDisplayMode={offer.price_display_mode}
        />
      )}

      {/* 10. KALKULACJA */}
      <CalculationSection offer={offer} modifications={modifications} />

      {/* 10.5. LOGISTYKA */}
      <LogisticsSection offer={offer} />

      {/* 10.6. PORÓWNANIE WARIANTÓW */}
      {offer.offer_variants.length >= 2 && (
        <VariantComparisonSection
          variants={offer.offer_variants}
          pricingMode={offer.pricing_mode}
          peopleCount={offer.people_count}
          priceDisplayMode={offer.price_display_mode}
          onSelectVariant={setPreSelectedVariantId}
        />
      )}

      {/* 11. OPINIA KLIENTA */}
      {eventProfile?.testimonial_text && (
        <TestimonialSection
          text={eventProfile.testimonial_text}
          author={eventProfile.testimonial_author}
          event={eventProfile.testimonial_event}
        />
      )}

      {/* 12. WARUNKI OFERTY */}
      <TermsSection />

      {/* 13. PYTANIA I UWAGI + HISTORIA KOMUNIKACJI */}
      <div className="no-print">
        <CommunicationSection offerId={offer.id} offerNumber={offer.offer_number} clientName={offer.clients?.name ?? undefined} />
      </div>

      {/* 14. AKCEPTACJA OFERTY */}
      <div className="no-print">
        {!offerAccepted && (
          <div id="acceptance-section">
            <AcceptanceSection offer={offer} onAccepted={() => setOfferAccepted(true)} preSelectedVariantId={preSelectedVariantId} />
          </div>
        )}
      </div>

      {/* 15. KONTAKT */}
      <ContactSection ctaText={eventProfile?.cta_text} onPrint={handlePrint} />

      {/* Floating changes panel */}
      <div className="no-print">
        <ChangesPanel
        modifications={modifications}
        offer={offer}
        onClearModifications={handleClearModifications}
          originalTotal={originalTotal}
          proposedTotal={proposedTotal}
        />
      </div>

      {/* 16. FOOTER */}
      <motion.footer
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-12 text-center"
        style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-4 h-px w-full opacity-20" style={{ backgroundColor: '#FAF7F2' }} />
          <p className="font-display text-lg font-semibold text-ivory/90">
            Catering Śląski
          </p>
          <p className="mt-1 font-body text-sm text-ivory/50 tracking-wide">
            © {new Date().getFullYear()} Catering Śląski. Wszystkie prawa zastrzeżone.
          </p>
        </div>
      </motion.footer>

      {/* Print-only footer */}
      <div className="print-only hidden" style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #ccc', marginTop: '20px', fontSize: '9pt', color: '#666' }}>
        Catering Śląski | zamowienia@cateringslaski.pl | Wygenerowano: {new Date().toLocaleDateString('pl-PL')}
      </div>
    </div>
  );
};
