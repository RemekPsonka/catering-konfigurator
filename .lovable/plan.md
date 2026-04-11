

## Plan: CS-PDF-02 — OfferPrintDocument

### Struktura plików

```text
src/
  components/print/
    print-styles.css              ← @media print + @page A4
    OfferPrintDocument.tsx         ← główny komponent (props → 5 sekcji)
    PrintHeader.tsx                ← logo + dane firmy + klient + event + greeting
    PrintVariantsComparison.tsx    ← tabela wariantów obok siebie (1-3 kolumn)
    PrintServicesTable.tsx         ← usługi + logistyka + upsell
    PrintCostSummary.tsx           ← podsumowanie finansowe + warunki
    PrintFooter.tsx                ← koordynator + blok akceptacji + stopka prawna
  hooks/
    use-offer-print-data.ts        ← hook do pobrania danych po offer ID (auth)
    use-offer-print-data-by-token.ts ← hook po public_token (no auth)
  pages/
    public/offer-print.tsx         ← /offer/:publicToken/print
    admin/offer-print.tsx          ← /admin/offers/:id/print
```

### Props OfferPrintDocument

```tsx
interface OfferPrintDocumentProps {
  offer: PublicOffer;                    // reuse existing type
  companyInfo: CompanyInfo;              // from use-company-info
  offerTerms: Tables<'offer_terms'>[];
  upsellSelections?: Tables<'offer_upsell_selections'>[];
}
```

### Hooki danych

**useOfferPrintData(offerId)** — authenticated, queries `offers` by ID with same joins as `usePublicOffer` + `company_info` + `offer_terms` + `offer_upsell_selections`.

**useOfferPrintDataByToken(publicToken)** — public, reuses `usePublicOffer` + adds `company_info` + `offer_terms` + `offer_upsell_selections`. Fires `pdf_downloaded` tracking event on mount.

### 5 sekcji dokumentu

1. **PrintHeader** — logo (img z company_info.logo_url), nazwa firmy, NIP, adres, dane klienta (name, company, email, phone), event details (typ, data, lokalizacja, people_count, delivery_type), numer oferty z wersją (`CS-2026-0001/v2`), data wersji, greeting_text

2. **PrintVariantsComparison** — tabela z wariantami obok siebie. Grupowanie po `dish_categories`. Wiersze: kategoria header → dania z ceną. Kolumny dynamiczne (1/2/3 warianty). Badge "Rekomendowany" przy `is_recommended`. Ceny per person + total w zależności od `pricing_mode`

3. **PrintServicesTable** — tabela usług (name, qty, price, total). Opcjonalnie upsell selections jeśli istnieją. Delivery cost jako osobna pozycja

4. **PrintCostSummary** — per-variant totals (wariant / dania / rabat / usługi / dostawa / razem / per os.). Warunki oferty (wszystkie `offer_terms` rozwinięte — label + value, bez accordion). Data ważności oferty

5. **PrintFooter** — koordynator (coordinator_name, coordinator_phone). Blok akceptacji: "Akceptuję ofertę" + puste pola (data, podpis). Stopka prawna: NONO FOOD Sp. z o.o., NIP, KRS, adres

### Stylowanie

- Osobny plik `print-styles.css` importowany w OfferPrintDocument
- `@page { size: A4; margin: 15mm; }`
- CSS counters na numer strony w stopce
- `page-break-before: always` między sekcjami 1-2, 3-4, 4-5
- 11pt base font, czarno-białe, border na tabelach, `thead` powtarzany
- Zero kolorów tła poza nagłówkami tabel (jasny szary #f5f5f5)

### Routing

- `/offer/:publicToken/print` → `OfferPrintPage` (w `PublicLayout`, bez auth)
- `/admin/offers/:id/print` → `AdminOfferPrintPage` (w `AuthGuard`)
- Obie strony: renderuj `<OfferPrintDocument />` + auto `window.print()` po załadowaniu danych

### Obsługa 1-3 wariantów

- 1 wariant: pełna szerokość tabeli (100%)
- 2 warianty: 2 kolumny (50/50)
- 3 warianty: 3 kolumny (33/33/33)
- Wspólna kolumna kategorii po lewej

### Nowe pliki (8)
1. `src/components/print/print-styles.css`
2. `src/components/print/OfferPrintDocument.tsx`
3. `src/components/print/PrintHeader.tsx`
4. `src/components/print/PrintVariantsComparison.tsx`
5. `src/components/print/PrintServicesTable.tsx`
6. `src/components/print/PrintCostSummary.tsx`
7. `src/components/print/PrintFooter.tsx`
8. `src/hooks/use-offer-print-data.ts`

### Modyfikowane pliki (1)
1. `src/App.tsx` — dodaj 2 routes

### Nie ruszam
- Strony publicznej oferty, komponentów public/
- Wizarda ofert, tracking (poza dodaniem pdf_downloaded event)
- Edge Functions, RLS, tabel

