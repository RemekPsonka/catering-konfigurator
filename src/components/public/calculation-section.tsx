import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Minus, Plus, MessageCircle, Tag } from 'lucide-react';
import { fadeInUp, fadeIn, staggerContainer } from '@/lib/animations';
import { calculateOfferTotals, formatCurrency } from '@/lib/calculations';
import { getItemPrice } from '@/hooks/use-offer-variants';
import { useDebounce } from '@/hooks/use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedPrice } from './animated-price';
import type { DishModification } from './dish-edit-panel';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { VariantWithItems } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

interface CalculationSectionProps {
  offer: PublicOffer;
  modifications?: Map<string, DishModification>;
}

export const CalculationSection = ({ offer, modifications }: CalculationSectionProps) => {
  const {
    offer_variants,
    offer_services,
    pricing_mode,
    people_count,
    price_display_mode,
    discount_percent,
    discount_value,
    delivery_cost,
    is_people_count_editable,
    min_offer_price,
  } = offer;

  const [localPeopleCount, setLocalPeopleCount] = useState(people_count ?? 1);
  const prevValidCount = useRef(people_count ?? 1);
  const debouncedCount = useDebounce(localPeopleCount, 300);

  const variants = (offer_variants ?? []) as unknown as VariantWithItems[];
  const services = (offer_services ?? []) as unknown as OfferServiceWithService[];

  const adjustedVariants = useMemo(() => {
    if (!modifications || modifications.size === 0) return variants;
    return variants.map((v) => ({
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
  }, [variants, modifications]);

  const totals = useMemo(
    () =>
      calculateOfferTotals(
        pricing_mode, debouncedCount, adjustedVariants, services,
        discount_percent ?? 0, discount_value ?? 0, delivery_cost ?? 0,
      ),
    [pricing_mode, debouncedCount, adjustedVariants, services, discount_percent, discount_value, delivery_cost],
  );

  const hasDiscount = totals.discountAmount > 0;

  useEffect(() => {
    if (!is_people_count_editable || debouncedCount === people_count || debouncedCount < 1) return;

    const persistCount = () => {
      supabase
        .from('offers')
        .update({ people_count: debouncedCount })
        .eq('id', offer.id)
        .then(({ error }) => {
          if (error) console.error('Failed to save people count:', error);
        });
    };

    if (!min_offer_price || min_offer_price <= 0) {
      prevValidCount.current = debouncedCount;
      persistCount();
      return;
    }

    if (debouncedCount === prevValidCount.current) return;

    const checkTotals = calculateOfferTotals(
      pricing_mode, debouncedCount, adjustedVariants, services,
      discount_percent ?? 0, discount_value ?? 0, delivery_cost ?? 0,
    );

    if (checkTotals.grandTotal < min_offer_price) {
      toast.error('Ta zmiana nie jest możliwa. Skontaktuj się z nami, aby omówić alternatywy.', { className: 'shake-toast' });
      setLocalPeopleCount(prevValidCount.current ?? people_count ?? 1);
    } else {
      prevValidCount.current = debouncedCount;
      persistCount();
    }
  }, [debouncedCount, pricing_mode, adjustedVariants, services, discount_percent, discount_value, delivery_cost, min_offer_price, is_people_count_editable, people_count, offer.id]);

  const handleIncrement = useCallback(() => setLocalPeopleCount((c) => c + 1), []);
  const handleDecrement = useCallback(() => setLocalPeopleCount((c) => Math.max(1, c - 1)), []);

  if (!offer_variants || offer_variants.length === 0) return null;

  if (price_display_mode === 'HIDDEN') {
    return (
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="py-8 md:py-12"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-40" style={{ color: 'var(--theme-primary, #1A1A1A)' }} />
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Cena do ustalenia indywidualnie
          </h2>
          <p className="mt-2 font-body text-sm text-charcoal/60">
            Skontaktuj się z nami, aby poznać szczegóły wyceny.
          </p>
        </div>
      </motion.section>
    );
  }

  const discountLabel = discount_percent ? `Rabat ${discount_percent}%` : 'Rabat';

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-8 md:py-12"
    >
      <div className="mx-auto max-w-4xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-4 text-center font-display text-xl font-bold"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Podsumowanie kosztów
        </motion.h2>

        {/* Editable people count — compact inline */}
        {is_people_count_editable && (
          <motion.div variants={fadeInUp} className="mb-4 flex items-center justify-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Liczba osób</span>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDecrement}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ivory transition-colors"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
              >
                <Minus className="h-4 w-4" />
              </motion.button>
              <motion.span
                key={localPeopleCount}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="min-w-[3rem] text-center font-display text-xl font-bold"
                style={{ color: 'var(--theme-text, #1A1A1A)' }}
              >
                {localPeopleCount}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleIncrement}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ivory transition-colors"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* DETAILED mode */}
        {price_display_mode === 'DETAILED' && (
          <motion.div variants={fadeInUp} className="mb-6 space-y-4">
            {totals.variantTotals.map((vt) => {
              const variant = offer_variants.find((v) => v.id === vt.id);
              if (!variant) return null;
              return (
                <div key={vt.id} className="rounded-xl bg-ivory p-4 shadow-sm">
                  <h3 className="mb-3 font-display text-base font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    {vt.name}
                  </h3>
                  <div className="space-y-1.5">
                    {variant.variant_items.map((item) => {
                      const price = getItemPrice(item as never);
                      const qty = item.quantity ?? 1;
                      return (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-charcoal/70">
                            {item.custom_name ?? item.dishes.display_name}
                            <span className="ml-2 text-charcoal/40">×{qty}</span>
                          </span>
                          <span className="font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                            {formatCurrency(price * qty)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 h-px w-full" style={{ background: 'linear-gradient(to right, var(--theme-primary, #1A1A1A), transparent)' }} />
                  <div className="mt-2 flex justify-between font-body text-sm font-semibold">
                    <span>Suma wariantu</span>
                    <AnimatedPrice value={vt.total} />
                  </div>
                </div>
              );
            })}

            {/* Discount in DETAILED */}
            {hasDiscount && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-green-700" />
                  <span className="text-sm font-semibold text-green-800">{discountLabel}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal/50">Menu przed rabatem</span>
                    <span className="text-charcoal/50 line-through">{formatCurrency(totals.maxDishesTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">{discountLabel}</span>
                    <span className="font-semibold text-green-700">-{formatCurrency(totals.discountAmount)}</span>
                  </div>
                  <div className="mt-1 h-px w-full" style={{ background: 'linear-gradient(to right, var(--theme-primary, #1A1A1A), transparent)' }} />
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>Menu po rabacie</span>
                    <span className="font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>{formatCurrency(totals.dishesAfterDiscount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Services in DETAILED */}
            {services.length > 0 && (
              <div className="rounded-xl bg-ivory p-4 shadow-sm">
                <h3 className="mb-3 font-display text-base font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  Usługi dodatkowe
                </h3>
                <div className="space-y-1.5">
                  {services.filter((os) => os.services != null).map((os) => {
                    const price = os.custom_price != null ? Number(os.custom_price) : os.services.price;
                    const qty = os.quantity ?? 1;
                    return (
                      <div key={os.id} className="flex items-center justify-between text-sm">
                        <span className="text-charcoal/70">
                          {os.services.name}
                          {qty > 1 && <span className="ml-2 text-charcoal/40">×{qty}</span>}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{formatCurrency(price * qty)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 h-px w-full" style={{ background: 'linear-gradient(to right, var(--theme-primary, #1A1A1A), transparent)' }} />
                <div className="mt-2 flex justify-between font-body text-sm font-semibold">
                  <span>Suma usług</span>
                  <AnimatedPrice value={totals.servicesTotalCalc} />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Discount — non-DETAILED */}
        {hasDiscount && price_display_mode !== 'DETAILED' && (
          <motion.div variants={fadeInUp} className="mb-4">
            <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-700" />
                <span className="text-green-800 font-medium">
                  {price_display_mode === 'TOTAL_ONLY'
                    ? `Uwzględniono ${discount_percent ? `rabat ${discount_percent}%` : 'rabat'} na menu`
                    : discountLabel}
                </span>
              </div>
              {price_display_mode !== 'TOTAL_ONLY' && (
                <span className="font-semibold text-green-700">-{formatCurrency(totals.discountAmount)}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Delivery — non-DETAILED */}
        {(delivery_cost ?? 0) > 0 && price_display_mode !== 'DETAILED' && (
          <motion.div variants={fadeInUp} className="mb-4">
            <div className="flex justify-between rounded-xl bg-ivory px-4 py-3 text-sm shadow-sm">
              <span className="text-charcoal/70">Dostawa</span>
              <span className="font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{formatCurrency(delivery_cost ?? 0)}</span>
            </div>
          </motion.div>
        )}

        {/* PER_PERSON variants */}
        {(price_display_mode === 'PER_PERSON_ONLY' || price_display_mode === 'PER_PERSON_AND_TOTAL') && (
          <motion.div variants={fadeInUp} className="mb-4 space-y-2">
            {totals.variantTotals.map((vt) => (
              <div key={vt.id} className="flex items-center justify-between rounded-xl bg-ivory px-4 py-3 shadow-sm">
                <span className="font-display text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{vt.name}</span>
                <span className="font-body text-base font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>{formatCurrency(vt.perPerson)}/os.</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Grand total — compact */}
        <motion.div
          variants={fadeInUp}
          className="rounded-xl p-5 md:p-6 text-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 7%, var(--theme-bg, #FAF7F2))' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Łącznie</p>

          {totals.variantTotals.length === 1 ? (
            <>
              <div className="mt-1">
                <AnimatedPrice value={totals.variantTotals[0].grandTotal} className="font-display text-2xl font-bold md:text-3xl" />
              </div>
              {debouncedCount > 0 && (
                <p className="mt-1 font-body text-sm text-charcoal/50">
                  {formatCurrency(totals.variantTotals[0].pricePerPerson)} / osoba
                </p>
              )}
            </>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="mx-auto text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-charcoal/40">Wariant</th>
                    <th className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-charcoal/40 text-right">Cena/os.</th>
                    <th className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-charcoal/40 text-right">Łącznie</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.variantTotals.map((vt) => (
                    <tr key={vt.id}>
                      <td className="px-4 py-1.5 font-display text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{vt.name}</td>
                      <td className="px-4 py-1.5 text-right font-body text-sm text-charcoal/60">{formatCurrency(vt.pricePerPerson)}</td>
                      <td className="px-4 py-1.5 text-right">
                        <span className="font-display text-lg font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{formatCurrency(vt.grandTotal)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};