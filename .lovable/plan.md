

## Plan: Sekcja "Możesz jeszcze dodać" [CS-029]

### Nowy plik

**`src/components/public/suggested-services-section.tsx`**

Props: `offerId`, `offerServices` (offer_services array from offer), `peopleCount`, `upsellEnabled`, `actionsDisabled`

**Dane:**
- Query 1: `services` WHERE `is_active=true` — pobierz cały katalog
- Query 2: `offer_upsell_selections` WHERE `offer_id` AND `status='active'` — już dodane przez klienta (reuse query key `['public-upsell-selections', offerId]`)
- Filtrowanie w `useMemo`: usługi z katalogu MINUS te w `offerServices` (po `service_id`) MINUS te już dodane do upsell selections
- Mutation: insert do `offer_upsell_selections` z `unit_price`, `quantity`, `total_price`

**Logika ceny (price_type z services):**
- `PER_HOUR` → "45 zł/h", quantity = 1
- `PER_EVENT` → "200 zł za event", quantity = 1
- `PER_PIECE` → "80 zł/szt", quantity = 1
- `PER_PERSON` → "15 zł/os (110 os = 1 650 zł)", quantity = peopleCount

**Ikony wg typu:**
- `STAFF` → 👨‍🍳
- `EQUIPMENT` → 🏗️
- `LOGISTICS` → 🚚

**UI:** Identyczny styl co `upsell-section.tsx` — ten sam grid 3-kolumnowy, te same karty z emoji/ikoną, nazwa, opis, cena, przycisk `[+ Dodaj]`. Po dodaniu karta znika z sekcji (bo jest już w selections). Nagłówek: "💡 Możesz jeszcze dodać". Render `null` jeśli `!upsellEnabled` lub brak sugestii. Animacje: `fadeInUp` + `staggerContainer`.

### Modyfikacja `src/pages/public/offer.tsx`

Import `SuggestedServicesSection` i wstawienie PO `UpsellSection`, wewnątrz tego samego `no-print` div:

```
<SuggestedServicesSection
  offerId={offer.id}
  offerServices={offer.offer_services}
  peopleCount={offer.people_count ?? 1}
  upsellEnabled={offer.upsell_enabled ?? true}
  actionsDisabled={actionsDisabled}
/>
```

### Nie ruszam
upsell-section.tsx, services-logistics-section.tsx, step-pricing.tsx

