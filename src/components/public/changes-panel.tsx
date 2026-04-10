import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronUp, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedPrice } from './animated-price';
import { formatCurrency } from '@/lib/calculations';
import { useSubmitProposal, usePublicOfferProposals, useSaveDraftProposal } from '@/hooks/use-public-offer';
import { fireNotification } from '@/hooks/use-notifications';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { DishModification } from './dish-edit-panel';
import { staggerContainer, fadeInUp } from '@/lib/animations';

interface ChangesPanelProps {
  modifications: Map<string, DishModification>;
  offer: PublicOffer;
  onClearModifications: () => void;
  originalTotal: number;
  proposedTotal: number;
  actionsDisabled?: boolean;
}

const MOD_ICONS: Record<string, string> = {
  swap: '🔄',
  variant: '🎨',
  split: '✂️',
  people: '👥',
};

export const ChangesPanel = ({
  modifications,
  offer,
  onClearModifications,
  originalTotal,
  proposedTotal,
  actionsDisabled = false,
}: ChangesPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const submitProposal = useSubmitProposal();
  const saveDraft = useSaveDraftProposal();
  const { data: pendingProposals } = usePublicOfferProposals(offer.id);
  const lastSavedRef = useRef<string>('');

  const priceDiff = proposedTotal - originalTotal;
  const hasChanges = modifications.size > 0;
  const isPP = offer.pricing_mode === 'PER_PERSON';
  const unit = isPP ? 'os.' : 'szt.';

  // Collect all variant items for mapping
  const allVariantItems = offer.offer_variants.flatMap((v) =>
    v.variant_items.map((vi) => ({
      id: vi.id,
      dishes: vi.dishes,
      custom_price: vi.custom_price,
      quantity: vi.quantity,
    })),
  );

  // Auto-save draft every 5 seconds
  useEffect(() => {
    if (!hasChanges) return;

    const interval = setInterval(() => {
      const key = JSON.stringify(Array.from(modifications.entries()));
      if (key === lastSavedRef.current) return;
      lastSavedRef.current = key;

      saveDraft.mutate(
        { offerId: offer.id, modifications, clientMessage: comment },
        {
          onSuccess: () => {
            setSavedIndicator(true);
            setTimeout(() => setSavedIndicator(false), 2000);
          },
        },
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [hasChanges, modifications, comment, offer.id]);

  const handleSubmit = useCallback(async () => {
    submitProposal.mutate(
      {
        offerId: offer.id,
        modifications,
        clientMessage: comment || undefined,
        originalTotal,
        proposedTotal,
        variantItems: allVariantItems,
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          toast.success('Propozycja wysłana! Manager przejrzy ją i wróci z odpowiedzią.');
          // Fire-and-forget notification
          const clientName = offer.clients?.name ?? 'Klient';
          fireNotification({
            offerId: offer.id,
            eventType: 'proposal_submitted',
            title: `🔄 Propozycja zmian — ${offer.offer_number ?? ''}`,
            body: `${clientName} proponuje zmiany (${modifications.size} pozycji). Sprawdź i zdecyduj.`,
            link: `/admin/offers/${offer.id}/messages`,
          });
          setTimeout(() => {
            setShowSuccess(false);
            onClearModifications();
            setComment('');
            setExpanded(false);
          }, 3000);
        },
        onError: () => {
          toast.error('Nie udało się wysłać propozycji. Spróbuj ponownie.');
        },
      },
    );
  }, [submitProposal, offer.id, modifications, comment, originalTotal, proposedTotal, allVariantItems, onClearModifications]);

  const changesList = Array.from(modifications.entries()).map(([itemId, mod]) => {
    const vi = allVariantItems.find((v) => v.id === itemId);
    const dishName = vi?.dishes?.display_name ?? 'Pozycja';
    const quantity = vi?.quantity ?? 1;
    return { itemId, mod, dishName, quantity };
  });

  if (actionsDisabled) return null;
  if (!hasChanges && !showSuccess && !(pendingProposals && pendingProposals.length > 0)) return null;

  return (
    <>
      {/* Pending proposals banner */}
      {pendingProposals && pendingProposals.length > 0 && !hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl rounded-2xl border p-4 md:left-auto md:right-8 md:max-w-md"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--theme-accent, #c9a84c) 10%, var(--theme-bg, #FAF7F2))',
            borderColor: 'var(--theme-accent, #c9a84c)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" style={{ color: 'var(--theme-accent, #c9a84c)' }} />
            <p className="font-body text-sm" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
              Masz oczekującą propozycję zmian. Możesz wysłać kolejną.
            </p>
          </div>
        </motion.div>
      )}

      {/* Success animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
            >
              <Check className="h-12 w-12 text-ivory" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main panel */}
      <AnimatePresence>
        {hasChanges && !showSuccess && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 md:bottom-8 md:left-auto md:right-8 md:max-w-md"
          >
            {/* Mobile collapsed bar */}
            <AnimatePresence>
              {!expanded && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setExpanded(true)}
                  className="flex w-full items-center justify-between rounded-t-2xl px-6 py-4 font-body font-semibold text-ivory md:hidden"
                  style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
                >
                  <span>Masz {modifications.size} {modifications.size === 1 ? 'zmianę' : 'zmian'} — zobacz</span>
                  <ChevronUp className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Expanded panel */}
            <motion.div
              className={`rounded-2xl shadow-premium ${expanded ? 'block max-h-[80vh] overflow-y-auto' : 'hidden md:block'}`}
              style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between rounded-t-2xl px-6 py-4"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-ivory">
                    Moje zmiany ({modifications.size})
                  </h3>
                  <AnimatePresence>
                    {savedIndicator && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-ivory"
                      >
                        <Check className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => setExpanded(false)} className="text-ivory/70 md:hidden">
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Changes list */}
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
                  {changesList.map(({ itemId, mod, dishName }) => (
                    <motion.div
                      key={itemId}
                      variants={fadeInUp}
                      className="flex items-center justify-between rounded-xl bg-ivory p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{MOD_ICONS[mod.type] ?? '🔄'}</span>
                        <span className="font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                          {dishName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: (mod.swapPriceDiff ?? 0) >= 0 ? 'var(--theme-text, #1A1A1A)' : '#16a34a' }}>
                        {mod.type === 'swap' && mod.swapPriceDiff != null
                          ? (mod.swapPriceDiff >= 0 ? '+' : '') + formatCurrency(mod.swapPriceDiff)
                          : mod.type === 'variant' && mod.variantPriceModifier != null
                            ? (mod.variantPriceModifier >= 0 ? '+' : '') + formatCurrency(mod.variantPriceModifier)
                            : '—'}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Price impact */}
                <div className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, var(--theme-bg, #FAF7F2))' }}>
                  <span className="font-body text-sm font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>Łączny wpływ:</span>
                  <AnimatedPrice
                    value={priceDiff}
                    className="font-display text-lg font-bold"
                    prefix={priceDiff >= 0 ? '+' : ''}
                  />
                </div>

                {/* Comment */}
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Dodatkowy komentarz (opcjonalnie)..."
                  className="min-h-[60px] resize-none rounded-xl border font-body text-sm"
                  style={{
                    backgroundColor: 'var(--theme-bg, #FAF7F2)',
                    borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 20%, transparent)',
                    color: 'var(--theme-text, #1A1A1A)',
                  }}
                />

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitProposal.isPending}
                  onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-body font-semibold text-ivory tracking-wide shadow-glow transition-all disabled:opacity-70"
                  style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
                >
                  {submitProposal.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="h-5 w-5 rounded-full border-2 border-ivory/30 border-t-ivory"
                    />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Wyślij propozycję zmian
                    </>
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
