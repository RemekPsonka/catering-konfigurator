

# Trzy usprawnienia: rabat, logistyka, podgląd klienta

## Usprawnienie 1: Rabat widoczny dla klienta

### Plik: `src/components/public/calculation-section.tsx`

W sekcji DETAILED (linia 172-246) — po wariantach, przed services — dodać widoczny blok rabatu:
- Wiersz "Menu": cena PRZED rabatem (przekreślona, opacity-50)
- Wiersz "Rabat [X]%: -kwota" lub "Rabat: -kwota" (zielony, green-50 tło)
- Wiersz "Menu po rabacie": cena finalna (bold, --theme-primary)

W trybach PER_PERSON_ONLY / PER_PERSON_AND_TOTAL / TOTAL_ONLY (linie 248-270) — obecny blok rabatu (linia 249) już istnieje ale jest ukryty w DETAILED. Zmienić:
- Usunąć warunek `price_display_mode !== 'DETAILED'` z linii 249 i 261
- W DETAILED: rabat już wbudowany w sekcję wariantów (wyżej)
- W TOTAL_ONLY: "Uwzględniono rabat [X]% na menu" (bez kwot szczegółowych)
- W PER_PERSON_ONLY / PER_PERSON_AND_TOTAL: pełny wiersz rabatu z kwotą

Potrzebna wartość `maxDishesTotal` (suma przed rabatem) — już dostępna w `totals.maxDishesTotal`.

## Usprawnienie 2: Sekcja Logistyka i Dostawa

### Nowy plik: `src/components/public/logistics-section.tsx`

Sekcja z 2-3 kartami:
- **Karta 1: Forma dostawy** — ikona 🚗 + delivery_type z opisem (COLD/HEATED/FULL_SERVICE mapowane na opisy)
- **Karta 2: Usługi dodatkowe** (jeśli `offer_services.length > 0`) — lista usług z ilościami
- **Karta 3: Kontakt na dzień eventu** — telefon i imię managera z `system_settings` (fetch via `supabase.rpc('get_setting', { p_key: 'manager_phone' })` i `get_setting('manager_name')`)

Styl: rounded-2xl, shadow-premium, fadeInUp, stagger, grid 1-3 kolumn

### Plik: `src/pages/public/offer.tsx`
Dodać `LogisticsSection` między kalkulacją (sekcja 10) a warunkami (sekcja 12), po porównaniu wariantów.

## Usprawnienie 3: Podgląd oczami klienta

### Plik: `src/components/features/offers/steps/step-preview.tsx`
Dodać przycisk "👁️ Otwórz podgląd jak widzi klient" w sekcji actions (linia 404):
- Jeśli `offer?.public_token` → `window.open(buildPublicOfferUrl(offer.public_token), '_blank')`
- Jeśli brak tokenu → disabled + tooltip "Zapisz ofertę, aby zobaczyć podgląd klienta"

### Plik: `src/pages/admin/offers-list.tsx`
W DropdownMenuContent (linia 173-210) dodać:
- "👁️ Podgląd klienta" → `window.open(buildPublicOfferUrl(offer.public_token), '_blank')` (tylko jeśli `offer.public_token`)
- "📋 Kopiuj link" → `navigator.clipboard.writeText(url)` + toast "Link skopiowany!" (widoczny dla statusów sent/viewed/revision/accepted)

Uwaga: `offers-list` już ma opcję "Podgląd klienta" (linia 196-204) ale tylko dla `offer.public_token`. Trzeba dodać "Kopiuj link" i rozszerzyć widoczność.

## Podsumowanie plików

| Plik | Zmiana |
|------|--------|
| `src/components/public/calculation-section.tsx` | Rabat: przekreślona cena + zielony wiersz rabatu |
| `src/components/public/logistics-section.tsx` | NOWY — sekcja logistyki z 3 kartami |
| `src/pages/public/offer.tsx` | Import + render LogisticsSection |
| `src/components/features/offers/steps/step-preview.tsx` | Przycisk podglądu klienta |
| `src/pages/admin/offers-list.tsx` | "Kopiuj link" w menu akcji |

## Brak zmian w bazie danych

