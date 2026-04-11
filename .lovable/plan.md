

## Audyt: Backend vs Frontend — pełna mapa funkcjonalności

### 🔴 BRAKUJĄCE na frontendzie (backend istnieje, frontend NIE)

| # | Funkcjonalność | Backend (tabela/dane) | Frontend | Status |
|---|---|---|---|---|
| 1 | **Galeria realizacji na ofercie publicznej** | `event_type_photos` (tabela, hook `usePublicEventPhotos`, komponent `EventGallerySection`) | Komponent istnieje ale **NIE jest importowany** w `offer.tsx`. Zdjęcia są pobierane (`eventPhotos`) ale tylko `heroPhoto` jest używane w headerze. Galeria nigdy się nie renderuje. | ❌ NIE PODŁĄCZONE |
| 2 | **Admin CRUD dla zestawów dosprzedaży** | `upsell_sets` (3 zestawy w bazie), `upsell_items` (7 itemów) | Brak strony admina do zarządzania zestawami/itemami. Dane seed istnieją, ale manager nie może dodać/edytować/usunąć zestawów ani itemów. Brak route w `App.tsx`. | ❌ BRAK |

### ✅ OBECNE i działające

| # | Funkcjonalność | Backend | Frontend | Status |
|---|---|---|---|---|
| 3 | Dania (CRUD) | `dishes`, `dish_categories`, `dish_photos` | Lista, edycja, nowe, kategorie, zdjęcia z DnD | ✅ TAK |
| 4 | Usługi (CRUD) | `services` | Lista, dialog dodawania/edycji | ✅ TAK |
| 5 | Klienci (CRUD) | `clients` | Lista, dialog | ✅ TAK |
| 6 | Leady (CRM) | `leads`, `lead_activities` | Lista, szczegóły | ✅ TAK |
| 7 | Oferty (wizard 7 kroków) | `offers`, `offer_variants`, `variant_items`, `offer_services` | Wizard z 7 krokami, lista ofert | ✅ TAK |
| 8 | Motywy ofert | `offer_themes` (12 motywów) | Krok 6 wizarda (StepTheme) | ✅ TAK |
| 9 | Szablony ofert | `offer_templates` | Zapis/użycie szablonów w wizardzie | ✅ TAK |
| 10 | Warunki oferty | `offer_terms` | Sekcja warunków na ofercie publicznej + admin settings | ✅ TAK |
| 11 | Propozycje zmian klienta | `change_proposals`, `proposal_items` | Panel zmian, diff view, akceptacja managera | ✅ TAK |
| 12 | Korekty klienta | `offer_corrections` | Sekcja komunikacji na ofercie publicznej | ✅ TAK |
| 13 | Wersjonowanie ofert | `offer_versions` | Snapshoty przed zmianami | ✅ TAK |
| 14 | Analityka ofert | `offer_events` | Tracking na stronie publicznej | ✅ TAK |
| 15 | Powiadomienia | `notifications` + RPC | Dzwonek w headerze, lista, realtime | ✅ TAK |
| 16 | Profile eventów | `event_type_profiles`, `event_type_photos` | Admin lista + edycja z DnD zdjęć, tagami, hero | ✅ TAK |
| 17 | Toggle dosprzedaży | `offers.upsell_enabled` | Switch w kroku 4 wizarda | ✅ TAK |
| 18 | Sekcja dosprzedaży (publiczna) | `upsell_sets`, `upsell_items`, `offer_upsell_selections` | `UpsellSection` na ofercie publicznej | ✅ TAK |
| 19 | Sugerowane usługi (publiczna) | `services` vs `offer_services` → `offer_upsell_selections` | `SuggestedServicesSection` na ofercie publicznej | ✅ TAK |
| 20 | Floating panel dosprzedaży | `offer_upsell_selections` | `ChangesPanel` z sekcją dodatków + zatwierdzanie | ✅ TAK |
| 21 | Badge dosprzedaży na liście | `offers.upsell_total` | Badge na liście ofert | ✅ TAK |
| 22 | Panel dosprzedaży w wizardzie | `offer_upsell_selections` | Sekcja w `step-preview-send.tsx` (readonly) | ✅ TAK |
| 23 | Dashboard | queries na `offers`, `leads` | Strona dashboard | ✅ TAK |
| 24 | System ustawień | `system_settings` | Strona settings | ✅ TAK |
| 25 | Auth (Google OAuth) | Supabase Auth | Login, guard, provider | ✅ TAK |
| 26 | Hero photo na ofercie | `event_type_photos.is_hero` → `offers` header | `OfferHeader` z hero zdjęciem | ✅ TAK |

---

### Plan naprawy — 2 zmiany

**1. Podłączenie `EventGallerySection` do `offer.tsx`**

Komponent już istnieje i jest gotowy. Wystarczy:
- Import `EventGallerySection` w `offer.tsx`
- Wstawienie między `CalculationSection` a `UpsellSection` (lub przed `TermsSection`)
- Przekazanie `eventPhotos ?? []` jako prop `photos`
- Owinięcie w `no-print` div

**2. Strona admina do zarządzania zestawami dosprzedaży** (oddzielny ticket — duży scope)

To wymaga nowej strony `/admin/settings/upsell-sets` z:
- Listą zestawów (`upsell_sets`) z CRUD
- Listą itemów w każdym zestawie (`upsell_items`) z CRUD
- Przypisywaniem typów eventów do zestawów
- Nowym hookiem `use-upsell-sets.ts`
- Nowym route w `App.tsx`

Rekomenduję: **teraz zróbmy tylko punkt 1** (podłączenie galerii — 5 minut), a punkt 2 (admin CRUD dosprzedaży) to osobny ticket CS-032.

### Pliki do modyfikacji (punkt 1)
- `src/pages/public/offer.tsx` — import + render `EventGallerySection`

### Nie ruszam
- `event-gallery-section.tsx` (gotowy komponent)
- `use-public-event-profile.ts` (hook działa)
- Żadne pliki admina

