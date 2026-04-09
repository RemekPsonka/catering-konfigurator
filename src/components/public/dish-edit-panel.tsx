import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/calculations';
import type { Json } from '@/integrations/supabase/types';

export interface DishModification {
  type: 'swap' | 'variant' | 'split';
  swapDishId?: string;
  swapDishName?: string;
  swapDishPhoto?: string;
  swapPriceDiff?: number;
  variantOptionIndex?: number;
  variantPriceModifier?: number;
  splitPercent?: number;
  splitDishId?: string;
  splitDishName?: string;
}

interface SwapAlternative {
  dish_id: string;
  label: string;
  price_diff?: number;
  photo_url?: string;
}

interface VariantOption {
  label: string;
  price_modifier: number;
}

interface SplitTarget {
  dish_id: string;
  label: string;
}

interface ParsedModifications {
  type: 'swap' | 'variant' | 'split';
  alternatives?: SwapAlternative[];
  options?: VariantOption[];
  can_split_with?: SplitTarget[];
  min_split_percent?: number;
}

const parseModifications = (raw: Json | null): ParsedModifications | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const type = obj.type as string;
  if (type !== 'swap' && type !== 'variant' && type !== 'split') return null;
  return obj as unknown as ParsedModifications;
};

interface DishEditPanelProps {
  modifications: Json | null;
  currentValue: DishModification | undefined;
  onChange: (mod: DishModification | undefined) => void;
  originalDishName: string;
}

export const DishEditPanel = ({ modifications, currentValue, onChange, originalDishName }: DishEditPanelProps) => {
  const parsed = parseModifications(modifications);
  if (!parsed) return null;

  if (parsed.type === 'swap' && parsed.alternatives?.length) {
    return (
      <SwapPanel
        alternatives={parsed.alternatives}
        currentValue={currentValue}
        onChange={onChange}
        originalDishName={originalDishName}
      />
    );
  }

  if (parsed.type === 'variant' && parsed.options?.length) {
    return (
      <VariantPanel
        options={parsed.options}
        currentValue={currentValue}
        onChange={onChange}
      />
    );
  }

  if (parsed.type === 'split' && parsed.can_split_with?.length) {
    return (
      <SplitPanel
        targets={parsed.can_split_with}
        minPercent={parsed.min_split_percent ?? 10}
        currentValue={currentValue}
        onChange={onChange}
        originalDishName={originalDishName}
      />
    );
  }

  return null;
};

/* ---- SWAP Panel ---- */

