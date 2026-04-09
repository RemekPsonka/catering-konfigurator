

# Audyt Spójności — Faza 0+1: Wyniki

## BAZA DANYCH

| # | Punkt | Status | Uwagi |
|---|-------|--------|-------|
| 1 | 20 tabel | **FAIL** | 19 tabel w `public` schema (brak tabeli `users` — OK, bo to `auth.users` zarządzane przez Supabase). Ale 19 z 19 wymaganych tabel publicznych istnieje. **OK** po korekcie — 19 tabel + auth.users = komplet. |
| 2 | 17 typów ENUM | **OK** | Wszystkie 17: activity_type, change_type, client_type, correction_status, delivery_type, event_type, lead_source, lead_status, lost_reason, offer_status, price_display_mode, price_type, pricing_mode, proposal_item_status, proposal_status, service_type, unit_type |
| 3 | Seed data | **OK** | 14 kategorii, 12 motywów, 5 warunków, 9 usług — wszystkie potwierdzone |
| 4 | Triggery | **FAIL** | Brakuje `updated_at` triggera na tabeli `offer_templates` — **KOREKTA**: trigger `tr_offer_templates_updated_at` **istnieje**. Triggery: offer_number, public_token, valid_until, default_theme, sync_offer_client + updated_at na dishes, leads, offers, offer_terms, offer_templates = **10 triggerów**. **OK** |
| 5 | RLS | **OK** | Wszystkie tabele mają RLS enabled. Polityki auth (zalogowani) na wszystkich. Publiczne SELECT na: dishes, dish_photos, offer_themes, offer_terms, offers, offer_variants, variant_items, offer_services. Publiczne INSERT na: change_proposals, proposal_items, offer_corrections, offer_events. |
| 6 | CHECK discount XOR | **OK** | `chk_discount_exclusive: NOT ((discount_percent > 0) AND (discount_value > 0))` |
| 7 | Indeksy na FK | **OK** | 26 indeksów na FK i polach filtrowanych |

## FRONTEND

| # | Punkt | Status | Uwagi |
|---|-------|--------|-------|
| 8 | Routing 14+ ścieżek | **OK** | 14 ścieżek admin + /login + /offer/:publicToken + / redirect + catch-all |
| 9 | Auth guard | **OK** | `/admin/*` chronione przez `AuthGuard` |
| 10 | /offer/:publicToken | **OK** | Publiczna, w `PublicLayout`, bez auth |
| 11 | AdminLayout | **OK** | Sidebar z 6 linkami + topbar z email i wylogowaniem |
| 12 | Lista dań | **OK** | Filtry (kategoria, status, szukaj, diet_tags), paginacja 20/stronę, miniaturki |
| 13 | Formularz dania | **OK** | 5+ sekcji, Zod walidacja, zapis do Supabase |
| 14 | Upload zdjęć | **OK** | drag&drop, max 5, JPEG/PNG/WebP, 5MB, Supabase Storage bucket `dish-photos` |
| 15 | Zamienniki | **OK** | 3 typy (SWAP/VARIANT/SPLIT), zapis jako JSONB `modifiable_items`, podgląd kliencki |
| 16 | CRUD usług | **OK** | Tabela + modal, tabs filtrujące (Wszystkie/Obsługa/Sprzęt/Logistyka), toggle aktywności |
| 17 | CRUD klientów | **OK** | Tabela + modal, wyszukiwarka debounced, count ofert |
| 18 | Konta | **FAIL** | Edge function `list-users` używa `anonClient.auth.getClaims()` — ta metoda **nie istnieje** w Supabase JS SDK v2. Function prawdopodobnie zwraca 500. |

## KRYTYCZNE

| # | Punkt | Status | Uwagi |
|---|-------|--------|-------|
| 19 | Dodanie dania z ceną, kategorią, zdjęciem | **OK** | Formularz → create → redirect do edit → upload zdjęcia |
| 20 | Dodanie klienta z nazwą i emailem | **OK** | Dialog z walidacją Zod |
| 21 | Zamienniki JSONB | **OK** | `modifiable_items` w schema, parsowanie w formularzu, zapis w `buildPayload` |
| 22 | Seed data widoczne | **OK** | Potwierdzone queryami SQL |

---

## ZNALEZIONE PROBLEMY DO NAPRAWY

### FAIL 1: Edge function `list-users` — `getClaims()` nie istnieje

**Problem**: Linia 25 w `supabase/functions/list-users/index.ts` wywołuje `anonClient.auth.getClaims()` — ta metoda nie istnieje w SDK `@supabase/supabase-js@2.49.1`. Function zwraca 500 error.

**Naprawa**: Zamienić na `anonClient.auth.getUser()` — potwierdzi tożsamość callera:
```typescript
const { data: { user }, error: authError } = await anonClient.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
}
```

### Pliki do zmiany

1. **`supabase/functions/list-users/index.ts`** — zamiana `getClaims()` na `getUser()`, usunięcie nieużywanego `claimsData`, re-deploy edge function.

### Brak dalszych FAIL-i

Pozostałe 21/22 punktów audytu = **OK**. Po naprawie edge function projekt jest gotowy do Fazy 2.

