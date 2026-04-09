import type { OfferStatus, LeadStatus, EventType, DishCategory } from '@/types';

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: 'Szkic',
  sent: 'Wysłana',
  viewed: 'Wyświetlona',
  accepted: 'Zaakceptowana',
  rejected: 'Odrzucona',
  expired: 'Wygasła',
};

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-500',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nowy',
  contacted: 'Skontaktowany',
  qualified: 'Zakwalifikowany',
  proposal: 'Propozycja',
  negotiation: 'Negocjacje',
  won: 'Wygrany',
  lost: 'Przegrany',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-muted text-muted-foreground',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-indigo-100 text-indigo-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wesele',
  corporate: 'Firmowy',
  birthday: 'Urodziny',
  communion: 'Komunia',
  funeral: 'Stypa',
  other: 'Inny',
};

export const DISH_CATEGORY_LABELS: Record<DishCategory, string> = {
  appetizer: 'Przystawka',
  soup: 'Zupa',
  main_course: 'Danie główne',
  dessert: 'Deser',
  salad: 'Sałatka',
  drink: 'Napój',
  bread: 'Pieczywo',
  addition: 'Dodatek',
};

export const ITEMS_PER_PAGE = 20;
