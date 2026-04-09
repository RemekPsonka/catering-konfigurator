import type { OfferItem } from '@/types';

export const calculateTotalPrice = (items: OfferItem[]): number => {
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
