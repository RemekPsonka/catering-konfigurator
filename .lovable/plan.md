

# Naprawa logiki strony publicznej — warianty, ikona zamiany, duplikacje, bugi

## Pliki do zmiany

### 1. `src/pages/public/offer.tsx`
- Dodaj state `activeVariantId` (lifted z MenuVariantsSection) — współdzielony między Menu i Acceptance
- Przenieś `VariantComparisonSection` NAD `MenuVariantsSection` (między event details a menu)
- Usuń osobną `ServicesSection` i `LogisticsSection` — zastąp nową `ServicesAndLogisticsSection`
- Przekaż `activeVariantId` + `setActiveVariantId` do `MenuVariantsSection` i `AcceptanceSection`
- Nowa kolejność sekcji: Hero → Greeting → Event Details → Variant Comparison → Menu → Services & Logistics → Calculation → Terms → Communication → Acceptance → Contact → Footer

### 2. `src/components/public/variant-comparison-section.tsx` — uproszczenie
- Zmień nagłówek: "Porównaj warianty" → "Twoje warianty menu"
- Usuń przyciski "Wybierz Classic/Premium" z kart
- Usuń listę top dishes z kart — zostaw tylko: nazwa, opis, badge "Polecany", liczba pozycji, liczba do personalizacji, cena/os.
- Po kliknięciu karty: wywołaj `onSelectVariant(id)` + scroll do `#menu-section`
- Usuń rozwijalną tabelę diff (przycisk "Pokaż szczegółowe różnice") — ta info jest w Menu

### 3. `src/components/public/acceptance-section.tsx` — usunięcie wyboru wariantu
- Usuń buttony wyboru wariantu (radio row z Classic/Premium)
- Dodaj prop `activeVariantId: string | null` — wariant wybrany w Menu
- Wyświetl: "Akceptujesz wariant: [nazwa] — [cena/os.]" + przycisk "Akceptuję ofertę"
- Cenę pobieraj z `calculateOfferTotals` (nie z DB pola `price_per_person`/`total_value`) — naprawa bugu 0,00 zł
- Jeśli `activeVariantId` jest null i jest >1 wariant → pokaż komunikat "Wybierz wariant w sekcji Menu"

### 4. `src/components/public/dish-card.tsx` — przycisk "wymień na inne"
- Zamień ikonę RefreshCw 16x16 (linie 205-218) na przycisk z tekstem:
  - Layout: `flex items-center gap-1`
  - Ikona: `RefreshCw h-3.5 w-3.5`
  - Tekst: `"wymień na inne"` (`text-xs font-medium`)
  - Kolor: `var(--theme-accent)`
  - Hover: `hover:underline`
- Przycisk umieszczony w tym samym wierszu co nazwa dania (po prawej)

### 5. `src/components/public/services-logistics-section.tsx` — NOWY plik
- Połączona sekcja "Usługi i logistyka"
- Pobiera dane z `offer.offer_services` + `offer.delivery_type` + settings (manager_phone, manager_name)
- Podsekcje: Forma dostawy → Obsługa → Sprzęt → Logistyka → Kontakt na dzień eventu
- Usuwa duplikację — jedna sekcja zamiast dwóch

### 6. `src/components/public/menu-variants-section.tsx` — lifted state
- Dodaj props: `activeVariantId: string`, `onActiveVariantChange: (id: string) => void`
- Usuń wewnętrzny `useState(activeId)` — kontrolowany z rodzica
- Dodaj `id="menu-section"` na sekcji (cel scrollowania z comparison)

### 7. `src/components/public/onboarding-overlay.tsx` — tekst
- Zmień opis kroku "Personalizuj": `kliknij ikonę 🔄` → `kliknij «wymień na inne»`

### 8. Bug 0,00 zł — analiza i naprawa
- **Acceptance section**: czyta `v.price_per_person` i `v.total_value` z DB (pola na `offer_variants`) — te mogą być 0/null. Naprawić: obliczać ceny dynamicznie przez `calculateOfferTotals`.
- **Calculation table**: używa `vt.grandTotal` z `calculateOfferTotals` — jeśli `people_count` jest null, `total = perPerson × null = NaN`. Dodać fallback: `people_count ?? 1`.
- Sprawdzić `calculateOfferTotals` — `peopleCount` param powinien mieć fallback na 1 jeśli null/0.

## Pliki do usunięcia (import usunięty)
- `src/components/public/logistics-section.tsx` — treść przeniesiona do nowej sekcji
- `src/components/public/services-section.tsx` — treść przeniesiona do nowej sekcji

## Co NIE ulega zmianie
- Panel admina — zero zmian
- `src/lib/calculations.ts` — bez zmian (fallback dodany w komponentach)
- Logika propozycji zmian
- Drukowanie
- Responsywność

## Oczekiwany efekt
- Jeden punkt wyboru wariantu (taby w Menu), reszta korzysta z tego wyboru
- Przycisk "wymień na inne" czytelny
- Usługi i logistyka w jednej sekcji
- Ceny poprawne (nie 0,00 zł)
- Logiczna kolejność sekcji: zobacz → wybierz → sprawdź cenę → akceptuj

