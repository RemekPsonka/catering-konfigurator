import { useState } from 'react';
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
}

export const AcceptanceSection = ({ offer, onAccepted }: AcceptanceSectionProps) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    offer.offer_variants.length === 1 ? offer.offer_variants[0].id : null,
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const acceptOffer = useAcceptOffer();

  const isVisible = ['ready', 'sent', 'viewed', 'revision'].includes(offer.status) && !offer.accepted_at && !accepted;

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
          // Fire-and-forget notification
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

  // Show success state
  if (accepted) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-16 md:py-24"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
          >
            <motion.svg
              viewBox="0 0 24 24"
              className="h-10 w-10 text-ivory"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </motion.svg>
          </motion.div>
          <h2 className="font-display text-2xl font-bold md:text-3xl" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Dziękujemy za akceptację!
          </h2>
          <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">
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
        className="py-16 md:py-24"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, var(--theme-bg, #FAF7F2)), color-mix(in srgb, var(--theme-accent, #c9a84c) 5%, var(--theme-bg, #FAF7F2)))`,
        }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <h2
            className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
            style={{ color: 'var(--theme-text, #1A1A1A)' }}
          >
            Akceptacja oferty
          </h2>

          {/* Variant selection */}
          {multiVariant && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offer.offer_variants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <motion.button
                    key={v.id}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(var(--theme-primary-rgb, 26,26,26), 0.15)' }}
                    onClick={() => setSelectedVariantId(v.id)}
                    className="rounded-2xl border-2 p-6 text-left transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--theme-primary, #1A1A1A)' : 'transparent',
                      backgroundColor: '#FFFFF0',
                      boxShadow: isSelected ? '0 0 40px rgba(var(--theme-primary-rgb, 26,26,26), 0.15)' : '0 20px 60px rgba(0,0,0,0.08)',
                    }}
                  >
                    <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {v.name}
                    </h3>
                    {v.description && (
                      <p className="mt-1 font-body text-sm text-charcoal/60">{v.description}</p>
                    )}
                    {v.price_per_person != null && (
                      <p className="mt-3 font-display text-xl font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                        {formatCurrency(v.price_per_person)}/os.
                      </p>
                    )}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-3 flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
                      >
                        <Check className="h-4 w-4 text-ivory" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Accept button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(var(--theme-primary-rgb, 26,26,26), 0.15)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAccept}
              disabled={multiVariant && !selectedVariantId}
              className="rounded-xl px-12 py-5 font-body text-xl font-semibold text-ivory shadow-glow transition-all disabled:opacity-50"
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
              className="w-full max-w-md rounded-2xl bg-ivory p-8 shadow-premium"
            >
              <h3 className="font-display text-xl font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                Potwierdzenie akceptacji
              </h3>
              <p className="mt-4 font-body text-charcoal/70 leading-relaxed">
                Czy na pewno akceptujesz{selectedVariant ? ` wariant "${selectedVariant.name}"` : ' tę ofertę'}?
                {selectedVariant?.total_value != null && (
                  <span className="block mt-2 font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    Wartość: {formatCurrency(selectedVariant.total_value)}
                  </span>
                )}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl border-2 py-3 font-body font-semibold transition-colors"
                  style={{ borderColor: 'var(--theme-primary, #1A1A1A)', color: 'var(--theme-primary, #1A1A1A)' }}
                >
                  Anuluj
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={acceptOffer.isPending}
                  onClick={handleConfirm}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-body font-semibold text-ivory disabled:opacity-70"
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
