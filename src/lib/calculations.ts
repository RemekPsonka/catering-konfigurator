import type { VariantWithItems } from '@/hooks/use-offer-variants';
import { getItemPrice } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

const roundMoney = (n: number) => Math.round(n * 100) / 100;

export const calculateBlockPrice = (
  price: number,
  extraPrice: number | null,
  quantity: number,
): number => {
  if (quantity <= 0) return 0;
  return price + Math.max(0, quantity - 1) * (extraPrice ?? price);
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
    const qty = os.quantity ?? 1;
    if (os.services.price_type === 'PER_BLOCK') {
      const extraPrice = os.services.extra_block_price != null ? Number(os.services.extra_block_price) : null;
      return sum + calculateBlockPrice(price, extraPrice, qty);
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
