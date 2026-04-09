import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { usePublicOffer, useMarkOfferViewed } from '@/hooks/use-public-offer';
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
} from 'lucide-react';
import { MenuVariantsSection } from '@/components/public/menu-variants-section';
import { ServicesSection } from '@/components/public/services-section';
import { CalculationSection } from '@/components/public/calculation-section';
import { ChangesPanel } from '@/components/public/changes-panel';
import { TermsSection } from '@/components/public/terms-section';
import { CorrectionsSection } from '@/components/public/corrections-section';
import { AcceptanceSection } from '@/components/public/acceptance-section';
import { ContactSection } from '@/components/public/contact-section';
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

export const PublicOfferPage = () => {
  const { publicToken } = useParams<{ publicToken: string }>();
  const { data: offer, isLoading, error } = usePublicOffer(publicToken);
  const markViewed = useMarkOfferViewed();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -50]);

  const [modifications, setModifications] = useState<Map<string, DishModification>>(new Map());
  const [offerAccepted, setOfferAccepted] = useState(false);

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

  // Calculate totals for changes panel
  const { originalTotal, proposedTotal } = useMemo(() => {
    if (!offer) return { originalTotal: 0, proposedTotal: 0 };
    const variants = offer.offer_variants as unknown as VariantWithItems[];
    const services = offer.offer_services as unknown as OfferServiceWithService[];
    const origTotals = calculateOfferTotals(
      offer.pricing_mode, offer.people_count, variants, services,
      offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0,
    );

    // Apply modifications
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

    // Parse hex to RGB for glow shadow
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

  // Mark as viewed on first open
  useEffect(() => {
    if (offer && !offer.viewed_at && offer.status === 'sent') {
      markViewed.mutate(offer.id);
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
            Ta oferta nie istnieje lub nie jest już dostępna.
          </p>
        </motion.div>
      </div>
    );
  }

  // Expired
  if (isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg text-center"
        >
          <Clock className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">
            Ta oferta wygasła
          </h1>
          <p className="mt-2 font-body text-charcoal/50">
            {offer.valid_until &&
              new Date(offer.valid_until).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
          </p>
          <p className="mt-6 font-body text-lg text-charcoal/60 leading-relaxed">
            Skontaktuj się z nami, aby otrzymać aktualną propozycję.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href="tel:+48123456789"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-body font-semibold text-ivory tracking-wide transition-all"
              style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
            >
              <Phone className="h-4 w-4" />
              Zadzwoń do nas
            </a>
            <a
              href="mailto:kontakt@cateringsl.pl"
              className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal"
            >
              <Mail className="h-4 w-4" />
              kontakt@cateringsl.pl
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

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)', color: 'var(--theme-text, #1A1A1A)' }}>
      {/* 1. HERO */}
      <section className="relative min-h-[50vh] overflow-hidden md:min-h-[60vh]">
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0"
        >
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, var(--theme-primary, #1A1A1A), var(--theme-secondary, #333))`,
            }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-charcoal/20" />

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

          {eventTypeInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-6 text-4xl md:text-6xl"
            >
              {eventTypeInfo.emoji}
            </motion.div>
          )}

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

      {/* 3. SZCZEGÓŁY EVENTU */}
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

      {/* 4. AI PODSUMOWANIE */}
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

      {/* 5. WARIANTY MENU */}
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

      {/* 6. USŁUGI DODATKOWE */}
      {offer.offer_services.length > 0 && (
        <ServicesSection
          services={offer.offer_services}
          priceDisplayMode={offer.price_display_mode}
        />
      )}

      {/* 7. KALKULACJA */}
      <CalculationSection offer={offer} modifications={modifications} />

      {/* 8-11: Placeholder — warunki, zmiany, akceptacja, kontakt — P-3.4 – P-3.5 */}

      {/* 12. FOOTER */}
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
    </div>
  );
};
