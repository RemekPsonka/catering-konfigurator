import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { calculateOfferTotals, formatCurrency } from '@/lib/calculations';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { VariantWithItems } from '@/lib/calculations';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

interface StickyMobileCTAProps {
  offer: PublicOffer;
  activeVariantId?: string | null;
  visible: boolean;
  onAccept: () => void;
}

export const StickyMobileCTA = ({ offer, activeVariantId, visible, onAccept }: StickyMobileCTAProps) => {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // Appear after 30% of the page is scrolled
  const opacity = useTransform(scrollYProgress, [0.28, 0.32], [0, 1]);
  const translateY = useTransform(scrollYProgress, [0.28, 0.32], [40, 0]);

  const { pricePerPerson, grandTotal } = useMemo(() => {
    const variants = offer.offer_variants as VariantWithItems[];
    const services = offer.offer_services as OfferServiceWithService[];
    const peopleCount = offer.people_count ?? 1;
    const totals = calculateOfferTotals(
      offer.pricing_mode, peopleCount, variants, services,
      offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0,
    );
    const selectedId = activeVariantId ?? offer.offer_variants[0]?.id;
    const selected = totals.variantTotals.find((vt) => vt.id === selectedId) ?? totals.variantTotals[0];
    return {
      pricePerPerson: selected?.pricePerPerson ?? 0,
      grandTotal: selected?.grandTotal ?? 0,
    };
  }, [offer, activeVariantId]);

  const showPrice = offer.price_display_mode !== 'HIDDEN';
  const isPerPerson = offer.pricing_mode === 'PER_PERSON';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--theme-bg, #FAF7F2) 95%, transparent)',
            borderColor: 'color-mix(in srgb, var(--theme-text, #1A1A1A) 10%, transparent)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            opacity: reduceMotion ? 1 : opacity,
            y: reduceMotion ? 0 : translateY,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 40 }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            {showPrice && (pricePerPerson > 0 || grandTotal > 0) && (
              <div className="min-w-0 shrink">
                {isPerPerson ? (
                  <>
                    <p className="font-body text-[11px] leading-tight" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.6 }}>od</p>
                    <p className="font-display text-base font-bold leading-tight" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {formatCurrency(pricePerPerson)}<span className="text-xs font-normal">/os.</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-body text-[11px] leading-tight" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.6 }}>Łącznie</p>
                    <p className="font-display text-base font-bold leading-tight" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {formatCurrency(grandTotal)}
                    </p>
                  </>
                )}
              </div>
            )}
            <button
              onClick={onAccept}
              className="ml-auto flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-5 py-3 font-body text-base font-semibold text-ivory shadow-glow transition-transform active:scale-[0.98]"
              style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
            >
              Akceptuję ofertę
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
