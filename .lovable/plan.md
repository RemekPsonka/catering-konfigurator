

# Pełny lifecycle oferty — blokada, Won/Lost, odblokowanie

## Pliki do zmiany

### 1. `src/components/features/offers/offer-wizard.tsx`
- Detect `isLocked` from offer status (`accepted` or `won`) using `offerQuery.data`
- When locked: show banner with Lock icon + unlock button, force step 7 (preview only), hide stepper + navigation buttons, hide "Zapisz szkic" button
- `handleUnlock`: update status to `revision` via supabase, invalidate queries
- Title changes: show "(zaakceptowana)" or "(wygrana)" instead of "(szkic)"

### 2. `src/components/features/offers/steps/step-preview.tsx`
- Add `isLocked` check from `offer.status`
- When locked, replace action buttons (save draft, ready, email, send) with:
  - "Oznacz jako wygrana" (Trophy icon, emerald) — only for `accepted`
  - "Oznacz jako przegrana" (XCircle, destructive) — only for `accepted`
  - Won badge — only for `won`
  - "Odblokuj do edycji" (Unlock icon)
  - "Podgląd klienta" (Eye icon)
- `handleStatusChange(newStatus)`: confirm dialog → supabase update → invalidate → toast
- Keep template save and client preview available for locked offers

### 3. `src/hooks/use-dashboard.ts`
- Add `won` to `KpiCounts` interface and query filter
- Initialize `won: 0` in counts

### 4. `src/pages/admin/dashboard.tsx`
- Add "Wygrane" KPI card with Trophy icon, emerald color scheme
- Import Trophy from lucide-react

### 5. `src/pages/admin/offers-list.tsx`
- Verify `won` and `lost` tabs exist in status filter (they should via `OFFER_STATUS_LABELS`)
- Add Lock icon next to offer number for `accepted`/`won` status rows

## Nie zmieniam
- Schema — `won`/`lost` statuses already exist in enum
- No `won_at`/`lost_at` columns — just update `status`
- RLS policies — existing `auth_full_access` covers admin updates

## Flow
draft → ready → sent → viewed → accepted → **LOCKED** → won/lost (or unlock → revision)

