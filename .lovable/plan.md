

# Checklistka wymagań klienta — sidebar w wizardzie

## Zakres
Nowy komponent sidebar "Wymagania klienta" widoczny w krokach 2-7 wizarda, gdy `client_requirements` nie jest puste. Desktop: sticky sidebar po prawej. Mobile: floating button + bottom sheet. Hinty kontekstowe w krokach 2, 3, 5.

## Pliki do utworzenia

### 1. `src/components/features/offers/requirements-sidebar.tsx` (nowy)
Komponent sidebar z checklistką wymagań:
- Props: `requirements: ClientRequirement[]`, `onUpdate: (reqs: ClientRequirement[]) => void`
- Interface `ClientRequirement`: `{ text, category, priority, is_met: boolean | null, note?: string }`
- Desktop: `sticky top-24 w-[280px] max-h-[calc(100vh-200px)] overflow-y-auto` Card
- Mobile: floating button `📋 Wymagania ([N])` (fixed bottom-20 right-4) → Sheet (bottom, max-h-[80vh])
- Zawartość:
  - Nagłówek "Wymagania klienta" z ikoną ClipboardList
  - Lista: Checkbox + tekst + badge kategorii + badge priorytetu (must=🔴, nice=🟡)
  - Po zaznaczeniu checkbox: opcjonalny Input "Jak spełnione?"
  - Podsumowanie: "[X] z [Y] wymagań spełnionych" + Progress bar
  - Przycisk "Dodaj wymaganie" (inline form)
- `useIsMobile()` do wykrycia mobile

### 2. `src/components/features/offers/requirement-hints.tsx` (nowy)
Komponent renderujący kontekstowe hinty:
- Props: `requirements: ClientRequirement[]`, `category: string`, `currentPricePerPerson?: number`
- Filtruje wymagania po kategorii, renderuje alert-like banner:
  - "💡 Klient oczekuje: [tekst wymagania]"
  - Dla budget: porównanie aktualnej ceny z oczekiwaną (zielony/czerwony)
- Zwraca `null` jeśli brak wymagań w danej kategorii

## Pliki do zmodyfikowania

### 3. `src/hooks/use-offer-wizard.ts`
- Dodaj `client_requirements` do `LOAD_OFFER` action (z `action.offer.client_requirements`)
- Dodaj nową akcję `SET_REQUIREMENTS` do reducera
- Reducer obsługuje update requirements w `stepData.eventData.client_requirements`

### 4. `src/components/features/offers/offer-wizard.tsx`
- Import `RequirementsSidebar`
- Parse `state.stepData.eventData.client_requirements` jako `ClientRequirement[]`
- Dla kroków 2-7: zmień layout na `flex` — step content po lewej (flex-1), sidebar po prawej (jeśli requirements istnieją)
- Dispatch `SET_REQUIREMENTS` przy zmianach w checklistce
- Przy `handleSaveDraft`: requirements zapisywane przez istniejący flow (już w `saveDraftMutation`)

### 5. `src/components/features/offers/steps/step-menu.tsx`
- Import `RequirementHints`
- Nad listą dań: `<RequirementHints requirements={requirements} category="menu" />` i `category="dietary"`
- Props: dodaj opcjonalny `requirements?: ClientRequirement[]`

### 6. `src/components/features/offers/steps/step-services.tsx`
- Import `RequirementHints`
- Nad listą usług: `<RequirementHints requirements={requirements} category="service" />`
- Props: dodaj opcjonalny `requirements?: ClientRequirement[]`

### 7. `src/components/features/offers/steps/step-calculation.tsx`
- Import `RequirementHints`
- Przy podsumowaniu: `<RequirementHints requirements={requirements} category="budget" currentPricePerPerson={pricePerPerson} />`
- Props: dodaj opcjonalny `requirements?: ClientRequirement[]`

## Brak zmian w bazie danych
Kolumna `client_requirements` (JSONB) już istnieje w tabeli `offers`.

