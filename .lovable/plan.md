

# Krok 3 (Usługi dodatkowe) + Krok 4 (Ustawienia klienta)

## Zakres
Implementacja kroków 3 i 4 wizarda oferty. Krok 3: wybór usług z checkboxami, grupowanie per typ, ilość/cena/notatki. Krok 4: tryb wyświetlania cen, cena minimalna, edytowalność liczby osób.

## Pliki do utworzenia

### 1. `src/hooks/use-offer-services.ts`
Hook React Query do CRUD `offer_services`:
- `useOfferServices(offerId)` — query `offer_services` z joinem na `services` (name, type, price, price_type), filtr po `offer_id`
- `useAddOfferService()` — INSERT (offer_id, service_id, quantity=1)
- `useUpdateOfferService()` — UPDATE quantity, custom_price, notes
- `useRemoveOfferService()` — DELETE

### 2. `src/components/features/offers/steps/step-services.tsx`
Krok 3 — Usługi dodatkowe:
- Pobiera aktywne usługi z `useServices()` (is_active=true) i zaznaczone z `useOfferServices(offerId)`
- Grupowanie w sekcje (Card per typ): Obsługa | Sprzęt | Logistyka (używa `SERVICE_TYPE_LABELS`)
- Per usługa: Checkbox + nazwa + cena bazowa + typ ceny (badge)
- Zaznaczenie → INSERT do `offer_services`; odznaczenie → DELETE
- Per zaznaczona: inline inputs dla ilości (number, min 1), custom_price (opcjonalne, placeholder = cena bazowa), notatki (text)
- Podsumowanie na dole: "Usługi łącznie: X zł" (Σ `custom_price ?? base_price` × quantity)
- Props: `offerId: string | null`

### 3. `src/components/features/offers/steps/step-settings.tsx`
Krok 4 — Ustawienia klienta:
- Pobiera aktualne dane oferty z `useQuery(['offer', offerId])` lub z wizard state
- Zapisuje bezpośrednio do `offers` via mutation (UPDATE `price_display_mode`, `min_offer_price`, `is_people_count_editable`)
- **Tryb wyświetlania cen**: RadioGroup z 5 opcji (DETAILED / PER_PERSON_AND_TOTAL / TOTAL_ONLY / PER_PERSON_ONLY / HIDDEN), każda z opisem
- **Cena minimalna**: Input number, opcjonalny, z tooltipem
- **Edytowalność liczby osób**: Switch z wyjaśnieniem zależnym od pricing_mode
- Podgląd na dole: "Klient zobaczy ceny w trybie: [wybrana opcja]"
- Props: `offerId: string | null`, `pricingMode: string`

## Pliki do zmodyfikowania

### 4. `src/components/features/offers/offer-wizard.tsx`
- Import `StepServices` i `StepSettings`
- `case 3`: render `<StepServices offerId={state.offerId} />`
- `case 4`: render `<StepSettings offerId={state.offerId} pricingMode={state.stepData.eventData.pricing_mode} />`

## Szczegóły techniczne
- Usługi query: `supabase.from('offer_services').select('*, services(*)').eq('offer_id', id)`
- Dostępne usługi: reuse `useServices()` z istniejącego hooka (bez filterType = wszystkie aktywne)
- Krok 3 wymaga offerId — wizard już wymusza zapis szkicu przed krokiem 2+
- Krok 4 UPDATE: `supabase.from('offers').update({ price_display_mode, min_offer_price, is_people_count_editable }).eq('id', offerId)`
- Brak zmian w bazie danych — tabele `offer_services` i `offers` już istnieją z wymaganymi kolumnami

