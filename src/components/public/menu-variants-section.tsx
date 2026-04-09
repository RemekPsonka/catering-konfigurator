import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Sparkles } from 'lucide-react';
import { DishCard } from './dish-card';
import { formatCurrency } from '@/lib/calculations';
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
}

const groupByCategory = (items: Variant['variant_items']) => {
  const groups = new Map<string, { name: string; icon: string | null; items: typeof items }>();
  for (const item of items) {
    const cat = item.dishes.dish_categories;
    const existing = groups.get(cat.id);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(cat.id, { name: cat.name, icon: cat.icon, items: [item] });
    }
  }
  return Array.from(groups.values());
};

export const MenuVariantsSection = ({ variants, pricingMode, peopleCount, priceDisplayMode }: MenuVariantsSectionProps) => {
  const sorted = [...variants].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [activeId, setActiveId] = useState(sorted[0]?.id ?? '');
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedDot, setSelectedDot] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelectedDot(idx);
    if (sorted[idx]) setActiveId(sorted[idx].id);
  }, [emblaApi, sorted]);

  // Register callback
  useState(() => {
    if (emblaApi) emblaApi.on('select', onSelect);
  });

  const activeVariant = sorted.find((v) => v.id === activeId) ?? sorted[0];
  if (!activeVariant) return null;

  const categories = groupByCategory(
    [...activeVariant.variant_items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  );

  const showVariantPrice = priceDisplayMode !== 'HIDDEN' && priceDisplayMode !== 'TOTAL_ONLY';

  const singleVariant = sorted.length <= 1;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Menu
        </motion.h2>

        {/* Variant selector */}
        {!singleVariant && (
          <motion.div variants={fadeInUp} className="mb-8">
            {isMobile ? (
              /* Mobile: Embla Carousel */
              <div>
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-4">
                    {sorted.map((v) => (
                      <div
                        key={v.id}
                        className="min-w-0 flex-[0_0_85%]"
                      >
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
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Dots */}
                <div className="mt-4 flex justify-center gap-2">
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
              /* Desktop: Grid */
              <div className={`grid gap-4 ${sorted.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {sorted.map((v) => (
                  <VariantCard
                    key={v.id}
                    variant={v}
                    isActive={v.id === activeId}
                    onClick={() => setActiveId(v.id)}
                    showPrice={showVariantPrice}
                    pricingMode={pricingMode}
                    peopleCount={peopleCount}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Dishes list with AnimatePresence */}
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
                className="mb-8"
              >
                <h3
                  className="mb-4 font-display text-lg font-semibold md:text-xl"
                  style={{ color: 'var(--theme-text, #1A1A1A)' }}
                >
                  {cat.icon && <span className="mr-2">{cat.icon}</span>}
                  {cat.name}
                </h3>
                <motion.div
                  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3"
                >
                  {cat.items.map((item) => (
                    <motion.div key={item.id} variants={fadeInUp}>
                      <DishCard
                        item={item}
                        priceDisplayMode={priceDisplayMode}
                        pricingMode={pricingMode}
                        peopleCount={peopleCount}
                      />
                    </motion.div>
                  ))}
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
}

const VariantCard = ({ variant, isActive, onClick, showPrice, pricingMode, peopleCount }: VariantCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="w-full rounded-2xl p-5 text-left transition-all"
      style={{
        backgroundColor: 'var(--theme-bg, #FAF7F2)',
        border: isActive ? '2px solid var(--theme-primary, #1A1A1A)' : '2px solid transparent',
        boxShadow: isActive ? '0 0 40px rgba(var(--theme-primary-rgb, 26,26,26), 0.15)' : '0 20px 60px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
          {variant.name}
        </h3>
        {variant.is_recommended && (
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-ivory"
            style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
          >
            <Sparkles className="h-3 w-3" />
            Polecany
          </motion.span>
        )}
      </div>

      {variant.description && (
        <p className="mt-1 font-body text-sm leading-relaxed" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.7 }}>
          {variant.description}
        </p>
      )}

      {showPrice && variant.price_per_person != null && Number(variant.price_per_person) > 0 && (
        <p className="mt-3 font-body text-base font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
          {formatCurrency(Number(variant.price_per_person))}/os
        </p>
      )}
    </motion.button>
  );
};
