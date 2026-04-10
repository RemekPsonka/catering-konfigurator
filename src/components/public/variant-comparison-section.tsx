import { useCallback } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Sparkles, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { formatCurrency, calculateVariantDishesTotal } from '@/lib/calculations';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Enums } from '@/integrations/supabase/types';
import type { VariantWithItems } from '@/hooks/use-offer-variants';

type Variant = PublicOffer['offer_variants'][number];

interface VariantComparisonSectionProps {
  variants: Variant[];
  pricingMode: Enums<'pricing_mode'>;
  peopleCount: number;
  priceDisplayMode: Enums<'price_display_mode'>;
  onSelectVariant: (variantId: string) => void;
}

const getEditableCount = (variant: Variant): number =>
  variant.variant_items.filter((item) => {
    const mods = (item.allowed_modifications ?? item.dishes?.modifiable_items) as unknown;
    return item.is_client_editable && mods && typeof mods === 'object';
  }).length;

export const VariantComparisonSection = ({
  variants, pricingMode, peopleCount, priceDisplayMode, onSelectVariant,
}: VariantComparisonSectionProps) => {
  const sorted = [...variants].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const isMobile = useIsMobile();
  const [emblaRef] = useEmblaCarousel({ loop: false });

  const handleSelect = useCallback(
    (variantId: string) => {
      onSelectVariant(variantId);
      setTimeout(() => {
        document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    [onSelectVariant],
  );

  if (sorted.length < 2) return null;
  const showPrice = priceDisplayMode !== 'HIDDEN';

  const renderCard = (v: Variant) => {
    const editableCount = getEditableCount(v);
    const perPerson = calculateVariantDishesTotal(v as VariantWithItems);

    return (
      <motion.button
        key={v.id}
        variants={fadeInUp}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300 }}
        onClick={() => handleSelect(v.id)}
        className="flex flex-col rounded-xl p-4 shadow-sm overflow-hidden text-left w-full transition-all cursor-pointer"
        style={{
          backgroundColor: 'var(--theme-bg, #FAF7F2)',
          border: v.is_recommended ? '2px solid var(--theme-primary, #1A1A1A)' : '2px solid transparent',
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-base font-bold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>{v.name}</h3>
          {v.is_recommended && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-ivory shrink-0" style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}>
              <Sparkles className="h-3 w-3" /> Polecany
            </span>
          )}
        </div>

        {v.description && (
          <p className="mb-2 font-body text-xs leading-relaxed" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.6 }}>{v.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-2">
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

        {showPrice && perPerson > 0 && (
          <p className="mt-auto font-display text-base font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
            {formatCurrency(perPerson)}/os.
          </p>
        )}
      </motion.button>
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
          className="mb-4 text-center font-display text-xl font-bold"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Twoje warianty menu
        </motion.h2>
        <p className="mb-6 text-center font-body text-sm" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}>
          Kliknij wariant, aby przejść do szczegółów menu
        </p>

        {isMobile ? (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3">
              {sorted.map((v) => (
                <div key={v.id} className="min-w-0 flex-[0_0_85%]">{renderCard(v)}</div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div variants={fadeInUp} className={`grid gap-4 ${sorted.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {sorted.map(renderCard)}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};
