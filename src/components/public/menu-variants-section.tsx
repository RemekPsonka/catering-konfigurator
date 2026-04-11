import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Sparkles, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { DishCard } from './dish-card';
import type { DishModification } from './dish-edit-panel';
import { formatCurrency, calculateVariantDishesTotal } from '@/lib/calculations';
import type { VariantWithItems } from '@/hooks/use-offer-variants';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Enums } from '@/integrations/supabase/types';

type Variant = PublicOffer['offer_variants'][number];

interface MenuVariantsSectionProps {
  variants: Variant[];
  pricingMode: Enums<'pricing_mode'>;
  peopleCount: number;
  priceDisplayMode: Enums<'price_display_mode'>;
  activeVariantId?: string;
  onActiveVariantChange?: (id: string) => void;
  modifications?: Map<string, DishModification>;
  onModificationChange?: (itemId: string, mod: DishModification | undefined) => void;
  acceptedVariantId?: string | null;
}

const groupByCategory = (items: Variant['variant_items']) => {
  const validItems = items.filter(item => item.dishes != null);
  const groups = new Map<string, { name: string; icon: string | null; items: typeof items }>();
  for (const item of validItems) {
    const cat = item.dishes?.dish_categories;
    const catId = cat?.id ?? 'uncategorized';
    const existing = groups.get(catId);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(catId, { name: cat?.name ?? 'Inne', icon: cat?.icon ?? null, items: [item] });
    }
  }
  return Array.from(groups.values());
};

