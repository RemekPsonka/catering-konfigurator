import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency, calculateOfferTotals, calculateVariantDishesTotal } from '@/lib/calculations';
import { useAcceptOffer } from '@/hooks/use-public-offer';
import { fireNotification } from '@/hooks/use-notifications';
import { fadeInUp, scaleIn } from '@/lib/animations';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { VariantWithItems } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

interface AcceptanceSectionProps {
  offer: PublicOffer;
  onAccepted: () => void;
  activeVariantId?: string | null;
  actionsDisabled?: boolean;
}

export const AcceptanceSection = ({ offer, onAccepted, activeVariantId, actionsDisabled = false }: AcceptanceSectionProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const acceptOffer = useAcceptOffer();

  const isVisible = ['sent', 'viewed', 'revision'].includes(offer.status) && !offer.accepted_at && !accepted && !actionsDisabled;
  if (!isVisible) return null;

  const multiVariant = offer.offer_variants.length > 1;
  const selectedVariantId = multiVariant ? activeVariantId : offer.offer_variants[0]?.id;
  const selectedVariant = offer.offer_variants.find((v) => v.id === selectedVariantId);

  // Calculate prices dynamically to avoid 0 zł bug
  const variants = offer.offer_variants as unknown as VariantWithItems[];
  const services = offer.offer_services as unknown as OfferServiceWithService[];
  const peopleCount = offer.people_count ?? 1;
  const totals = calculateOfferTotals(
    offer.pricing_mode, peopleCount, variants, services,
    offer.discount_percent ?? 0, offer.discount_value ?? 0, offer.delivery_cost ?? 0,
  );
  const selectedTotal = totals.variantTotals.find((vt) => vt.id === selectedVariantId);
  const displayPricePerPerson = selectedTotal?.pricePerPerson ?? 0;
  const displayGrandTotal = selectedTotal?.grandTotal ?? 0;

  const handleAccept = () => {
    if (multiVariant && !selectedVariantId) {
      toast.error('Wybierz wariant w sekcji Menu przed akceptacją.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    acceptOffer.mutate(
      { offerId: offer.id, variantId: selectedVariantId ?? null },
      {
        onSuccess: () => {
          setShowConfirm(false);
          setAccepted(true);
          onAccepted();
          const clientName = offer.clients?.name ?? 'Klient';
          const variantName = selectedVariant?.name ?? 'brak';
          fireNotification({
            offerId: offer.id,
            eventType: 'offer_accepted',
            title: `🎉 Oferta zaakceptowana! ${offer.offer_number ?? ''}`,
            body: `${clientName} zaakceptował(a) ofertę! Wariant: ${variantName}, wartość: ${formatCurrency(displayGrandTotal)}. Zadzwoń i sfinalizuj!`,
            link: `/admin/offers/${offer.id}/edit`,
          });
        },
        onError: () => {
          toast.error('Nie udało się zaakceptować oferty. Spróbuj ponownie.');
          setShowConfirm(false);
        },
      },
    );
  };

  if (accepted) {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
          >
            <motion.svg viewBox="0 0 24 24" className="h-8 w-8 text-ivory" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
            </motion.svg>
          </motion.div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Dziękujemy za akceptację!
          </h2>
          <p className="mt-2 font-body text-sm text-charcoal/60 leading-relaxed">
            Skontaktujemy się w sprawie dalszych szczegółów.
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="py-8 md:py-12"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, var(--theme-bg, #FAF7F2)), color-mix(in srgb, var(--theme-accent, #c9a84c) 5%, var(--theme-bg, #FAF7F2)))`,
        }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <h2
            className="mb-6 text-center font-display text-xl font-bold"
            style={{ color: 'var(--theme-text, #1A1A1A)' }}
          >
            Akceptacja oferty
          </h2>

          {/* Show which variant is selected */}
          {multiVariant && !selectedVariantId && (
            <p className="mb-6 text-center font-body text-sm" style={{ color: 'var(--theme-accent, #c9a84c)' }}>
              Wybierz wariant w sekcji Menu powyżej, aby móc zaakceptować ofertę.
            </p>
          )}

          {selectedVariant && (
            <div className="mb-6 text-center">
              <p className="font-body text-sm" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.7 }}>
                Akceptujesz wariant:
              </p>
              <p className="mt-1 font-display text-lg font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                {selectedVariant.name}
                {displayPricePerPerson > 0 && (
                  <span className="ml-2 font-body text-base" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                    — {formatCurrency(displayPricePerPerson)}/os.
                  </span>
                )}
              </p>
              {displayGrandTotal > 0 && (
                <p className="mt-0.5 font-body text-sm" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}>
                  Łącznie: {formatCurrency(displayGrandTotal)}
                </p>
              )}
            </div>
          )}

          {/* Accept button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(var(--theme-primary-rgb, 26,26,26), 0.15)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAccept}
              disabled={multiVariant && !selectedVariantId}
              className="rounded-xl px-10 py-4 font-body text-lg font-semibold text-ivory shadow-glow transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
            >
              Akceptuję ofertę
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-lg p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-ivory p-6 shadow-premium"
            >
              <h3 className="font-display text-lg font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                Potwierdzenie akceptacji
              </h3>
              <p className="mt-3 font-body text-sm text-charcoal/70 leading-relaxed">
                Czy na pewno akceptujesz{selectedVariant ? ` wariant "${selectedVariant.name}"` : ' tę ofertę'}?
                {displayGrandTotal > 0 && (
                  <span className="block mt-2 font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    Wartość: {formatCurrency(displayGrandTotal)}
                  </span>
                )}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl border-2 py-2.5 font-body text-sm font-semibold transition-colors"
                  style={{ borderColor: 'var(--theme-primary, #1A1A1A)', color: 'var(--theme-primary, #1A1A1A)' }}
                >
                  Anuluj
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={acceptOffer.isPending}
                  onClick={handleConfirm}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-body text-sm font-semibold text-ivory disabled:opacity-70"
                  style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
                >
                  {acceptOffer.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="h-5 w-5 rounded-full border-2 border-ivory/30 border-t-ivory"
                    />
                  ) : (
                    'Potwierdzam'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
