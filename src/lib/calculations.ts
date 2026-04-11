import type { Tables, Json } from '@/integrations/supabase/types';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';
import { calculateBlockTotal } from '@/lib/service-constants';
import { supabase } from '@/integrations/supabase/client';

// ── Types (moved from use-offer-variants) ──

export interface VariantItemWithDish extends Tables<'variant_items'> {
  dishes: {
    id: string;
    display_name: string;
    photo_url: string | null;
    unit_type: string;
    price_per_person: number | null;
    price_per_piece: number | null;
    price_per_kg: number | null;
    price_per_set: number | null;
    is_modifiable: boolean | null;
    modifiable_items: Json | null;
  };
}

export interface VariantWithItems extends Tables<'offer_variants'> {
  variant_items: VariantItemWithDish[];
}

// ── Price helpers (moved from use-offer-variants) ──

export const getDishPrice = (dish: VariantItemWithDish['dishes']): number => {
  switch (dish.unit_type) {
    case 'PERSON': return dish.price_per_person ?? 0;
    case 'PIECE': return dish.price_per_piece ?? 0;
    case 'KG': return dish.price_per_kg ?? 0;
    case 'SET': return dish.price_per_set ?? 0;
    default: return 0;
  }
};

export const getItemPrice = (item: VariantItemWithDish): number => {
  const base = item.custom_price != null ? Number(item.custom_price) : getDishPrice(item.dishes);
  return base + (Number(item.variant_price_modifier) || 0);
};

// ── Calculation helpers ──

const roundMoney = (n: number) => Math.round(n * 100) / 100;

/** @deprecated Use calculateBlockTotal from service-constants instead */
export const calculateBlockPrice = calculateBlockTotal;

// ── Service line helpers (single source of truth) ──

export const getServiceEffectiveQty = (
  priceType: string,
  storedQty: number | null,
  peopleCount: number,
): number => (priceType === 'PER_PERSON' ? Math.max(1, peopleCount) : (storedQty ?? 1));

export const getServiceLineTotal = (
  price: number,
  priceType: string,
  storedQty: number | null,
  peopleCount: number,
  extraBlockPrice: number | null,
): number => {
  const qty = getServiceEffectiveQty(priceType, storedQty, peopleCount);
  if (priceType === 'PER_BLOCK') {
    return calculateBlockTotal(price, extraBlockPrice, qty);
  }
  return price * qty;
};

export const calculateTotalPrice = (items: { unit_price: number; quantity: number }[]): number => {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
};