export const MenuVariantsSection = ({ variants, pricingMode, peopleCount, priceDisplayMode, activeVariantId: controlledId, onActiveVariantChange, modifications, onModificationChange, acceptedVariantId }: MenuVariantsSectionProps) => {
  const sorted = [...variants].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const activeId = controlledId ?? sorted[0]?.id ?? '';
  const setActiveId = (id: string) => {
    onActiveVariantChange?.(id);
  };
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedDot, setSelectedDot] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelectedDot(idx);
    if (sorted[idx]) setActiveId(sorted[idx].id);
  }, [emblaApi, sorted]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const activeVariant = sorted.find((v) => v.id === activeId) ?? sorted[0];
  if (!activeVariant) return null;

  const categories = groupByCategory(
    [...activeVariant.variant_items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  );

  const showVariantPrice = priceDisplayMode !== 'HIDDEN' && priceDisplayMode !== 'TOTAL_ONLY';
  const singleVariant = sorted.length <= 1;

  return (
    <motion.section
      id="menu-section"
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
          Menu
        </motion.h2>

        {/* Variant selector */}
        {!singleVariant && (
          <motion.div variants={fadeInUp} className="mb-6">
            {isMobile ? (
              <div>
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-3">
                    {sorted.map((v) => (
                      <div key={v.id} className="min-w-0 flex-[0_0_85%]">
                        <VariantCard
                          variant={v}
                          isActive={v.id === activeId}
                          onClick={() => {
                            setActiveId(v.id);
                            const idx = sorted.findIndex((s) => s.id === v.id);
                            emblaApi?.scrollTo(idx);
                          }}
                          showPrice={showVariantPrice}
                          pricingMode={pricingMode}
                          peopleCount={peopleCount}
                          acceptedVariantId={acceptedVariantId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex justify-center gap-2">
                  {sorted.map((_, i) => (
                    <button
                      key={i}
                      className="h-2 w-2 rounded-full transition-all"
                      style={{
                        backgroundColor: i === selectedDot ? 'var(--theme-primary, #1A1A1A)' : 'var(--theme-secondary, #ccc)',
                        transform: i === selectedDot ? 'scale(1.3)' : 'scale(1)',
                      }}
                      onClick={() => emblaApi?.scrollTo(i)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className={`grid gap-3 ${sorted.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {sorted.map((v) => (
                  <VariantCard
                    key={v.id}
                    variant={v}
                    isActive={v.id === activeId}
                    onClick={() => setActiveId(v.id)}
                    showPrice={showVariantPrice}
                    pricingMode={pricingMode}
                    peopleCount={peopleCount}
                    acceptedVariantId={acceptedVariantId}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Dishes list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.name}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mb-4"
              >
                <h3
                  className="mb-2 font-display text-base font-semibold"
                  style={{ color: 'var(--theme-text, #1A1A1A)' }}
                >
                  {cat.icon && <span className="mr-2">{cat.icon}</span>}
                  {cat.name}
                </h3>
                <motion.div
                  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {cat.items.map((item, idx) => {
                    const isSplitChild = !!(item as { split_parent_id?: string | null }).split_parent_id;
                    const nextItem = cat.items[idx + 1] as { split_parent_id?: string | null } | undefined;
                    const isParentOfNext = nextItem?.split_parent_id === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        variants={fadeInUp}
                        className={isSplitChild ? 'ml-4 border-l-2 pl-3' : ''}
                        style={isSplitChild ? { borderColor: 'var(--theme-accent, #c9a84c)' } : undefined}
                      >
                        {isSplitChild && (
                          <span className="mb-1 block font-body text-[11px] font-medium" style={{ color: 'var(--theme-accent, #c9a84c)' }}>
                            + podział
                          </span>
                        )}
                        <DishCard
                          item={item}
                          priceDisplayMode={priceDisplayMode}
                          pricingMode={pricingMode}
                          peopleCount={peopleCount}
                          isExpanded={expandedItemId === item.id}
                          onToggleExpand={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                          modification={modifications?.get(item.id)}
                          onModificationChange={(mod) => onModificationChange?.(item.id, mod)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

/* ---- Variant Card ---- */

interface VariantCardProps {
  variant: Variant;
  isActive: boolean;
  onClick: () => void;
  showPrice: boolean;
  pricingMode: Enums<'pricing_mode'>;
  peopleCount: number;
  acceptedVariantId?: string | null;
}

const VariantCard = ({ variant, isActive, onClick, showPrice, pricingMode, peopleCount, acceptedVariantId }: VariantCardProps) => {
  const itemCount = variant.variant_items.length;
  const editableCount = variant.variant_items.filter((item) => {
    const mods = (item.allowed_modifications ?? item.dishes?.modifiable_items) as unknown;
    return item.is_client_editable && mods && typeof mods === 'object';
  }).length;
  const perPerson = calculateVariantDishesTotal(variant as VariantWithItems);
  const isChosen = variant.id === acceptedVariantId;
  const hasAccepted = !!acceptedVariantId;
  const isDimmed = hasAccepted && !isChosen;

  return (
    <motion.button
      onClick={onClick}
      whileHover={hasAccepted ? {} : { y: -2 }}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="w-full rounded-xl p-3 text-left transition-all"
      style={{
        backgroundColor: 'var(--theme-bg, #FAF7F2)',
        border: isChosen ? '2px solid #16a34a' : isActive ? '2px solid var(--theme-primary, #1A1A1A)' : '2px solid transparent',
        boxShadow: isActive ? '0 0 20px rgba(var(--theme-primary-rgb, 26,26,26), 0.15)' : '0 4px 12px rgba(0,0,0,0.06)',
        opacity: isDimmed ? 0.45 : 1,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
          {variant.name}
        </h3>
        {isChosen && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white shrink-0 bg-green-600">
            ✓ Twój wybór
          </span>
        )}
        {!isChosen && variant.is_recommended && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-ivory shrink-0"
            style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
          >
            <Sparkles className="h-3 w-3" />
            Polecany
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-xs" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.7 }}>
        <span className="inline-flex items-center gap-1">
          <UtensilsCrossed className="h-3 w-3" />
          {itemCount} pozycji
        </span>
        {editableCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {editableCount} do personalizacji
          </span>
        )}
        {showPrice && perPerson > 0 && (
          <span className="font-semibold" style={{ color: 'var(--theme-primary, #1A1A1A)', opacity: 1 }}>
            {formatCurrency(perPerson)}/os.
          </span>
        )}
      </div>
    </motion.button>
  );
};