import { useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, RefreshCw } from 'lucide-react';
import { DishLightbox } from './dish-lightbox';
import { formatCurrency } from '@/lib/calculations';
import type { Tables, Enums } from '@/integrations/supabase/types';

interface DishCardProps {
  item: Tables<'variant_items'> & {
    dishes: Tables<'dishes'> & {
      dish_categories: Tables<'dish_categories'>;
      dish_photos?: Tables<'dish_photos'>[];
    };
  };
  priceDisplayMode: Enums<'price_display_mode'>;
  pricingMode: Enums<'pricing_mode'>;
  peopleCount: number;
}

const getPrice = (dish: Tables<'dishes'>): number => {
  switch (dish.unit_type) {
    case 'PERSON': return dish.price_per_person ?? 0;
    case 'PIECE': return dish.price_per_piece ?? 0;
    case 'KG': return dish.price_per_kg ?? 0;
    case 'SET': return dish.price_per_set ?? 0;
    default: return 0;
  }
};

export const DishCard = ({ item, priceDisplayMode, pricingMode, peopleCount }: DishCardProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dish = item.dishes;
  const unitPrice = item.custom_price != null ? Number(item.custom_price) : getPrice(dish);
  const quantity = item.quantity ?? 1;
  const totalPrice = pricingMode === 'PER_PERSON'
    ? unitPrice * quantity * peopleCount
    : unitPrice * quantity;

  const photoUrl = dish.photo_url;
  const photos = dish.dish_photos?.length
    ? dish.dish_photos
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((p) => ({ src: p.photo_url }))
    : photoUrl
      ? [{ src: photoUrl }]
      : [];

  const displayName = item.custom_name ?? dish.display_name;

  const showPrice = priceDisplayMode !== 'HIDDEN';

  return (
    <>
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 30px 80px rgba(0,0,0,0.12)' }}
        className="flex items-start gap-4 rounded-2xl bg-ivory p-4 shadow-premium transition-shadow"
      >
        {/* Photo */}
        <div
          className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl md:h-[120px] md:w-[120px]"
          onClick={() => photos.length > 0 && setLightboxOpen(true)}
        >
          {photoUrl ? (
            <motion.img
              src={photoUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, var(--theme-secondary, #e8e4dd), var(--theme-bg, #FAF7F2))` }}
            >
              <UtensilsCrossed className="h-6 w-6 text-charcoal/30 md:h-8 md:w-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display text-base font-semibold md:text-lg" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
              {displayName}
            </h4>
            {item.is_client_editable && (
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                className="shrink-0"
                title="Możliwość zamiany"
              >
                <RefreshCw className="h-4 w-4" style={{ color: 'var(--theme-accent, #c9a84c)' }} />
              </motion.div>
            )}
          </div>

          {dish.description_sales && (
            <p className="line-clamp-2 font-body text-sm leading-relaxed" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.7 }}>
              {dish.description_sales}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {dish.portion_weight_g && (
              <span
                className="rounded-full px-2.5 py-0.5 font-body text-xs tracking-wide"
                style={{ backgroundColor: 'var(--theme-secondary, #e8e4dd)', color: 'var(--theme-text, #1A1A1A)', opacity: 0.8 }}
              >
                {dish.portion_weight_g}g
              </span>
            )}

            {showPrice && priceDisplayMode === 'DETAILED' && (
              <span className="ml-auto font-body text-sm font-semibold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                {formatCurrency(totalPrice)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <DishLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        slides={photos}
      />
    </>
  );
};
