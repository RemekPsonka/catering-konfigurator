

## Plan: Poprawa widoku propozycji zmian — więcej kontekstu i czytelności

### Problem
Widok "Porównanie zmian" jest niezrozumiały:
- Kolumna "Propozycja" pokazuje surową wartość `proposed_variant_option` ("0") zamiast nazwy wariantu
- Brak informacji o aktualnym wyborze wariantu dania
- Brak kontekstu cenowego (cena bazowa, cena po zmianie)
- Nie widać jasno co klient chce zmienić i na co

### Zmiany w `src/pages/admin/proposal-diff.tsx`

**1. Rozbudowa DiffRow — lepszy opis zmian**

Zamiast suchej tabeli, każda pozycja będzie kartą z czytelnym opisem:

```text
┌─────────────────────────────────────────────────────┐
│ 🔄 Zmiana wariantu                      [Oczekuje] │
│                                                     │
│ Danie: Polędwica wołowa sous-vide                   │
│                                                     │
│ Obecny wariant:  (brak wyboru)                      │
│ Proponowany:     Medium rare                        │
│                                                     │
│ Cena przed: 45,00 zł → Cena po: 45,00 zł (±0 zł)  │
│                                                     │
│                           [✓ Akceptuj] [✗ Odrzuć]  │
└─────────────────────────────────────────────────────┘
```

**2. Pobranie danych o wariantach dania**

Rozszerzenie query w `useProposalDetail` — dodanie joina do `variant_items` z `dishes.modifiable_items`, żeby rozwiązać nazwy wariantów. Alternatywnie: dodatkowe query w komponencie po `variant_item_id` aby pobrać `allowed_modifications` / `modifiable_items` i zmapować opcje wariantu na czytelne nazwy.

**3. Lepsze opisy per typ zmiany:**

- **SWAP**: "Klient chce zamienić **Rosół** na **Zupę pomidorową**" + ceny obu dań
- **VARIANT_CHANGE**: "Klient chce zmienić wariant z **Medium rare** na **Z sosem pieprzowym**" + różnica cenowa
- **QUANTITY_CHANGE**: "Klient chce zmienić ilość z **2 szt.** na **3 szt.**"
- **SPLIT**: "Klient chce podzielić danie" + szczegóły podziału

**4. Sekcja kontekstu oferty w nagłówku**

Dodanie informacji o ofercie nad tabelą:
- Nazwa oferty / numer
- Nazwa wariantu menu którego dotyczy zmiana
- Link "Wróć do edycji oferty"

### Pliki modyfikowane
- `src/pages/admin/proposal-diff.tsx` — przebudowa layoutu DiffRow na karty, rozbudowa opisów, dodanie kontekstu oferty
- `src/hooks/use-proposal-diff.ts` — rozszerzenie query o `variant_items(dishes(modifiable_items))` dla rozwiązania nazw wariantów

