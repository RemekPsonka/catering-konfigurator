

# Naprawa ikony edycji + testowe dane modyfikacji

## 1. Fix w `src/components/public/dish-card.tsx`
Przesunąć definicję `modifications` przed `isEditable` i dodać warunek `!!modifications`:

```typescript
// linia 88-91 zmienić na:
const modifications: Json | null = (item.allowed_modifications ?? dish.modifiable_items) as Json | null;
const isEditable = item.is_client_editable && onToggleExpand && !!modifications;
```

## 2. Ustawić `modifiable_items` na daniach (UPDATE via insert tool)

| Danie | Typ modyfikacji | Konfiguracja |
|-------|----------------|--------------|
| Rosołek tradycyjny | SWAP | Zamień na: Krem z pomidorów, Pierogi ruskie |
| Polędwica wołowa | VARIANT | Warianty: medium rare (+0 zł), well done (+0 zł), z sosem pieprzowym (+8 zł) |
| Pierogi ruskie | SWAP | Zamień na: Polędwica wołowa, Kiełbasa śląska |
| Tarta cytrynowa | VARIANT | Warianty: z bezą (+0 zł), z kremem mascarpone (+4 zł), bez glutenu (+6 zł) |
| Kiełbasa śląska | SPLIT | Podziel z: Polędwica wołowa, min 30% |
| Kawa przelewowa | VARIANT | Warianty: arabica (+0 zł), specialty (+5 zł) |

Ustawić `is_modifiable = true` na tych daniach.

## 3. Ustawić `is_client_editable = true` i `allowed_modifications` na variant_items oferty CS-2026-0001

Dla itemów w ofercie, ustawić `is_client_editable = true` tam gdzie danie ma `modifiable_items`, aby klient mógł testować zamianę/warianty/split.

## Brak zmian w schemacie bazy — tylko UPDATE danych + 1 linia kodu.