export const calculatePricePerPerson = (totalPrice: number, guestCount: number): number => {
  if (guestCount <= 0) return 0;
  return roundMoney(totalPrice / guestCount);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export interface VariantTotal {
  id: string;
  name: string;
  perPerson: number;
  total: number;
  discountAmount: number;
  grandTotal: number;
  pricePerPerson: number;
}

export interface OfferTotals {
  variantTotals: VariantTotal[];
  maxDishesTotal: number;
  discountAmount: number;
  dishesAfterDiscount: number;
  servicesTotalCalc: number;
  upsellTotal: number;
  grandTotal: number;
  pricePerPerson: number;
}

export const calculateVariantDishesTotal = (variant: VariantWithItems): number => {
  return variant.variant_items.reduce((sum, item) => {
    const price = getItemPrice(item);
    const qty = Math.max(0, Number(item.quantity) || 1);
    const splitFactor = (item.split_percent != null ? item.split_percent / 100 : 1);
    return sum + price * qty * splitFactor;
  }, 0);
};

export const calculateOfferTotals = (
  pricingMode: string,
  peopleCount: number,
  variants: VariantWithItems[],
  services: OfferServiceWithService[],
  discountPercent: number,
  discountValue: number,
  deliveryCost: number,
  upsellTotal: number = 0,
): OfferTotals => {
  const safePeopleCount = Math.max(1, Math.round(peopleCount));

  const servicesTotalCalc = services.reduce((sum, os) => {
    if (!os.services) {
      const fallback = os.custom_price != null ? Number(os.custom_price) : 0;
      return sum + fallback * (os.quantity ?? 1);
    }
    const price = os.custom_price != null ? Number(os.custom_price) : (os.services?.price ?? 0);
    const qty = os.services.price_type === 'PER_PERSON' ? safePeopleCount : (os.quantity ?? 1);
    if (os.services.price_type === 'PER_BLOCK') {
      const extraPrice = os.services.extra_block_price != null ? Number(os.services.extra_block_price) : null;
      return sum + calculateBlockTotal(price, extraPrice, qty);
    }
    return sum + price * qty;
  }, 0);

  const variantTotals: VariantTotal[] = variants.map((v) => {
    const perPerson = calculateVariantDishesTotal(v);
    const total = pricingMode === 'PER_PERSON' ? perPerson * safePeopleCount : perPerson;

    let variantDiscount = 0;
    if (discountPercent > 0) {
      variantDiscount = roundMoney(total * discountPercent / 100);
    } else if (discountValue > 0) {
      variantDiscount = discountValue;
    }
    variantDiscount = Math.min(variantDiscount, total);

    const variantGrandTotal = Math.max(0, total - variantDiscount) + servicesTotalCalc + deliveryCost + upsellTotal;
    const variantPricePerPerson = roundMoney(variantGrandTotal / safePeopleCount);

    return {
      id: v.id,
      name: v.name,
      perPerson,
      total,
      discountAmount: variantDiscount,
      grandTotal: variantGrandTotal,
      pricePerPerson: variantPricePerPerson,
    };
  });

  const maxDishesTotal = variantTotals.length > 0
    ? Math.max(...variantTotals.map((v) => v.total))
    : 0;

  let discountAmount = 0;
  if (discountPercent > 0) {
    discountAmount = roundMoney(maxDishesTotal * discountPercent / 100);
  } else if (discountValue > 0) {
    discountAmount = discountValue;
  }
  discountAmount = Math.min(discountAmount, maxDishesTotal);

  const dishesAfterDiscount = Math.max(0, maxDishesTotal - discountAmount);
  const grandTotal = dishesAfterDiscount + servicesTotalCalc + deliveryCost + upsellTotal;
  const pricePerPerson = roundMoney(grandTotal / safePeopleCount);

  return {
    variantTotals,
    maxDishesTotal,
    discountAmount,
    dishesAfterDiscount,
    servicesTotalCalc,
    upsellTotal,
    grandTotal,
    pricePerPerson,
  };
};

// ── Async helper: recalculate & persist offer totals ──

export const recalculateOfferTotals = async (offerId: string): Promise<void> => {
  // 1. Fetch offer settings
  const { data: offer, error: oErr } = await supabase
    .from('offers')
    .select('pricing_mode, people_count, discount_percent, discount_value, delivery_cost, upsell_total')
    .eq('id', offerId)
    .single();
  if (oErr || !offer) return;

  // 2. Fetch variants with items + dishes
  const { data: variants, error: vErr } = await supabase
    .from('offer_variants')
    .select('*, variant_items!variant_items_variant_id_fkey(*, dishes(id, display_name, photo_url, unit_type, price_per_person, price_per_piece, price_per_kg, price_per_set, is_modifiable, modifiable_items))')
    .eq('offer_id', offerId)
    .order('sort_order');
  if (vErr) return;

  // 3. Fetch services
  const { data: services, error: sErr } = await supabase
    .from('offer_services')
    .select('*, services(*)')
    .eq('offer_id', offerId);
  if (sErr) return;

  // 4. Calculate totals
  const totals = calculateOfferTotals(
    offer.pricing_mode,
    offer.people_count ?? 1,
    (variants ?? []) as VariantWithItems[],
    (services ?? []) as OfferServiceWithService[],
    Number(offer.discount_percent) || 0,
    Number(offer.discount_value) || 0,
    Number(offer.delivery_cost) || 0,
    Number(offer.upsell_total) || 0,
  );

  // 5. Persist
  await supabase.from('offers').update({
    total_value: totals.grandTotal,
    total_dishes_value: totals.maxDishesTotal,
    total_services_value: totals.servicesTotalCalc,
    price_per_person: totals.pricePerPerson,
  }).eq('id', offerId);
};
