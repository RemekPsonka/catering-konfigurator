import type { VariantWithItems } from '@/hooks/use-offer-variants';
import { getItemPrice } from '@/hooks/use-offer-variants';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

export const calculateTotalPrice = (items: { unit_price: number; quantity: number }[]): number => {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
};

export const calculatePricePerPerson = (totalPrice: number, guestCount: number): number => {
  if (guestCount <= 0) return 0;
  return Math.round((totalPrice / guestCount) * 100) / 100;
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
}

export interface OfferTotals {
  variantTotals: VariantTotal[];
  maxDishesTotal: number;
  discountAmount: number;
  dishesAfterDiscount: number;
  servicesTotalCalc: number;
  grandTotal: number;
  pricePerPerson: number;
}

export const calculateVariantDishesTotal = (variant: VariantWithItems): number => {
  return variant.variant_items.reduce((sum, item) => {
    const price = getItemPrice(item);
    const qty = item.quantity ?? 1;
    return sum + price * qty;
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
): OfferTotals => {
  const variantTotals: VariantTotal[] = variants.map((v) => {
    const perPerson = calculateVariantDishesTotal(v);
    return {
      id: v.id,
      name: v.name,
      perPerson,
      total: pricingMode === 'PER_PERSON' ? perPerson * peopleCount : perPerson,
    };
  });

  const maxDishesTotal = variantTotals.length > 0
    ? Math.max(...variantTotals.map((v) => v.total))
    : 0;

  let discountAmount = 0;
  if (discountPercent > 0) {
    discountAmount = Math.round((maxDishesTotal * discountPercent) / 100 * 100) / 100;
  } else if (discountValue > 0) {
    discountAmount = discountValue;
  }

  const dishesAfterDiscount = maxDishesTotal - discountAmount;

  const servicesTotalCalc = services.reduce((sum, os) => {
    if (!os.services) {
      const fallback = os.custom_price != null ? Number(os.custom_price) : 0;
      return sum + fallback * (os.quantity ?? 1);
    }
    const price = os.custom_price != null ? Number(os.custom_price) : os.services.price;
    return sum + price * (os.quantity ?? 1);
  }, 0);

  const grandTotal = dishesAfterDiscount + servicesTotalCalc + deliveryCost;
  const pricePerPerson = peopleCount > 0 ? Math.round((grandTotal / peopleCount) * 100) / 100 : 0;

  return {
    variantTotals,
    maxDishesTotal,
    discountAmount,
    dishesAfterDiscount,
    servicesTotalCalc,
    grandTotal,
    pricePerPerson,
  };
};
