

# System powiadomień in-app + browser push

## Zakres
1. Komponent NotificationBell w headerze admina (dzwonek + badge + dropdown)
2. Hook `useNotifications` (polling + Realtime subscription)
3. Strona `/admin/notifications` (pełna skrzynka)
4. Browser push notifications (Notification API)
5. Baner z prośbą o włączenie push
6. Wstawianie powiadomień z frontendu klienta (fire-and-forget)

## Migracja bazy danych
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;` — potrzebne do Realtime

## Nowe pliki

### `src/hooks/use-notifications.ts`
- `useUnreadCount()` — polling co 30s via `supabase.rpc('get_unread_notification_count')` + Realtime subscription na INSERT do tabeli `notifications` (increment count)
- `useNotifications(limit)` — query ostatnich N powiadomień
- `useAllNotifications(page, filter)` — paginowana lista dla strony /admin/notifications
- `useMarkRead()` — mutation wywołująca `mark_notification_read`
- `useMarkAllRead()` — mutation wywołująca `mark_all_notifications_read`

### `src/components/features/notifications/notification-bell.tsx`
- Ikona Bell z pulsującym badge (czerwone kółko z liczbą)
- Popover z shadcn/ui:
  - Nagłówek: "Powiadomienia" + "Oznacz wszystkie"
  - Lista 10 ostatnich (ikona per event_type, bold jeśli nieprzeczytane, bg-blue-50, czas via `formatDistanceToNow`)
  - Klik → `mark_notification_read(id)` + `navigate(link)`
  - Footer: "Zobacz wszystkie →" → `/admin/notifications`
- Browser push: przy nowym INSERT (z Realtime) → `new Notification(title, { body, icon, tag })`

### `src/components/features/notifications/push-permission-banner.tsx`
- Baner na górze admina: "Włącz powiadomienia aby nie przegapić aktywności klientów"
- "Włącz" → `Notification.requestPermission()`
- "Nie teraz" → `localStorage.setItem('push-dismissed', Date.now())`, ukryj na 7 dni
- Pokazuj tylko jeśli `Notification.permission === 'default'` i nie dismissed

### `src/pages/admin/notifications-list.tsx`
- Pełna strona z paginacją (20/stronę)
- Filtry: Wszystkie | Nieprzeczytane | per event_type
- Bulk "Oznacz jako przeczytane"

## Pliki do zmodyfikowania

### `src/components/layout/admin-layout.tsx`
- Import + render `NotificationBell` w headerze (obok emaila)
- Import + render `PushPermissionBanner` pod DEV_MODE banerem
- Dodać "Powiadomienia" do `NAV_ITEMS` z ikoną `Bell`

### `src/App.tsx`
- Dodać route `<Route path="notifications" element={<NotificationsListPage />} />`

### `src/hooks/use-public-offer.ts`
- W `useMarkOfferViewed` → po sukcesie: fire-and-forget `supabase.rpc('insert_notification', { p_offer_id, p_event_type: 'offer_viewed', p_title, p_body, p_link })`
- W `useSubmitProposal` → onSuccess: fire-and-forget notification
- W `useSubmitCorrection` → onSuccess: fire-and-forget notification
- W `useAcceptOffer` → onSuccess: fire-and-forget notification

### `src/components/public/acceptance-section.tsx`
- Po akceptacji: fire-and-forget notification z nazwą wariantu i kwotą

### `src/components/public/changes-panel.tsx`
- Po wysłaniu propozycji: fire-and-forget notification z liczbą pozycji

### `src/components/public/corrections-section.tsx`
- Po wysłaniu korekty: fire-and-forget notification z treścią wiadomości

## Szczegóły techniczne

### Realtime
```typescript
supabase.channel('notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
    // increment badge count
    // show browser push if permission granted
  })
  .subscribe()
```

### Fire-and-forget pattern (klient)
```typescript
supabase.rpc('insert_notification', { ... }).then(() => {}).catch(() => {});
```
Błąd nigdy nie blokuje akcji klienta. Deduplikacja 5 min jest wbudowana w RPC.

### Ikony per event_type
- `offer_viewed` → Eye
- `proposal_submitted` → RefreshCw
- `correction_submitted` → Pencil
- `question_submitted` → HelpCircle
- `offer_accepted` → CheckCircle

