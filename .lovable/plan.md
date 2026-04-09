

# Dashboard managera — `/admin/dashboard`

## Nowe pliki

### 1. `src/hooks/use-dashboard.ts`
Hook z 4 zapytaniami React Query:
- **KPI**: `offers` grouped by status → `{ draft, sent, viewed, revision, accepted }`
- **Nowe korekty**: `offer_corrections` WHERE `status = 'new'` → count
- **Wygasające**: `offers` WHERE `valid_until` between today and today+7, status IN (sent, viewed, revision), with `clients(name)`
- **Aktywność**: `notifications` WHERE `event_type` IN (offer_viewed, proposal_submitted, correction_submitted, question_submitted, offer_accepted) ORDER BY created_at DESC LIMIT 10
- **Manager name**: `get_setting('manager_name')`

### 2. `src/pages/admin/dashboard.tsx` — pełna implementacja
Zastępuje placeholder. Sekcje:

**Nagłówek**: "Dzień dobry, [manager_name]!" + dzisiejsza data (format dd MMMM yyyy, pl locale)

**Wiersz 1 — 4 kafelki KPI** (grid 2x2 mobile, 4x1 desktop, Card):
- Szkice (szary) → `/admin/offers?status=draft`
- Wysłane (niebieski, podtekst "w tym X otworzonych") → `/admin/offers?status=sent`
- Do obsłużenia (pomarańczowy, pulsujący dot jeśli >0) → `/admin/offers?status=revision`
- Zaakceptowane (zielony) → `/admin/offers?status=accepted`

**Wiersz 2 — Ostrzeżenia** (warunkowo, ukryte jeśli brak):
- Lista wygasających ofert (numer + klient + data + link)
- Lista nowych pytań/korekt (count + link do `/admin/notifications`)

**Wiersz 3 — Ostatnia aktywność** (max 10):
- Ikona per event_type, tytuł, formatDistanceToNow (pl), bold jeśli unread
- Klik → navigate(link)

**Wiersz 4 — Szybkie akcje**: 3 przyciski (Nowa oferta, Wszystkie oferty, Klienci)

## Modyfikowane pliki

### 3. `src/components/layout/admin-layout.tsx`
- Import `LayoutDashboard` z lucide-react
- Dodać jako pierwszy element NAV_ITEMS: `{ title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard }`

### 4. `src/App.tsx`
- Import `DashboardPage`
- Zmienić `<Route index>` redirect z `/admin/offers` na `/admin/dashboard`
- Dodać: `<Route path="dashboard" element={<DashboardPage />} />`

## Brak zmian w bazie danych
Wszystkie dane z istniejących tabel (offers, offer_corrections, notifications, system_settings).

