import type { EventType } from '@/types/database';
import type { Enums } from '@/integrations/supabase/types';

type DeliveryType = Enums<'delivery_type'>;
type PricingMode = Enums<'pricing_mode'>;

export interface EventTypeOption {
  value: EventType;
  label: string;
  emoji: string;
}

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: 'KOM', label: 'Komunia', emoji: '🙏' },
  { value: 'WES', label: 'Wesele', emoji: '💒' },
  { value: 'FIR', label: 'Event firmowy', emoji: '🏢' },
  { value: 'KON', label: 'Konferencja', emoji: '🎤' },
  { value: 'SZK', label: 'Szkolenie', emoji: '📚' },
  { value: 'PRY', label: 'Impreza prywatna', emoji: '🎉' },
  { value: 'GAL', label: 'Gala / Bankiet', emoji: '🥂' },
  { value: 'STY', label: 'Stypa', emoji: '🕯️' },
  { value: 'GRI', label: 'Grill / Plener', emoji: '🔥' },
  { value: 'B2B', label: 'Stała współpraca', emoji: '🤝' },
  { value: 'BOX', label: 'Boxy', emoji: '📦' },
  { value: 'KAW', label: 'Przerwa kawowa', emoji: '☕' },
  { value: 'SWI', label: 'Spotkanie świąteczne', emoji: '🎄' },
  { value: 'SPE', label: 'Specjalne', emoji: '✨' },
];

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  COLD: 'Zimna dostawa',
  HEATED: 'Podgrzewana',
  FULL_SERVICE: 'Full service',
};

export const DELIVERY_TYPE_OPTIONS: { value: DeliveryType; label: string; description: string }[] = [
  { value: 'COLD', label: 'Zimna dostawa', description: 'Dania dostarczone w pojemnikach, klient podgrzewa samodzielnie' },
  { value: 'HEATED', label: 'Podgrzewana', description: 'Dania dostarczone w podgrzewaczach, gotowe do serwowania' },
  { value: 'FULL_SERVICE', label: 'Full service', description: 'Pełna obsługa: dostawa, setup, serwis, sprzątanie' },
];

export const PRICING_MODE_OPTIONS: { value: PricingMode; label: string; description: string }[] = [
  {
    value: 'PER_PERSON',
    label: 'Pakiet na osobę',
    description: 'Ustalamy zestaw dla 1 osoby, system mnoży × liczba osób. Typowe: komunia, wesele.',
  },
  {
    value: 'FIXED_QUANTITY',
    label: 'Kalkulacja ilościowa',
    description: 'Ustalamy ilości per pozycja niezależnie od osób. Typowe: event firmowy, catering na zamówienie.',
  },
];

export const DEFAULT_GREETINGS: Record<EventType, string> = {
  KOM: 'Szanowni Państwo, z przyjemnością prezentujemy ofertę cateringową na Państwa komunię.',
  WES: 'Szanowni Państwo, z przyjemnością prezentujemy ofertę cateringową na Państwa wesele.',
  FIR: 'Szanowni Państwo, przedstawiamy ofertę cateringową na Państwa event firmowy.',
  KON: 'Szanowni Państwo, prezentujemy ofertę cateringową na konferencję.',
  SZK: 'Szanowni Państwo, prezentujemy ofertę cateringową na szkolenie.',
  PRY: 'Szanowni Państwo, z przyjemnością prezentujemy ofertę na Państwa przyjęcie.',
  GAL: 'Szanowni Państwo, mamy zaszczyt przedstawić ofertę cateringową na galę.',
  STY: 'Szanowni Państwo, z szacunkiem prezentujemy ofertę cateringową na stypę.',
  GRI: 'Szanowni Państwo, prezentujemy ofertę na grilla / imprezę plenerową.',
  B2B: 'Szanowni Państwo, prezentujemy ofertę stałej współpracy cateringowej.',
  BOX: 'Szanowni Państwo, prezentujemy ofertę na catering pudełkowy.',
  KAW: 'Szanowni Państwo, prezentujemy ofertę na przerwę kawową.',
  SWI: 'Szanowni Państwo, prezentujemy ofertę cateringową na spotkanie świąteczne.',
  SPE: 'Szanowni Państwo, z przyjemnością prezentujemy ofertę cateringową na Państwa wydarzenie.',
};

export const WIZARD_STEPS = [
  { number: 1, label: 'Dane', icon: 'ClipboardList' },
  { number: 2, label: 'Menu', icon: 'UtensilsCrossed' },
  { number: 3, label: 'Usługi', icon: 'Wrench' },
  { number: 4, label: 'Ustawienia', icon: 'Settings' },
  { number: 5, label: 'Kalkulacja', icon: 'Calculator' },
  { number: 6, label: 'Motyw', icon: 'Palette' },
  { number: 7, label: 'Podgląd', icon: 'Eye' },
] as const;
