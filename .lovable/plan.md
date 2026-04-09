

# Odblokowanie nawigacji po krokach wizarda dla istniejących ofert

## Problem
Przy edycji istniejącej oferty `LOAD_OFFER` ustawia `completedSteps: [1]` — wszystkie kroki 2-7 są zablokowane. Stepper wymaga `isCompleted || isActive` żeby krok był klikalny.

## Rozwiązanie
Przy ładowaniu istniejącej oferty (edycja) — oznaczyć kroki 1-6 jako completed, żeby użytkownik mógł przejść do dowolnego etapu. Krok 7 (podgląd) też powinien być dostępny.

## Zmiany

### 1. `src/hooks/use-offer-wizard.ts` (reducer, case `LOAD_OFFER`)
- Zmienić `completedSteps: [1]` → `completedSteps: [1, 2, 3, 4, 5, 6, 7]`

### 2. `src/components/features/offers/wizard-stepper.tsx`
- Zmienić `isClickable` z `isCompleted || isActive` na `isCompleted || isActive` — bez zmian w stepper, bo po zmianie reducera wszystkie kroki będą completed

### 3. `src/components/features/offers/offer-wizard.tsx` (funkcja `goToStep`)
- Upewnić się że `goToStep` dla kroku 2+ nie blokuje gdy `offerId` już istnieje (to już działa)
- Dodać auto-complete kroku przy przejściu dalej: w `goToStep` dodać `dispatch({ type: 'COMPLETE_STEP', step: state.currentStep })` przed zmianą kroku — żeby nowa oferta też odblokowywała kolejne kroki po przejściu

## Brak zmian w bazie danych

