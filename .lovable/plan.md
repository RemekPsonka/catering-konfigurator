

## Plan: Countdown Timer + Urgency [CS-032]

### Nowy plik: `src/components/public/countdown-timer.tsx`

**Props:** `validUntil: string | null`, `isExpired: boolean`

**Logika:**
- `useEffect` z `setInterval` co 60s, oblicza `days`, `hours`, `minutes` do `validUntil`
- Jeśli `validUntil` jest null lub oferta wygasła → return `null`
- 3 stany wizualne na podstawie pozostałych dni:
  - **>7 dni (ZIELONY):** statyczny tekst "Oferta ważna do DD.MM.YYYY", tło `bg-green-50/80`, ikona `Clock`
  - **3–7 dni (ŻÓŁTY):** "Oferta ważna jeszcze X dni", tło `bg-amber-50/80`, ikona `Clock` + badge "Ostatnie dni!"
  - **<3 dni (CZERWONY):** "Zostało już tylko Xd Xh!", tło `bg-red-50/80`, pulsująca animacja (`animate-pulse` na ikonie), badge "Czas ucieka!"
- framer-motion `fadeInUp` na wejściu
- Kolory akcentów przez CSS custom properties z theme (`var(--theme-primary)`) jako fallback
- `no-print` — ukryty przy drukowaniu

### Modyfikacja: `src/pages/public/offer.tsx`

- Import `CountdownTimer`
- Wstawienie TUŻ POD `<OfferHeader>` (linia 149), przed onboarding overlay:

```tsx
{offer.valid_until && !isExpired && (
  <div className="no-print">
    <CountdownTimer validUntil={offer.valid_until} isExpired={isExpired} />
  </div>
)}
```

### Nie ruszam
OfferHeader.tsx, changes-panel.tsx, usePublicOffer, żadne sekcje oferty

