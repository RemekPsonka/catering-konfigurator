import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, RefreshCw, X } from 'lucide-react';
import { DishLightbox } from './dish-lightbox';
import { DishEditPanel } from './dish-edit-panel';
import type { DishModification } from './dish-edit-panel';
import { formatCurrency } from '@/lib/calculations';
import type { Tables, Enums, Json } from '@/integrations/supabase/types';

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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  modification?: DishModification;
  onModificationChange?: (mod: DishModification | undefined) => void;
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

export const DishCard = ({
  item,
  priceDisplayMode,
  pricingMode,
  peopleCount,
  isExpanded,
  onToggleExpand,
  modification,
  onModificationChange,
}: DishCardProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const dish = item.dishes;
  const basePrice = item.custom_price != null ? Number(item.custom_price) : getPrice(dish);
  const variantMod = Number(item.variant_price_modifier) || 0;
  const unitPrice = basePrice + variantMod;

  // Apply temporary client modification price adjustments
  let effectivePrice = unitPrice;
  if (modification?.type === 'swap' && modification.swapPriceDiff != null) {
    effectivePrice = basePrice + modification.swapPriceDiff;
  } else if (modification?.type === 'variant' && modification.variantPriceModifier != null) {
    effectivePrice = basePrice + modification.variantPriceModifier;
  }

  const quantity = item.quantity ?? 1;
  const totalPrice = pricingMode === 'PER_PERSON'
    ? effectivePrice * quantity * peopleCount
    : effectivePrice * quantity;

  const photoUrl = modification?.swapDishPhoto ?? dish.photo_url;

  // Build photos array for lightbox and masonry
  const allPhotos = dish.dish_photos?.length
    ? dish.dish_photos
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((p) => ({ src: p.photo_url }))
    : photoUrl
      ? [{ src: photoUrl }]
      : [];

  const hasMultiplePhotos = allPhotos.length > 1;


  const displayName = modification?.swapDishName ?? item.custom_name ?? dish.display_name;
  const showPrice = priceDisplayMode !== 'HIDDEN';
  const isModified = !!modification;

  const modifications: Json | null = (item.allowed_modifications ?? dish.modifiable_items) as Json | null;
  const isEditable = item.is_client_editable && onToggleExpand && !!modifications;

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div>
        <motion.div
          whileHover={{ y: -2, boxShadow: '0 30px 80px rgba(0,0,0,0.12)' }}
          className="rounded-xl p-2.5 shadow-premium transition-shadow"
          style={{
            backgroundColor: isModified
              ? 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, #FFFFF0)'
              : '#FFFFF0',
          }}
        >
          {/* Masonry gallery above content when multiple photos */}
          {hasMultiplePhotos && (
            <div className="mb-2 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2">
              {allPhotos.map((photo, i) => (
                <img
                  key={i}
                  src={photo.src}
                  alt={displayName}
                  onClick={() => handlePhotoClick(i)}
                  className="h-[180px] w-auto rounded-lg snap-center shrink-0 cursor-pointer bg-neutral-50"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          <div className="flex items-start gap-3">
            {/* Single photo thumbnail (only when 0-1 photos) */}
            {!hasMultiplePhotos && (
              <div
                className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg md:h-[72px] md:w-[72px]"
                onClick={() => allPhotos.length > 0 && handlePhotoClick(0)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={photoUrl ?? 'no-photo'}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full"
                  >
                    {photoUrl ? (
                      <motion.img
                        src={photoUrl}
                        alt={displayName}
                        loading="lazy"
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
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <AnimatePresence mode="wait">
                  <motion.h4
                    key={displayName}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="font-display text-base font-semibold md:text-lg"
                    style={{ color: 'var(--theme-text, #1A1A1A)' }}
                    >
                     {displayName}
                     {item.selected_variant_option && (
                       <span className="text-xs font-normal opacity-60 ml-1">
                         ({item.selected_variant_option})
                       </span>
                     )}
                    </motion.h4>
                </AnimatePresence>

                <div className="flex shrink-0 items-center gap-1">
                  {isModified && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: 'var(--theme-accent, #c9a84c)',
                        color: '#FAF7F2',
                      }}
                    >
                      Zmieniono
                    </motion.span>
                  )}
                  {isModified && onModificationChange && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onModificationChange(undefined);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'var(--theme-secondary, #e8e4dd)' }}
                      title="Cofnij zmianę"
                    >
                      <X className="h-3 w-3" style={{ color: 'var(--theme-text, #1A1A1A)' }} />
                    </motion.button>
                  )}
                  {isEditable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand?.();
                      }}
                      className="flex shrink-0 items-center gap-1 font-body text-xs font-medium transition-colors hover:underline"
                      style={{ color: 'var(--theme-accent, #c9a84c)' }}
                      title="Kliknij aby zobaczyć alternatywy"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>wymień na inne</span>
                    </button>
                  )}
                </div>
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
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalPrice}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="ml-auto font-body text-sm font-semibold"
                      style={{ color: 'var(--theme-primary, #1A1A1A)' }}
                    >
                      {formatCurrency(totalPrice)}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit panel */}
        <AnimatePresence>
          {isExpanded && isEditable && modifications && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden rounded-b-xl px-4"
              style={{ backgroundColor: 'color-mix(in srgb, var(--theme-secondary, #e8e4dd) 40%, var(--theme-bg, #FAF7F2))' }}
            >
              <DishEditPanel
                modifications={modifications}
                currentValue={modification}
                onChange={onModificationChange!}
                originalDishName={item.custom_name ?? dish.display_name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DishLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        slides={allPhotos}
        index={lightboxIndex}
      />
    </>
  );
};
