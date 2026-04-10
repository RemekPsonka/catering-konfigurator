import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Sparkles, ChevronDown, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Enums } from '@/integrations/supabase/types';

type Variant = PublicOffer['offer_variants'][number];

interface VariantComparisonSectionProps {
  variants: Variant[];
  pricingMode: Enums<'pricing_mode'>;
  peopleCount: number;
  priceDisplayMode: Enums<'price_display_mode'>;
  onSelectVariant: (variantId: string) => void;
}

const getTopDishes = (variant: Variant, maxCount = 5) => {
  const items = [...variant.variant_items].sort((a, b) => {
    const priceA = a.custom_price != null ? Number(a.custom_price) : Number(a.dishes?.price_per_person ?? 0);
    const priceB = b.custom_price != null ? Number(b.custom_price) : Number(b.dishes?.price_per_person ?? 0);
    return priceB - priceA;
  });
  return items.slice(0, maxCount);
};

const getEditableCount = (variant: Variant): number =>
  variant.variant_items.filter((item) => {
    const mods = (item.allowed_modifications ?? item.dishes?.modifiable_items) as unknown;
    return item.is_client_editable && mods && typeof mods === 'object';
  }).length;

const buildDiffTable = (variants: Variant[]) => {
  const categoryMap = new Map<string, { name: string; icon: string | null; dishes: Map<string, string[]> }>();
  variants.forEach((v, vIdx) => {
    for (const item of v.variant_items) {
      const cat = item.dishes?.dish_categories;
      const catId = cat?.id ?? 'uncategorized';
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: cat?.name ?? 'Inne', icon: cat?.icon ?? null, dishes: new Map() });
      }
      const dishName = item.custom_name || item.dishes?.display_name || item.dishes?.name || '—';
      const existing = categoryMap.get(catId)!.dishes.get(dishName);
      if (existing) {
        existing[vIdx] = dishName;
      } else {
        const arr = new Array<string>(variants.length).fill('—');
        arr[vIdx] = dishName;
        categoryMap.get(catId)!.dishes.set(dishName, arr);
      }
    }
  });
  return Array.from(categoryMap.values());
};

