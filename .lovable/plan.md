

## Plan: CS-PDF-04 — Wersjonowanie + Historia Wersji

### Obecny stan
- ✅ Tabela `offer_versions` istnieje z trigger `create_offer_version_snapshot` (auto snapshot na status→sent)
- ✅ Kolumny `current_version`, `version_date` na `offers`
- ✅ PrintHeader już wyświetla `CS-XXX/v2` i "WERSJA ROBOCZA"
- ✅ Pola `coordinator_name`, `coordinator_phone` istnieją w DB ale **nie ma ich w żadnym formularzu**
- ❌ Lista ofert nie pokazuje wersji
- ❌ Brak historii wersji w panelu managera
- ❌ Brak podglądu PDF historycznej wersji
- ❌ Brak pól koordynatora w wizardzie
- ❌ Publiczna strona nie pokazuje wersji

### Zmiany

**1. Helper `getOfferVersionLabel()`** — `src/lib/offer-version.ts`
- Funkcja: `(offerNumber, currentVersion) => "CS-2026-0001/v2"` lub `"CS-2026-0001 (szkic)"` gdy v=0
- Użyta wszędzie zamiast ręcznego składania stringa

**2. Lista ofert — kolumna wersji** — `src/pages/admin/offers-list.tsx`
- Zmień wyświetlanie `offer.offer_number` na `getOfferVersionLabel(offer.offer_number, offer.current_version)`
- Oferuje `useOffers` już pobiera wymagane kolumny (current_version jest na tabeli offers)

**3. Wizard — pola koordynatora** — `src/components/features/offers/steps/step-pricing.tsx`
- Dodaj sekcję "Koordynator wydarzenia" (2 pola: `coordinator_name`, `coordinator_phone`) na końcu kroku Wycena
- Zapisywane razem z `saveMutation` (dopisz do UPDATE)
- Pobierane z `offerCalcQuery` (dodaj do select)

**4. Wizard nagłówek — wersja** — `src/components/features/offers/offer-wizard.tsx`
- W `offerTitle` użyj `getOfferVersionLabel()` zamiast ręcznego `Oferta ${state.offerNumber}`

**5. Historia wersji — nowy komponent** — `src/components/features/offers/version-history-panel.tsx`
- Timeline z listą wersji (od najnowszej)
- Każda wersja: numer, data, changed_by, change_summary
- Przycisk "Podgląd PDF" → `window.open(/admin/offers/${offerId}/print/${versionNumber})`
- Hook: `useOfferVersions(offerId)` — query z `offer_versions` ORDER BY version_number DESC

**6. Umieszczenie historii wersji** — `src/components/features/offers/steps/step-preview-send.tsx`
- Dodaj `<VersionHistoryPanel offerId={offerId} />` w sekcji podglądu (widoczny gdy `current_version > 0`)

**7. Route PDF historycznej wersji** — `src/App.tsx` + `src/pages/admin/offer-print.tsx`
- Nowy route: `/admin/offers/:id/print/:versionNumber`
- `AdminOfferPrintPage` odczytuje `versionNumber` z params
- Jeśli `versionNumber` podany → pobierz snapshot z `offer_versions` i zrekonstruuj dane oferty z JSONB
- Jeśli brak → renderuj aktualną wersję (jak dotychczas)

**8. Hook historycznej wersji** — `src/hooks/use-offer-print-data.ts`
- Dodaj wariant `useOfferPrintDataFromSnapshot(offerId, versionNumber)` — pobiera snapshot i mapuje na `PublicOffer`-kompatybilny obiekt
- Snapshot zawiera pełne dane (offer, variants, items, services, client, terms)

**9. Publiczna strona — wyświetlanie wersji** — `src/components/features/public-offer/OfferHeader.tsx`
- W sekcji hero: pokaż numer oferty z wersją, np. "Oferta CS-2026-0001/v2"

### Nowe pliki (3)
1. `src/lib/offer-version.ts` — helper
2. `src/components/features/offers/version-history-panel.tsx` — timeline UI
3. `src/hooks/use-offer-versions.ts` — hook do pobierania wersji

### Modyfikowane pliki (7)
1. `src/pages/admin/offers-list.tsx` — wersja w kolumnie numeru
2. `src/components/features/offers/steps/step-pricing.tsx` — pola koordynatora
3. `src/components/features/offers/offer-wizard.tsx` — wersja w nagłówku
4. `src/components/features/offers/steps/step-preview-send.tsx` — panel historii
5. `src/components/features/public-offer/OfferHeader.tsx` — wersja w hero
6. `src/pages/admin/offer-print.tsx` — route z versionNumber
7. `src/App.tsx` — route `/admin/offers/:id/print/:versionNumber`
8. `src/hooks/use-offer-print-data.ts` — snapshot-based data loading

### Nie ruszam
- Triggera SQL (już działa)
- Komponentów print/ (już obsługują wersję)
- Tabeli `offer_versions`
- Strony publicznej print

