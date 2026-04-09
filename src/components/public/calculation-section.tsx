import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Minus, Plus, MessageCircle } from 'lucide-react';
import { fadeInUp, fadeIn, staggerContainer } from '@/lib/animations';
import { calculateOfferTotals, formatCurrency } from '@/lib/calculations';
import { getItemPrice } from '@/hooks/use-offer-variants';
import { useDebounce } from '@/hooks/use-debounce';
import { AnimatedPrice } from './animated-price';
import type { DishModification } from './dish-edit-panel';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { VariantWithItems } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

interface CalculationSectionProps {
  offer: PublicOffer;
  modifications?: Map<string, DishModification>;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  STAFF: 'Obsługa',
  EQUIPMENT: 'Sprzęt',
  LOGISTICS: 'Logistyka',
};

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

  const [localPeopleCount, setLocalPeopleCount] = useState(people_count);
  const prevValidCount = useRef(people_count);
  const debouncedCount = useDebounce(localPeopleCount, 300);

  const variants = offer_variants as unknown as VariantWithItems[];
  const services = offer_services as unknown as OfferServiceWithService[];

  // Apply modifications to variant items before calculation
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
        pricing_mode,
        debouncedCount,
        adjustedVariants,
        services,
        discount_percent ?? 0,
        discount_value ?? 0,
        delivery_cost ?? 0,
      ),
    [pricing_mode, debouncedCount, adjustedVariants, services, discount_percent, discount_value, delivery_cost],
  );

  // Guardrail check
  useEffect(() => {
    if (!min_offer_price || min_offer_price <= 0) return;
    if (debouncedCount === prevValidCount.current) return;
    if (totals.grandTotal < min_offer_price) {
      toast.error('Ta zmiana nie jest możliwa. Skontaktuj się z nami, aby omówić alternatywy.', {
        className: 'shake-toast',
      });
      setLocalPeopleCount(prevValidCount.current);
    } else {
      prevValidCount.current = debouncedCount;
    }
  }, [debouncedCount, totals.grandTotal, min_offer_price]);

  const handleIncrement = useCallback(() => setLocalPeopleCount((c) => c + 1), []);
  const handleDecrement = useCallback(() => setLocalPeopleCount((c) => Math.max(1, c - 1)), []);

  if (price_display_mode === 'HIDDEN') {
    return (
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="py-16 md:py-24"
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 opacity-40" style={{ color: 'var(--theme-primary, #1A1A1A)' }} />
          <h2 className="font-display text-2xl font-bold md:text-3xl" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Cena do ustalenia indywidualnie
          </h2>
          <p className="mt-3 font-body text-charcoal/60">
            Skontaktuj się z nami, aby poznać szczegóły wyceny.
          </p>
        </div>
      </motion.section>
    );
  }

  return (
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
          Podsumowanie kosztów
        </motion.h2>

        {/* Editable people count */}
        {is_people_count_editable && (
          <motion.div variants={fadeInUp} className="mb-10 flex flex-col items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Liczba osób</p>
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDecrement}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-ivory transition-colors"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
              >
                <Minus className="h-5 w-5" />
              </motion.button>
              <motion.span
                key={localPeopleCount}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="min-w-[4rem] text-center font-display text-3xl font-bold"
                style={{ color: 'var(--theme-text, #1A1A1A)' }}
              >
                {localPeopleCount}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleIncrement}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-ivory transition-colors"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* DETAILED mode */}
        {price_display_mode === 'DETAILED' && (
          <motion.div variants={fadeInUp} className="mb-8 space-y-6">
            {/* Variants breakdown */}
            {totals.variantTotals.map((vt) => {
              const variant = offer_variants.find((v) => v.id === vt.id);
              if (!variant) return null;
              return (
                <div key={vt.id} className="rounded-2xl bg-ivory p-6 shadow-premium">
                  <h3 className="mb-4 font-display text-lg font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    {vt.name}
                  </h3>
                  <div className="space-y-2">
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
                  <div
                    className="mt-4 h-px w-full"
                    style={{ background: 'linear-gradient(to right, var(--theme-primary, #1A1A1A), transparent)' }}
                  />
                  <div className="mt-3 flex justify-between font-body text-sm font-semibold">
                    <span>Suma wariantu</span>
                    <AnimatedPrice value={vt.total} />
                  </div>
                </div>
              );
            })}

            {/* Services */}
            {services.length > 0 && (
              <div className="rounded-2xl bg-ivory p-6 shadow-premium">
                <h3 className="mb-4 font-display text-lg font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  Usługi dodatkowe
                </h3>
                <div className="space-y-2">
                  {services.map((os) => {
                    const price = os.custom_price != null ? Number(os.custom_price) : os.services.price;
                    const qty = os.quantity ?? 1;
                    return (
                      <div key={os.id} className="flex items-center justify-between text-sm">
                        <span className="text-charcoal/70">
                          {os.services.name}
                          {qty > 1 && <span className="ml-2 text-charcoal/40">×{qty}</span>}
                        </span>
                        <span className="font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                          {formatCurrency(price * qty)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="mt-4 h-px w-full"
                  style={{ background: 'linear-gradient(to right, var(--theme-primary, #1A1A1A), transparent)' }}
                />
                <div className="mt-3 flex justify-between font-body text-sm font-semibold">
                  <span>Suma usług</span>
                  <AnimatedPrice value={totals.servicesTotalCalc} />
                </div>
              </div>
            )}

            {/* Discount */}
            {totals.discountAmount > 0 && (
              <div className="flex justify-between rounded-2xl bg-ivory p-6 text-sm shadow-premium">
                <span className="text-charcoal/70">Rabat</span>
                <span className="font-semibold text-green-700">-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}

            {/* Delivery */}
            {(delivery_cost ?? 0) > 0 && (
              <div className="flex justify-between rounded-2xl bg-ivory p-6 text-sm shadow-premium">
                <span className="text-charcoal/70">Dostawa</span>
                <span className="font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  {formatCurrency(delivery_cost ?? 0)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* PER_PERSON variants */}
        {(price_display_mode === 'PER_PERSON_ONLY' || price_display_mode === 'PER_PERSON_AND_TOTAL') && (
          <motion.div variants={fadeInUp} className="mb-8 space-y-3">
            {totals.variantTotals.map((vt) => (
              <div key={vt.id} className="flex items-center justify-between rounded-2xl bg-ivory p-5 shadow-premium">
                <span className="font-display font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  {vt.name}
                </span>
                <span className="font-body text-lg font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                  {formatCurrency(vt.perPerson)}/os.
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Grand total summary */}
        {price_display_mode !== 'PER_PERSON_ONLY' && (
          <motion.div
            variants={fadeInUp}
            className="rounded-2xl p-8 md:p-10 text-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 7%, var(--theme-bg, #FAF7F2))' }}
          >
            <div
              className="mx-auto mb-6 h-px w-24"
              style={{ background: 'linear-gradient(to right, transparent, var(--theme-primary, #1A1A1A), transparent)' }}
            />
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">Łącznie</p>
            <div className="mt-2">
              <AnimatedPrice
                value={totals.grandTotal}
                className="font-display text-3xl font-bold md:text-5xl"
              />
            </div>
            {debouncedCount > 0 && (
              <p className="mt-3 font-body text-charcoal/50">
                {formatCurrency(totals.pricePerPerson)} / osoba
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};
