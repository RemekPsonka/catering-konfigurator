import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/calculations';
import { useAcceptOffer } from '@/hooks/use-public-offer';
import { fireNotification } from '@/hooks/use-notifications';
import { fadeInUp, scaleIn } from '@/lib/animations';
import type { PublicOffer } from '@/hooks/use-public-offer';

interface AcceptanceSectionProps {
  offer: PublicOffer;
  onAccepted: () => void;
  preSelectedVariantId?: string | null;
  actionsDisabled?: boolean;
}

export const AcceptanceSection = ({ offer, onAccepted, preSelectedVariantId, actionsDisabled = false }: AcceptanceSectionProps) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    offer.offer_variants.length === 1 ? offer.offer_variants[0].id : null,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const acceptOffer = useAcceptOffer();

  useEffect(() => {
    if (preSelectedVariantId) {
      setSelectedVariantId(preSelectedVariantId);
    }
  }, [preSelectedVariantId]);

  const isVisible = ['sent', 'viewed', 'revision'].includes(offer.status) && !offer.accepted_at && !accepted && !actionsDisabled;

  if (!isVisible) return null;

  const selectedVariant = offer.offer_variants.find((v) => v.id === selectedVariantId);
  const multiVariant = offer.offer_variants.length > 1;

  const handleAccept = () => {
    if (multiVariant && !selectedVariantId) {
      toast.error('Wybierz wariant przed akceptacją.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    acceptOffer.mutate(
      { offerId: offer.id, variantId: selectedVariantId },
      {
        onSuccess: () => {
          setShowConfirm(false);
          setAccepted(true);
          onAccepted();
          const clientName = offer.clients?.name ?? 'Klient';
          const variantName = selectedVariant?.name ?? 'brak';
          const totalValue = selectedVariant?.total_value ?? offer.total_value ?? 0;
          fireNotification({
            offerId: offer.id,
            eventType: 'offer_accepted',
            title: `🎉 Oferta zaakceptowana! ${offer.offer_number ?? ''}`,
            body: `${clientName} zaakceptował(a) ofertę! Wariant: ${variantName}, wartość: ${formatCurrency(totalValue)}. Zadzwoń i sfinalizuj!`,
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

          {/* Variant selection — compact radio row */}
          {multiVariant && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              {offer.offer_variants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className="inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-left transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--theme-primary, #1A1A1A)' : 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 20%, transparent)',
                      backgroundColor: isSelected ? 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 8%, white)' : 'white',
                    }}
                  >
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--theme-primary, #1A1A1A)' : 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 30%, transparent)',
                        backgroundColor: isSelected ? 'var(--theme-primary, #1A1A1A)' : 'transparent',
                      }}
                    >
                      {isSelected && <Check className="h-3 w-3 text-ivory" />}
                    </div>
                    <div>
                      <span className="font-display text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                        {v.name}
                      </span>
                      {v.price_per_person != null && (
                        <span className="ml-2 font-body text-sm font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                          {formatCurrency(v.price_per_person)}/os.
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
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
                {selectedVariant?.total_value != null && (
                  <span className="block mt-2 font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    Wartość: {formatCurrency(selectedVariant.total_value)}
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