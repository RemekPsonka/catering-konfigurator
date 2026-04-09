

# Podsumowanie kosztów: łączna kwota per wariant + widoczny rabat

## Co się zmieni

### 1. Grand total per wariant (zamiast jednego grand total)
Obecnie sekcja "Łącznie" pokazuje jedną kwotę (najdroższy wariant). Zmienię to, żeby każdy wariant miał swoją łączną kwotę (dania + usługi + dostawa - rabat), wyświetloną w oddzielnym wierszu.

### 2. Widoczny rabat
Jeśli oferta ma rabat (procentowy lub kwotowy), pokażę go wyraźnie nad sekcją łącznych kwot — niezależnie od trybu wyświetlania (nie tylko w DETAILED).

## Szczegóły techniczne

### `src/lib/calculations.ts`
- Dodać do `VariantTotal` pole `grandTotal` (= variant.total - discount + services + delivery) obliczane per wariant
- Rabat per wariant: proporcjonalny do wartości wariantu (procent) lub stała kwota

### `src/components/public/calculation-section.tsx`
- W sekcji grand total (linia 282-305): zamiast jednej kwoty `totals.grandTotal`, wyświetlić listę wariantów z ich indywidualnymi łącznymi kwotami
- Dodać wiersz rabatu (widoczny we WSZYSTKICH trybach, nie tylko DETAILED) przed grand total
- Każdy wariant w grand total: nazwa + łączna kwota + cena/os.
- Format:

```text
┌─────────────────────────────────────┐
│ Rabat: -10%           -2 145,52 zł  │  ← jeśli jest rabat
├─────────────────────────────────────┤
│         ŁĄCZNIE                      │
│                                      │
│ Classic        19 309,68 zł          │
│                185,67 zł / osoba     │
│                                      │
│ Premium        21 455,20 zł          │
│                206,30 zł / osoba     │
└─────────────────────────────────────┘
```

### Pliki do zmiany
1. **`src/lib/calculations.ts`** — dodać `grandTotal` per wariant do `VariantTotal`
2. **`src/components/public/calculation-section.tsx`** — renderować grand total per wariant + rabat widoczny globalnie

### Brak zmian w bazie danych