export const VariantComparisonSection = ({
  variants, pricingMode, peopleCount, priceDisplayMode, onSelectVariant,
}: VariantComparisonSectionProps) => {
  const sorted = [...variants].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const isMobile = useIsMobile();
  const [showDiff, setShowDiff] = useState(false);
  const [emblaRef] = useEmblaCarousel({ loop: false });

  const diffTable = useMemo(() => buildDiffTable(sorted), [sorted]);

  const handleSelect = useCallback(
    (variantId: string) => {
      onSelectVariant(variantId);
      document.getElementById('acceptance-section')?.scrollIntoView({ behavior: 'smooth' });
    },
    [onSelectVariant],
  );

  if (sorted.length < 2) return null;
  const showPrice = priceDisplayMode !== 'HIDDEN';

  const renderCard = (v: Variant) => {
    const topDishes = getTopDishes(v);
    const editableCount = getEditableCount(v);

    return (
      <motion.div
        key={v.id}
        variants={fadeInUp}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="flex flex-col rounded-xl shadow-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-bg, #FAF7F2)',
          border: v.is_recommended ? '2px solid var(--theme-primary, #1A1A1A)' : '2px solid transparent',
        }}
      >
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-display text-base font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{v.name}</h3>
            {v.is_recommended && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-ivory shrink-0" style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}>
                <Sparkles className="h-3 w-3" /> Polecany
              </span>
            )}
          </div>

          {v.description && (
            <p className="mb-3 font-body text-xs leading-relaxed" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.6 }}>{v.description}</p>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 8%, transparent)', color: 'var(--theme-primary, #1A1A1A)' }}>
              <UtensilsCrossed className="h-3 w-3" /> {v.variant_items.length} pozycji
            </span>
            {editableCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent, #c9a84c) 15%, transparent)', color: 'var(--theme-accent, #c9a84c)' }}>
                <RefreshCw className="h-3 w-3" /> {editableCount} do personalizacji
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {topDishes.map((item) => {
              const photo = Array.isArray(item.dishes?.dish_photos) ? item.dishes.dish_photos.find((p) => p.is_primary) ?? item.dishes.dish_photos[0] : null;
              return (
                <div key={item.id} className="flex items-center gap-2">
                  {photo ? (
                    <img src={photo.photo_url} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                  ) : (
                    <div className="h-6 w-6 rounded shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 8%, transparent)' }} />
                  )}
                  <span className="font-body text-xs truncate" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    {item.custom_name || item.dishes?.display_name || item.dishes?.name}
                  </span>
                </div>
              );
            })}
          </div>

          {showPrice && v.price_per_person != null && Number(v.price_per_person) > 0 && (
            <div className="mt-3">
              {(priceDisplayMode === 'PER_PERSON_AND_TOTAL' || priceDisplayMode === 'PER_PERSON_ONLY' || priceDisplayMode === 'DETAILED') && (
                <p className="font-display text-base font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>{formatCurrency(Number(v.price_per_person))}/os.</p>
              )}
              {(priceDisplayMode === 'PER_PERSON_AND_TOTAL' || priceDisplayMode === 'TOTAL_ONLY' || priceDisplayMode === 'DETAILED') && v.total_value != null && (
                <p className="font-body text-xs mt-0.5" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.6 }}>{formatCurrency(Number(v.total_value))} łącznie</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 pt-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(v.id)}
            className="w-full rounded-lg py-2.5 font-body text-sm font-semibold text-ivory transition-all"
            style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
          >
            Wybierz {v.name}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-8 md:py-12"
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-6 text-center font-display text-xl font-bold"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Porównaj warianty
        </motion.h2>

        {isMobile ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3">
              {sorted.map((v) => (
                <div key={v.id} className="min-w-0 flex-[0_0_90%]">{renderCard(v)}</div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div variants={fadeInUp} className={`grid gap-4 ${sorted.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {sorted.map(renderCard)}
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="mt-6">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="mx-auto flex items-center gap-2 rounded-lg px-5 py-2 font-body text-sm font-medium transition-all"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 8%, transparent)', color: 'var(--theme-primary, #1A1A1A)' }}
          >
            Pokaż szczegółowe różnice
            <ChevronDown className={`h-4 w-4 transition-transform ${showDiff ? 'rotate-180' : ''}`} />
          </button>

          {showDiff && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-x-auto rounded-xl shadow-sm"
              style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}
            >
              <table className="w-full min-w-[500px] text-left">
                <thead>
                  <tr style={{ borderBottom: '2px solid color-mix(in srgb, var(--theme-primary, #1A1A1A) 15%, transparent)' }}>
                    <th className="sticky left-0 p-3 font-display text-xs font-semibold" style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)', color: 'var(--theme-text, #1A1A1A)' }}>Kategoria</th>
                    {sorted.map((v) => (
                      <th key={v.id} className="p-3 font-display text-xs font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{v.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {diffTable.map((cat) =>
                    Array.from(cat.dishes.entries()).map(([dishName, cols], dIdx) => {
                      const allSame = cols.every((c) => c === cols[0]);
                      const isDiff = !allSame;
                      return (
                        <tr
                          key={`${cat.name}-${dIdx}`}
                          style={{
                            borderBottom: '1px solid color-mix(in srgb, var(--theme-primary, #1A1A1A) 8%, transparent)',
                            backgroundColor: isDiff ? 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, transparent)' : 'transparent',
                          }}
                        >
                          <td className="sticky left-0 p-2 font-body text-xs font-medium"
                            style={{
                              backgroundColor: isDiff ? 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, var(--theme-bg, #FAF7F2))' : 'var(--theme-bg, #FAF7F2)',
                              color: 'var(--theme-text, #1A1A1A)', opacity: 0.6,
                            }}>
                            {dIdx === 0 && (<span>{cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}</span>)}
                          </td>
                          {cols.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 font-body text-xs"
                              style={{
                                color: cell === '—' ? 'var(--theme-text, #1A1A1A)' : isDiff ? 'var(--theme-primary, #1A1A1A)' : 'var(--theme-text, #1A1A1A)',
                                opacity: cell === '—' ? 0.3 : isDiff ? 1 : 0.6,
                                fontWeight: isDiff && cell !== '—' ? 600 : 400,
                              }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};