import type { OfferStatus, LeadStatus, EventType, DishCategory } from '@/types';

export const DEV_MODE = false;

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: 'Szkic',
  ready: 'Gotowa',
  sent: 'Wysłana',
  viewed: 'Wyświetlona',
  revision: 'Rewizja',
  accepted: 'Zaakceptowana',
  won: 'Wygrana',
  lost: 'Przegrana',
};

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  ready: 'bg-blue-100 text-blue-800',
  sent: 'bg-indigo-100 text-indigo-800',
  viewed: 'bg-purple-100 text-purple-800',
  revision: 'bg-orange-100 text-orange-800',
  accepted: 'bg-green-100 text-green-800',
  won: 'bg-emerald-200 text-emerald-900 font-bold',
  lost: 'bg-red-100 text-red-800',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nowy',
  qualifying: 'Kwalifikacja',
  offer_sent: 'Oferta wysłana',
  follow_up: 'Follow-up',
  negotiation: 'Negocjacje',
  won: 'Wygrany',
  lost: 'Przegrany',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-muted text-muted-foreground',
  qualifying: 'bg-blue-100 text-blue-800',
  offer_sent: 'bg-indigo-100 text-indigo-800',
  follow_up: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  KOM: 'Komunia',
  WES: 'Wesele',
  FIR: 'Firmowy',
  KON: 'Konferencja',
  SZK: 'Szkolenie',
  PRY: 'Przyjęcie prywatne',
  GAL: 'Gala',
  STY: 'Stypa',
  GRI: 'Grill',
  B2B: 'Spotkanie B2B',
  BOX: 'Catering pudełkowy',
  KAW: 'Przerwa kawowa',
  SWI: 'Spotkanie świąteczne',
  SPE: 'Specjalny',
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

export const PUBLIC_BASE_URL = 'https://catering-konfigurator.lovable.app';
