import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useScroll } from 'framer-motion';
import { usePublicOffer, useMarkOfferViewed } from '@/hooks/use-public-offer';
import { fireNotification } from '@/hooks/use-notifications';
import { usePublicEventProfile, usePublicEventPhotos } from '@/hooks/use-public-event-profile';
import { usePhotoLibrary, useHeroPhoto } from '@/hooks/use-photo-library';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { calculateOfferTotals } from '@/lib/calculations';
import { MenuVariantsSection } from '@/components/public/menu-variants-section';
import { ServicesLogisticsSection } from '@/components/public/services-logistics-section';
import { CalculationSection } from '@/components/public/calculation-section';
import { ChangesPanel } from '@/components/public/changes-panel';
import { TermsSection } from '@/components/public/terms-section';
import { CommunicationSection } from '@/components/public/communication-section';
import { AcceptanceSection } from '@/components/public/acceptance-section';
import { ContactSection } from '@/components/public/contact-section';
import { OnboardingOverlay } from '@/components/public/onboarding-overlay';
import { EventGallerySection } from '@/components/public/event-gallery-section';
import { EditableTooltip } from '@/components/public/editable-tooltip';
import { UpsellSection } from '@/components/public/upsell-section';
import { SuggestedServicesSection } from '@/components/public/suggested-services-section';
import { COMPANY } from '@/lib/company-config';
import { SocialProofStats } from '@/components/public/social-proof-stats';
import { ShareOffer } from '@/components/public/share-offer';
import { FaqSection } from '@/components/public/faq-section';
import { TestimonialsCarousel } from '@/components/public/testimonials-carousel';
import { getItemPrice } from '@/hooks/use-offer-variants';
import type { VariantWithItems } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';
import type { DishModification } from '@/components/public/dish-edit-panel';

import { isValidToken, loadGoogleFont } from '@/components/features/public-offer/offer-utils';
import { InvalidTokenScreen, LoadingScreen, NotFoundScreen, DraftScreen, LostScreen } from '@/components/features/public-offer/OfferStatusScreens';
import { OfferHeader } from '@/components/features/public-offer/OfferHeader';
import { CountdownTimer } from '@/components/public/countdown-timer';
import { OfferTracker } from '@/components/public/offer-tracker';
import { trackOfferEvent } from '@/lib/tracking';