const SwapPanel = ({
  alternatives,
  currentValue,
  onChange,
  originalDishName,
}: {
  alternatives: SwapAlternative[];
  currentValue: DishModification | undefined;
  onChange: (mod: DishModification | undefined) => void;
  originalDishName: string;
}) => {
  const selectedId = currentValue?.swapDishId;

  return (
    <div className="py-3">
      <p className="mb-3 font-body text-xs uppercase tracking-wide" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}>
        Wybierz alternatywę
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {alternatives.map((alt) => {
          const isSelected = selectedId === alt.dish_id;
          return (
            <motion.button
              key={alt.dish_id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (isSelected) {
                  onChange(undefined);
                } else {
                  onChange({
                    type: 'swap',
                    swapDishId: alt.dish_id,
                    swapDishName: alt.label,
                    swapDishPhoto: alt.photo_url,
                    swapPriceDiff: alt.price_diff ?? 0,
                  });
                }
              }}
              className="flex min-w-[140px] shrink-0 flex-col items-center gap-2 rounded-xl p-3 transition-all"
              style={{
                backgroundColor: 'var(--theme-bg, #FAF7F2)',
                border: isSelected
                  ? '2px solid var(--theme-primary, #1A1A1A)'
                  : '2px solid transparent',
                boxShadow: isSelected
                  ? '0 0 40px rgba(var(--theme-primary-rgb, 26,26,26), 0.15)'
                  : '0 4px 12px rgba(0,0,0,0.06)',
              }}
            >
              <div className="h-14 w-14 overflow-hidden rounded-xl">
                {alt.photo_url ? (
                  <img src={alt.photo_url} alt={alt.label} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: `linear-gradient(135deg, var(--theme-secondary, #e8e4dd), var(--theme-bg, #FAF7F2))` }}
                  >
                    <UtensilsCrossed className="h-5 w-5 text-charcoal/30" />
                  </div>
                )}
              </div>
              <span className="text-center font-body text-xs font-medium" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                {alt.label}
              </span>
              {alt.price_diff != null && alt.price_diff !== 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: alt.price_diff > 0
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(34, 197, 94, 0.1)',
                    color: alt.price_diff > 0 ? '#dc2626' : '#16a34a',
                  }}
                >
                  {alt.price_diff > 0 ? '+' : ''}{formatCurrency(alt.price_diff)}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ---- VARIANT Panel ---- */

const VariantPanel = ({
  options,
  currentValue,
  onChange,
}: {
  options: VariantOption[];
  currentValue: DishModification | undefined;
  onChange: (mod: DishModification | undefined) => void;
}) => {
  const selectedIdx = currentValue?.variantOptionIndex;

  return (
    <div className="py-3">
      <p className="mb-3 font-body text-xs uppercase tracking-wide" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}>
        Wybierz wariant
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isSelected) {
                  onChange(undefined);
                } else {
                  onChange({
                    type: 'variant',
                    variantOptionIndex: idx,
                    variantPriceModifier: opt.price_modifier,
                  });
                }
              }}
              className="rounded-full px-4 py-2 font-body text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: isSelected ? 'var(--theme-primary, #1A1A1A)' : 'var(--theme-bg, #FAF7F2)',
                color: isSelected ? '#FAF7F2' : 'var(--theme-text, #1A1A1A)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--theme-primary, #1A1A1A)' : 'var(--theme-secondary, #e8e4dd)',
              }}
            >
              {opt.label}
              {opt.price_modifier !== 0 && (
                <span className="ml-1.5 opacity-70">
                  ({opt.price_modifier > 0 ? '+' : ''}{formatCurrency(opt.price_modifier)})
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ---- SPLIT Panel ---- */

const SplitPanel = ({
  targets,
  minPercent,
  currentValue,
  onChange,
  originalDishName,
}: {
  targets: SplitTarget[];
  minPercent: number;
  currentValue: DishModification | undefined;
  onChange: (mod: DishModification | undefined) => void;
  originalDishName: string;
}) => {
  const target = targets[0];
  if (!target) return null;

  const percent = currentValue?.splitPercent ?? 100;
  const isActive = currentValue?.type === 'split';

  const handleChange = (values: number[]) => {
    const val = values[0];
    if (val >= 100) {
      onChange(undefined);
    } else {
      onChange({
        type: 'split',
        splitPercent: val,
        splitDishId: target.dish_id,
        splitDishName: target.label,
      });
    }
  };

  return (
    <div className="py-3">
      <p className="mb-3 font-body text-xs uppercase tracking-wide" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}>
        Podziel ilość
      </p>
      <div className="px-1">
        <Slider
          value={[isActive ? percent : 100]}
          onValueChange={handleChange}
          min={minPercent}
          max={100}
          step={5}
          className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-2 [&_[role=slider]]:shadow-premium [&_.relative]:h-2 [&_.relative]:rounded-full"
          style={{
            '--slider-track': 'var(--theme-secondary, #e8e4dd)',
            '--slider-range': 'var(--theme-primary, #1A1A1A)',
            '--slider-thumb-border': 'var(--theme-primary, #1A1A1A)',
          } as React.CSSProperties}
        />
        <div className="mt-3 flex justify-between font-body text-sm">
          <span style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            {originalDishName}: <strong>{isActive ? percent : 100}%</strong>
          </span>
          {isActive && (
            <span style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.7 }}>
              {target.label}: <strong>{100 - percent}%</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
