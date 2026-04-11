import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronUp, ChevronDown, Check, AlertCircle, X, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedPrice } from './animated-price';
import { formatCurrency } from '@/lib/calculations';
import { useSubmitProposal, usePublicOfferProposals, useSaveDraftProposal } from '@/hooks/use-public-offer';
import { fireNotification } from '@/hooks/use-notifications';
import { supabase } from '@/integrations/supabase/client';
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
  const [upsellConfirmed, setUpsellConfirmed] = useState(false);
  const submitProposal = useSubmitProposal();
  const saveDraft = useSaveDraftProposal();
  const { data: pendingProposals } = usePublicOfferProposals(offer.id);
  const lastSavedRef = useRef<string>('');
  const queryClient = useQueryClient();

  const priceDiff = proposedTotal - originalTotal;
  const hasChanges = modifications.size > 0;
  const isPP = offer.pricing_mode === 'PER_PERSON';
  const unit = isPP ? 'os.' : 'szt.';

  // Fetch upsell selections
  const { data: upsellSelections } = useQuery({
    queryKey: ['public-upsell-selections', offer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_upsell_selections')
        .select('*, upsell_items(name, emoji)')
        .eq('offer_id', offer.id)
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
  });

  const hasUpsellSelections = (upsellSelections?.length ?? 0) > 0;
  const upsellSum = useMemo(
    () => upsellSelections?.reduce((sum, s) => sum + Number(s.total_price), 0) ?? 0,
    [upsellSelections],
  );
  const allConfirmed = useMemo(
    () => upsellSelections?.every((s) => s.confirmed_at != null) ?? false,
    [upsellSelections],
  );

  // Remove upsell selection mutation
  const removeMutation = useMutation({
    mutationFn: async (selectionId: string) => {
      const { error } = await supabase
        .from('offer_upsell_selections')
        .update({ status: 'removed' as const })
        .eq('id', selectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-upsell-selections', offer.id] });
      toast.success('Dodatek usunięty.');
    },
  });

  // Confirm upsell selections mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { error: updateError } = await supabase
        .from('offer_upsell_selections')
        .update({ confirmed_at: new Date().toISOString() })
        .eq('offer_id', offer.id)
        .eq('status', 'active');
      if (updateError) throw updateError;

      const { error: offerError } = await supabase
        .from('offers')
        .update({ upsell_total: upsellSum })
        .eq('id', offer.id);
      if (offerError) throw offerError;
    },
    onSuccess: () => {
      setUpsellConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ['public-upsell-selections', offer.id] });
      toast.success('Dodatki zatwierdzone! Manager został powiadomiony.');
      fireNotification({
        offerId: offer.id,
        eventType: 'upsell_confirmed',
        title: `🛒 Dodatki zatwierdzone — ${offer.offer_number ?? ''}`,
        body: `${offer.clients?.name ?? 'Klient'} zatwierdził(a) dodatki na kwotę ${formatCurrency(upsellSum)}.`,
        link: `/admin/offers/${offer.id}/edit`,
      });
    },
  });

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
  if (!hasChanges && !hasUpsellSelections && !showSuccess && !(pendingProposals && pendingProposals.length > 0)) return null;

  const totalCount = modifications.size + (upsellSelections?.length ?? 0);

  return (
    <>
      {/* Pending proposals banner */}
      {pendingProposals && pendingProposals.length > 0 && !hasChanges && !hasUpsellSelections && (
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
        {(hasChanges || hasUpsellSelections) && !showSuccess && (
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
                  <span>
                    {hasChanges && hasUpsellSelections
                      ? `Masz ${modifications.size} zmian i ${upsellSelections?.length ?? 0} dodatków — zobacz`
                      : hasChanges
                        ? `Masz ${modifications.size} ${modifications.size === 1 ? 'zmianę' : 'zmian'} — zobacz`
                        : `Masz ${upsellSelections?.length ?? 0} ${(upsellSelections?.length ?? 0) === 1 ? 'dodatek' : 'dodatków'} — zobacz`}
                  </span>
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
                    Moje zmiany ({totalCount})
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
                {/* Dish changes list */}
                {hasChanges && (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
                    {changesList.map(({ itemId, mod, dishName, quantity }) => {
                      const unitDiff = mod.type === 'swap' ? (mod.swapPriceDiff ?? 0)
                        : mod.type === 'variant' ? (mod.variantPriceModifier ?? 0)
                        : 0;
                      const multiplier = isPP ? (offer.people_count ?? 1) : quantity;
                      const totalItemDiff = unitDiff * multiplier;
                      const sign = unitDiff >= 0 ? '+' : '';

                      return (
                        <motion.div
                          key={itemId}
                          variants={fadeInUp}
                          className="flex items-center justify-between rounded-xl bg-ivory p-3 text-sm gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0">{MOD_ICONS[mod.type] ?? '🔄'}</span>
                            <span className="font-medium truncate" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                              {dishName}
                            </span>
                          </div>
                          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: unitDiff >= 0 ? 'var(--theme-text, #1A1A1A)' : '#16a34a' }}>
                            {unitDiff !== 0
                              ? `${sign}${formatCurrency(unitDiff)}/${unit} × ${multiplier} ${unit} = ${sign}${formatCurrency(totalItemDiff)}`
                              : `${sign}${formatCurrency(0)}/${unit}`}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Price impact for dish changes */}
                {hasChanges && (
                  <div className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, var(--theme-bg, #FAF7F2))' }}>
                    <span className="font-body text-sm font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {isPP
                        ? `Łączny wpływ na cenę (przy ${offer.people_count ?? '?'} os.):`
                        : `Łączny wpływ na cenę:`}
                    </span>
                    <AnimatedPrice
                      value={priceDiff}
                      className="font-display text-lg font-bold"
                      prefix={priceDiff >= 0 ? '+' : ''}
                    />
                  </div>
                )}

                {/* Upsell selections section */}
                {hasUpsellSelections && (
                  <>
                    {hasChanges && (
                      <div className="border-t pt-3" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 15%, transparent)' }} />
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-4 w-4" style={{ color: 'var(--theme-accent, #c9a84c)' }} />
                      <span className="font-display text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                        Twoje dodatki
                      </span>
                    </div>
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
                      {upsellSelections?.map((sel) => {
                        const item = sel.upsell_items as unknown as { name: string; emoji: string | null } | null;
                        return (
                          <motion.div
                            key={sel.id}
                            variants={fadeInUp}
                            className="flex items-center justify-between rounded-xl bg-ivory p-3 text-sm gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0">{item?.emoji ?? '🛒'}</span>
                              <span className="font-medium truncate" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                                {item?.name ?? 'Dodatek'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                                {formatCurrency(Number(sel.total_price))}
                              </span>
                              {!sel.confirmed_at && (
                                <button
                                  onClick={() => removeMutation.mutate(sel.id)}
                                  className="rounded-full p-1 transition-colors hover:bg-charcoal/10"
                                  title="Usuń dodatek"
                                >
                                  <X className="h-3.5 w-3.5" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>

                    {/* Upsell summary */}
                    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent, #c9a84c) 8%, var(--theme-bg, #FAF7F2))' }}>
                      <div className="flex justify-between text-sm font-body" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                        <span>Oferta bazowa:</span>
                        <span className="font-semibold">{formatCurrency(originalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-body" style={{ color: 'var(--theme-accent, #c9a84c)' }}>
                        <span>Dodatki:</span>
                        <span className="font-semibold">+{formatCurrency(upsellSum)}</span>
                      </div>
                      <div className="border-t pt-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 15%, transparent)' }}>
                        <div className="flex justify-between font-body" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                          <span className="font-semibold">RAZEM:</span>
                          <AnimatedPrice
                            value={originalTotal + upsellSum}
                            className="font-display text-lg font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Confirm upsells button */}
                    {!allConfirmed && !upsellConfirmed ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={confirmMutation.isPending}
                        onClick={() => confirmMutation.mutate()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-body font-semibold text-ivory tracking-wide transition-all disabled:opacity-70"
                        style={{ backgroundColor: 'var(--theme-accent, #c9a84c)' }}
                      >
                        {confirmMutation.isPending ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="h-5 w-5 rounded-full border-2 border-ivory/30 border-t-ivory"
                          />
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4" />
                            Zatwierdź dodatki
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-xl py-3 font-body text-sm font-semibold opacity-70" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                        <Check className="h-4 w-4" />
                        Dodatki zatwierdzone
                      </div>
                    )}
                  </>
                )}

                {/* Separator between upsell and dish changes submit */}
                {hasChanges && hasUpsellSelections && (
                  <div className="border-t pt-3" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 15%, transparent)' }} />
                )}

                {/* Dish changes section: comment + submit */}
                {hasChanges && (
                  <>
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
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