export const PublicOfferPage = () => {
  const { publicToken } = useParams<{ publicToken: string }>();
  const tokenValid = isValidToken(publicToken);
  const { data: offer, isLoading, error } = usePublicOffer(tokenValid ? publicToken : undefined);
  const markViewed = useMarkOfferViewed();
  const { scrollY } = useScroll();

  const [modifications, setModifications] = useState<Map<string, DishModification>>(new Map());
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const isFirstVisitRef = useRef<boolean | null>(null);
  const lastVariantTrackRef = useRef<number>(0);

  const handleVariantChange = useCallback((variantId: string | null) => {
    setActiveVariantId(variantId);
    if (variantId && offer) {
      const now = Date.now();
      if (now - lastVariantTrackRef.current > 30000) {
        lastVariantTrackRef.current = now;
        trackOfferEvent(offer.id, 'variant_compared', { variant_id: variantId });
      }
    }
  }, [offer]);

  const { data: libraryPhotos } = usePhotoLibrary(offer?.event_type);
  const { data: libraryHero } = useHeroPhoto(offer?.event_type);
  const { data: legacyEventPhotos } = usePublicEventPhotos(offer?.event_type);
  usePublicEventProfile(offer?.event_type);

  // Use photo_library with fallback to legacy event_type_photos
  const galleryPhotos = useMemo(() => {
    if (libraryPhotos && libraryPhotos.length > 0) {
      return libraryPhotos.map((p) => ({
        photo_url: p.photo_url,
        width: p.width,
        height: p.height,
        caption: p.caption,
        alt_text: p.alt_text,
        is_hero: false,
      }));
    }
    return legacyEventPhotos ?? [];
  }, [libraryPhotos, legacyEventPhotos]);

  const heroPhoto = useMemo(() => {
    if (libraryHero) return { photo_url: libraryHero.photo_url, alt_text: libraryHero.alt_text };
    return legacyEventPhotos?.find((p) => p.is_hero) ?? null;
  }, [libraryHero, legacyEventPhotos]);

  useEffect(() => {
    if (offer && !activeVariantId) {
      const sorted = [...offer.offer_variants].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      if (sorted.length > 0) setActiveVariantId(sorted[0].id);
    }
  }, [offer, activeVariantId]);

  const handleModificationChange = useCallback((itemId: string, mod: DishModification | undefined) => {
    setModifications((prev) => {
      const next = new Map(prev);
      if (mod) next.set(itemId, mod); else next.delete(itemId);
      return next;
    });
  }, []);

  const handleClearModifications = useCallback(() => setModifications(new Map()), []);

  const { originalTotal, proposedTotal } = useMemo(() => {
    if (!offer) return { originalTotal: 0, proposedTotal: 0 };
    const variants = offer.offer_variants as VariantWithItems[];
    const services = offer.offer_services as OfferServiceWithService[];
    const pc = offer.people_count ?? 1;
    const upsellTotal = offer.upsell_total ?? 0;
    const calcArgs = [offer.pricing_mode, pc, variants, services, offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0, upsellTotal] as const;
    const origTotals = calculateOfferTotals(...calcArgs);

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
    })) as VariantWithItems[];

    const propTotals = calculateOfferTotals(offer.pricing_mode, pc, adjustedVariants, services, offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0, upsellTotal);
    return { originalTotal: origTotals.grandTotal, proposedTotal: propTotals.grandTotal };
  }, [offer, modifications]);

  // Apply theme CSS custom properties
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
    const hexToRgb = (hex: string) => { const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16); return `${r}, ${g}, ${b}`; };
    try { root.style.setProperty('--theme-primary-rgb', hexToRgb(t.primary_color)); } catch { /* ignore */ }
    loadGoogleFont(t.font_family);
    loadGoogleFont(t.header_font);
    return () => {
      ['--theme-primary', '--theme-secondary', '--theme-accent', '--theme-bg', '--theme-text', '--theme-font', '--theme-header-font', '--theme-primary-rgb'].forEach((p) => root.style.removeProperty(p));
    };
  }, [offer?.offer_themes]);

  useEffect(() => { if (offer && isFirstVisitRef.current === null) isFirstVisitRef.current = !offer.viewed_at; }, [offer]);

  useEffect(() => {
    if (offer && !offer.viewed_at && offer.status === 'sent') {
      markViewed.mutate(offer.id);
      const eventTypeLabel = EVENT_TYPE_OPTIONS.find((e) => e.value === offer.event_type)?.label ?? offer.event_type;
      fireNotification({ offerId: offer.id, eventType: 'offer_viewed', title: `👁️ Klient otworzył ofertę ${offer.offer_number ?? ''}`, body: `${offer.clients?.name ?? 'Klient'} otworzył(a) ofertę. Typ: ${eventTypeLabel}, ${offer.people_count ?? '?'} osób.`, link: `/admin/offers/${offer.id}/edit` });
    }
  }, [offer?.id, offer?.viewed_at, offer?.status]);

  const isExpired = useMemo(() => offer?.valid_until ? new Date() > new Date(offer.valid_until) : false, [offer?.valid_until]);

  const editableCount = useMemo(() => {
    if (!offer) return 0;
    return offer.offer_variants.reduce((acc, v) => acc + v.variant_items.filter((item) => {
      const mods = (item.allowed_modifications ?? item.dishes?.modifiable_items) as unknown;
      return item.is_client_editable && mods && typeof mods === 'object';
    }).length, 0);
  }, [offer]);

  // Early returns
  if (!tokenValid) return <InvalidTokenScreen />;
  if (isLoading) return <LoadingScreen />;
  if (!offer || error) return <NotFoundScreen />;
  if (offer.status === 'draft') return <DraftScreen />;
  if (offer.status === 'lost') return <LostScreen />;

  const isAccepted = offer.status === 'accepted';
  const isWon = offer.status === 'won';
  const actionsDisabled = isAccepted || isWon || isExpired;
  const showOnboarding = isFirstVisitRef.current === true && !onboardingDismissed;

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)', color: 'var(--theme-text, #1A1A1A)' }}>
      <OfferTracker offerId={offer.id} />
      <OfferHeader offer={offer} heroPhoto={heroPhoto} scrollY={scrollY} isExpired={isExpired} isAccepted={isAccepted} isWon={isWon} />

      {offer.valid_until && !isExpired && (
        <div className="no-print">
          <CountdownTimer validUntil={offer.valid_until} isExpired={isExpired} />
        </div>
      )}

      <div className="no-print">
        {showOnboarding && <OnboardingOverlay variantCount={offer.offer_variants.length} editableCount={editableCount} onDismiss={() => setOnboardingDismissed(true)} />}
        <EditableTooltip show={onboardingDismissed && editableCount > 0} onDismiss={() => {}} />
      </div>

      {offer.offer_variants.length > 0 && (
        <div data-track-section="menu">
          <MenuVariantsSection variants={offer.offer_variants} pricingMode={offer.pricing_mode} peopleCount={offer.people_count ?? 1} priceDisplayMode={offer.price_display_mode} activeVariantId={activeVariantId ?? undefined} onActiveVariantChange={handleVariantChange} modifications={modifications} onModificationChange={handleModificationChange} acceptedVariantId={offer.accepted_variant_id} />
        </div>
      )}

      <div data-track-section="services">
        <ServicesLogisticsSection offer={offer} priceDisplayMode={offer.price_display_mode} />
      </div>
      <div data-track-section="calculation">
        <CalculationSection offer={offer} modifications={modifications} />
      </div>

      {galleryPhotos.length > 0 && (
        <div className="no-print">
          <EventGallerySection photos={galleryPhotos} />
        </div>
      )}

      <div className="no-print" data-track-section="upsell">
        <UpsellSection
          offerId={offer.id}
          eventType={offer.event_type}
          peopleCount={offer.people_count ?? 1}
          upsellEnabled={offer.upsell_enabled ?? true}
          actionsDisabled={actionsDisabled}
        />
        <SuggestedServicesSection
          offerId={offer.id}
          offerServices={offer.offer_services}
          peopleCount={offer.people_count ?? 1}
          upsellEnabled={offer.upsell_enabled ?? true}
          actionsDisabled={actionsDisabled}
        />
      </div>

      <div className="no-print">
        <SocialProofStats />
        <TestimonialsCarousel eventType={offer.event_type} />
        <div data-track-section="faq">
          <FaqSection offerId={offer.id} eventType={offer.event_type} />
        </div>
      </div>

      <TermsSection />

      <div className="no-print">
        <CommunicationSection offerId={offer.id} offerNumber={offer.offer_number} clientName={offer.clients?.name ?? undefined} actionsDisabled={actionsDisabled} />
      </div>

      <div className="no-print" data-track-section="acceptance">
        {!offerAccepted && (
          <div id="acceptance-section">
            <AcceptanceSection offer={offer} onAccepted={() => setOfferAccepted(true)} activeVariantId={activeVariantId} actionsDisabled={actionsDisabled} />
          </div>
        )}
      </div>

      <ContactSection onPrint={() => { const t = document.title; document.title = `Oferta_${(offer.offer_number ?? 'oferta').replace(/[^a-zA-Z0-9-]/g, '_')}_Catering_Slaski`; window.print(); document.title = t; }} />

      <div className="no-print">
        <ChangesPanel modifications={modifications} offer={offer} onClearModifications={handleClearModifications} originalTotal={originalTotal} proposedTotal={proposedTotal} actionsDisabled={actionsDisabled} />
        <ShareOffer offerId={offer.id} eventTypeLabel={EVENT_TYPE_OPTIONS.find((e) => e.value === offer.event_type)?.label ?? offer.event_type} eventDate={offer.event_date} />
      </div>

      <footer className="py-4 text-center" style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}>
        <p className="font-body text-sm text-ivory/60">© {new Date().getFullYear()} {COMPANY.name}</p>
      </footer>

      <div className="print-only hidden" style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #ccc', marginTop: '20px', fontSize: '9pt', color: '#666' }}>
        {COMPANY.name} | {COMPANY.email} | Wygenerowano: {new Date().toLocaleDateString('pl-PL')}
      </div>
    </div>
  );
};
