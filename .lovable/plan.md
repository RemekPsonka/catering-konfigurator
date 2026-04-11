

## Plan: Pełna edycja warunków oferty (globalne + per oferta)

### 1. Migracja SQL — nowa tabela `offer_term_overrides`

```sql
CREATE TABLE public.offer_term_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES offer_terms(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(offer_id, term_id)
);

ALTER TABLE public.offer_term_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_overrides_read" ON public.offer_term_overrides FOR SELECT USING (true);
CREATE POLICY "auth_overrides_all" ON public.offer_term_overrides FOR ALL USING (auth.uid() IS NOT NULL);
```

### 2. Nowy komponent: `src/components/features/settings/terms-page.tsx`

Panel admin do zarządzania globalnymi warunkami (zakładka "Warunki" w Ustawieniach):
- Lista warunków z `offer_terms` posortowana po `display_order`
- Inline editing: `label` i `value` (textarea) per warunek
- Switch `is_active` (ukryj/pokaż globalnie)
- Przycisk "Dodaj warunek" — dialog z polami key, label, value
- Przycisk "Usuń" z `ConfirmDialog`
- Zmiana kolejności via strzałki góra/dół (aktualizacja `display_order`)

### 3. Aktualizacja `src/pages/admin/settings.tsx`

Dodaj zakładkę "Warunki" z ikoną `FileText`:
```tsx
<TabsTrigger value="terms"><FileText className="mr-1 h-4 w-4" /> Warunki</TabsTrigger>
<TabsContent value="terms"><TermsPage /></TabsContent>
```

### 4. Nowy hook: `src/hooks/use-offer-terms.ts`

Hook do CRUD na `offer_terms` (admin) + `offer_term_overrides` (per oferta):
- `useOfferTermsAdmin()` — pełna lista warunków (admin CRUD)
- `useAddTerm()`, `useUpdateTerm()`, `useDeleteTerm()` — mutacje globalne
- `useOfferTermOverrides(offerId)` — pobranie overrides dla oferty
- `useSaveTermOverride()` — INSERT ON CONFLICT UPDATE override
- `useDeleteTermOverride()` — usunięcie override (przywróć domyślne)

### 5. Zmiana `useOfferTerms()` w `src/hooks/use-public-offer.ts`

Dodaj opcjonalny parametr `offerId`:
```typescript
export const useOfferTerms = (offerId?: string) => {
  return useQuery({
    queryKey: ['offer-terms', offerId ?? 'global'],
    queryFn: async () => {
      // 1. Pobierz globalne aktywne termy
      const { data: terms } = await supabase.from('offer_terms')...
      // 2. Jeśli offerId — pobierz overrides
      const { data: overrides } = offerId ? await supabase.from('offer_term_overrides')... : { data: [] };
      // 3. Złącz: override.is_hidden → pomiń; override.value → nadpisz
      return mergedTerms;
    },
  });
};
```

### 6. Aktualizacja konsumentów `useOfferTerms` (3 pliki)

| Plik | Zmiana |
|------|--------|
| `terms-section.tsx` | Przyjmij prop `offerId`, przekaż do `useOfferTerms(offerId)` |
| `use-offer-print-data.ts` (auth) | `useOfferTerms(offerId)` |
| `use-offer-print-data.ts` (public) | `useOfferTerms(offerQuery.data?.id)` |
| `step-preview-send.tsx` | Lokalny termsQuery zamień na `useOfferTerms(offerId)` + dodaj edycję |

### 7. Edycja warunków per oferta w `step-preview-send.tsx`

W sekcji Warunki (linia 588-597):
- Ikona ołówka przy hover na każdym warunku
- Klik → inline textarea z wartością
- Checkbox "Ukryj w tej ofercie" → `is_hidden=true`
- Przycisk "Przywróć domyślne" → DELETE override
- Badge "Zmieniony" przy overridowanych warunkach (niebieskie tło)
- Zapis: `useSaveTermOverride` (INSERT ON CONFLICT UPDATE do `offer_term_overrides`)

### 8. Uproszczenie `terms-section.tsx` (widok publiczny)

Zamień akordeon na prostą listę:
```tsx
<div className="space-y-3">
  {terms.map(term => (
    <p key={term.id} className="font-body text-sm">
      <span className="font-semibold">{term.label}:</span> {term.value}
    </p>
  ))}
</div>
```
Bez `AnimatePresence`, bez `ChevronDown`, bez `openIndex` state.

### 9. Przekazanie offerId do TermsSection

W `src/pages/public/offer.tsx` — przekaż `offerId` jako prop do `<TermsSection offerId={offer.id} />`.

### Pliki nowe (2)
1. `src/components/features/settings/terms-page.tsx`
2. `src/hooks/use-offer-terms.ts`

### Pliki modyfikowane (5)
1. Migracja SQL
2. `src/pages/admin/settings.tsx` — nowa zakładka
3. `src/hooks/use-public-offer.ts` — `useOfferTerms(offerId?)`
4. `src/hooks/use-offer-print-data.ts` — przekaż offerId
5. `src/components/public/terms-section.tsx` — uproszczenie + offerId prop
6. `src/components/features/offers/steps/step-preview-send.tsx` — edycja warunków per oferta
7. `src/pages/public/offer.tsx` — przekaż offerId do TermsSection

