

## Plan: Badge dosprzedaży na liście ofert [CS-031]

### 1. Badge pod wartością oferty w `src/pages/admin/offers-list.tsx`

W komórce "Wartość" (linie 163-165), pod kwotą `formatCurrency(offer.total_value)`, dodaj warunkowo:

```
{offer.upsell_total > 0 && (
  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-[10px] mt-0.5">
    +{formatCurrency(offer.upsell_total)} dosprzedaż
  </Badge>
)}
```

Import `Badge` z `@/components/ui/badge`. Dane `upsell_total` są już w tabeli `offers` i pobierane przez `useOffers` hook (select `*`).

### 2. Powiadomienie — już zaimplementowane

Notyfikacja `upsell_confirmed` jest już wysyłana w `changes-panel.tsx` (linia 115-120) przez `fireNotification`. System powiadomień (`notifications` table + Realtime + `NotificationBell`) automatycznie pokaże to managerowi. Nie wymaga zmian.

### 3. Panel w step-preview-send.tsx — już zaimplementowane

Panel "Dosprzedaż klienta" z CS-027 używa `useQuery` z kluczem opartym na `offerId` — automatycznie pokaże aktualne dane po odświeżeniu strony. Nie wymaga zmian.

### Pliki modyfikowane
- `src/pages/admin/offers-list.tsx` — jedyny plik (dodanie Badge)

### Nie ruszam
public/offer.tsx, upsell-section.tsx, changes-panel.tsx, step-preview-send.tsx

