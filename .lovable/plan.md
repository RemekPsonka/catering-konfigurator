

## Plan: Sekcja dosprzedaży na publicznej ofercie [CS-028]

### Nowe pliki

**1. `src/components/public/upsell-section.tsx`**

Props: `offerId: string`, `eventType: string`, `peopleCount: number`, `upsellEnabled: boolean`, `actionsDisabled: boolean`

**Dane:**
- Query 1: `upsell_sets` WHERE `is_active=true` AND `event_types @> ARRAY[eventType]`, z joinem `upsell_items(*)` WHERE `is_active=true`, ordered by `sort_order`
- Query 2: `offer_upsell_selections` WHERE `offer_id` AND `status='active'` — do oznaczenia już dodanych
- Mutations: insert do `offer_upsell_selections`, update `status='removed'` przy usuwaniu

**Logika ceny:**
- FIXED: `quantity = default_quantity`, `unit_price = price`, `total_price = price * default_quantity`
- PER_PERSON: `quantity = peopleCount`, `unit_price = price`, `total_price = price * peopleCount`

**UI:**
- Render `null` jeśli `!upsellEnabled` lub brak zestawów/pozycji
- Nagłówek: "✨ Dopasowane do Twojego wydarzenia"
- Grid 3-kolumnowy (desktop), 1 (mobile)
- Karta: emoji (48px) → nazwa → opis (max 2 linie) → cena (FIXED: "400 zł", PER_PERSON: "15 zł/os (110 os = 1 650 zł)") → przycisk
- Stan domyślny: `[+ Dodaj]` (primary, small)
- Stan dodany: zielony border, `[✓ Dodano]` (outline) + mały `[Usuń]` (ghost, destructive)
- Jeśli `actionsDisabled` — przyciski nieaktywne
- Stylowanie: CSS custom properties z motywu (`--theme-primary`, `--theme-bg`, etc.)
- Animacje: `fadeInUp` + `staggerContainer` (jak inne sekcje)

**2. Modyfikacja `src/pages/public/offer.tsx`**

- Import `UpsellSection`
- Wstawienie między `<CalculationSection>` a `<TermsSection>`:
```
<div className="no-print">
  <UpsellSection
    offerId={offer.id}
    eventType={offer.event_type}
    peopleCount={offer.people_count ?? 1}
    upsellEnabled={offer.upsell_enabled ?? true}
    actionsDisabled={actionsDisabled}
  />
</div>
```

### Nie ruszam
hero, menu, services, calculation, changes-panel.tsx, step-preview-send.tsx

