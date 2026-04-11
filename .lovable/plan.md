

## Plan: Toggle dosprzedaży + panel wyborów klienta w kroku 4

### 1. Toggle `upsell_enabled` w panelu "Ustawienia wyświetlania"

**Plik:** `src/components/features/offers/steps/step-preview-send.tsx`

W sekcji settings state (~linia 171), dodać:
- `const [upsellEnabled, setUpsellEnabled] = useState(true);`
- W `useEffect` ładującym settings (~linia 174): `setUpsellEnabled(offer.upsell_enabled ?? true);`
- W `settingsPayload` useMemo (~linia 184): dodać `upsell_enabled: upsellEnabled`

W UI — w `CollapsibleContent` panelu "Ustawienia wyświetlania" (~linia 389-398), pod istniejącym grid, dodać nowy wiersz:
```
<div className="flex items-center gap-2 pt-3">
  <Switch checked={upsellEnabled} onCheckedChange={setUpsellEnabled} />
  <div>
    <Label className="text-xs">Pokaż sekcję dosprzedaży klientowi</Label>
    <p className="text-xs text-muted-foreground">Klient zobaczy sugerowane dodatki na stronie oferty</p>
  </div>
</div>
```

Auto-save działa automatycznie bo `upsellEnabled` jest w `settingsPayload`.

### 2. Query na `offer_upsell_selections` + panel readonly

**Plik:** `src/components/features/offers/steps/step-preview-send.tsx`

Dodać query:
```ts
const upsellQuery = useQuery({
  queryKey: ['offer-upsell-selections', offerId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('offer_upsell_selections')
      .select('*, upsell_items(name, emoji)')
      .eq('offer_id', offerId!)
      .eq('status', 'active');
    if (error) throw error;
    return data;
  },
  enabled: !!offerId,
});
```

W lewej kolumnie podglądu, pod sekcją kalkulacji (~po linii 520, przed `terms`), dodać panel "Dosprzedaż klienta" — renderowany tylko gdy `upsellSelections.length > 0`:

```text
┌──────────────────────────────────────────┐
│ 🎁 Dosprzedaż klienta                   │
│                                          │
│ 🍰 Tort weselny × 1       450,00 zł     │
│ 🥂 Szampan powitalny × 2  120,00 zł     │
│                                          │
│ Suma dosprzedaży:          570,00 zł     │
│ Dodano: 10.04.2026                       │
└──────────────────────────────────────────┘
```

Panel readonly — bez przycisków edycji. Import `Gift` z lucide-react dla ikony nagłówka.

### Pliki modyfikowane
- `src/components/features/offers/steps/step-preview-send.tsx` — jedyny plik

### Nie ruszam
step-pricing.tsx, step-event-data.tsx, step-menu.tsx, public/offer.tsx

