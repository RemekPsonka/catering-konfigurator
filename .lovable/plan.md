
## Plan: CS-PDF-03 — Route /print + Przycisk Pobierz PDF

### Obecny stan
- ✅ Routes już istnieją: `/offer/:publicToken/print` i `/admin/offers/:id/print` (dodane w CS-PDF-02)
- ✅ Strony `OfferPrintPage` i `AdminOfferPrintPage` z auto `window.print()` już działają
- ❌ Przycisk "Pobierz PDF" w OfferHeader wywołuje `window.print()` bezpośrednio (drukuje stronę publiczną, nie dedykowany dokument)
- ❌ Brak "Drukuj ofertę" w dropdown menu listy ofert admina
- ❌ ContactSection `onPrint` też wywołuje `window.print()` bezpośrednio

### Zmiany

**1. `src/components/features/public-offer/OfferHeader.tsx`**
- Zmień `handlePrint` z `window.print()` na `window.open(\`/offer/${publicToken}/print\`, '_blank')`
- Dodaj `publicToken` do props interfejsu (lub wyciągnij z `offer.public_token`)
- Tytuł strony ustawiany w `OfferPrintPage`, nie tu

**2. `src/pages/public/offer.tsx`**
- Zmień `ContactSection onPrint` z inline `window.print()` na `window.open(\`/offer/${offer.public_token}/print\`, '_blank')`

**3. `src/pages/admin/offers-list.tsx`**
- Dodaj `DropdownMenuItem` "Drukuj ofertę" (ikona `Printer`) po "Zapisz jako szablon"
- `onClick`: `window.open(\`/admin/offers/${offer.id}/print\`, '_blank')`

**4. `src/pages/public/offer-print.tsx` + `src/pages/admin/offer-print.tsx`**
- Dodaj ustawienie `document.title` z wersją: `Oferta_{offer_number}_v{version}_Catering_Slaski`
- Print route NIE powinien być wewnątrz `PublicLayout` (bez sidebara/footera) — przeniesienie na osobny route poza layout

**5. `src/App.tsx`**
- Przenieś `/offer/:publicToken/print` POZA `<PublicLayout>` (print page nie potrzebuje layoutu)
- Przenieś `/admin/offers/:id/print` POZA `<AdminLayout>` ale WEWNĄTRZ `<AuthGuard>` (potrzebuje auth ale nie sidebara)

### Modyfikowane pliki (5)
1. `src/components/features/public-offer/OfferHeader.tsx`
2. `src/pages/public/offer.tsx`
3. `src/pages/admin/offers-list.tsx`
4. `src/pages/public/offer-print.tsx` — document.title
5. `src/App.tsx` — przenieś print routes poza layouty
