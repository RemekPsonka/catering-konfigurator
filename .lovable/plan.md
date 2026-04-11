

## Plan: Usuń 7 nieużywanych komponentów (~1365 linii)

Każdy plik zweryfikowany — zero importów w projekcie.

### Pliki do usunięcia
1. `src/components/features/offers/steps/step-placeholder.tsx`
2. `src/components/features/offers/steps/step-calculation.tsx`
3. `src/components/features/offers/steps/step-services.tsx`
4. `src/components/features/offers/steps/step-preview.tsx`
5. `src/components/public/services-section.tsx`
6. `src/components/public/logistics-section.tsx`
7. `src/components/public/corrections-section.tsx`

### Po usunięciu
- `npm run build` dla weryfikacji braku błędów kompilacji

### Bez innych zmian
Żaden plik nie wymaga aktualizacji — te komponenty nie są nigdzie importowane.

