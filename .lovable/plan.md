

# Stałe linki publiczne — uzupełnienia i edge-case'y

## Stan obecny po ostatniej zmianie
- `use-offer-wizard.ts`: przy UPDATE pomija `status` — OK
- `use-public-offer.ts`: brak filtra po statusie — OK
- RLS `public_offer_read`: `public_token IS NOT NULL` — OK
- `offer.tsx`: draft/lost mają osobne ekrany — ale brak pełnej obsługi wg wymagań
- `step-preview.tsx`: przycisk "Zapisz szkic" nadal ustawia `status: 'draft'` — BUG, to resetuje status wysłanej oferty
- `use-offers.ts` (duplikacja): ustawia `status: 'draft'` — OK, bo duplikat to nowa oferta
- `find_offer_by_email_and_number` RPC: nie filtruje po statusie — OK, ale trzeba sprawdzić czy zwraca oferty bez tokena
- `acceptance-section.tsx`: ukrywa się dla `ready` — powinno pokazywać akceptację tylko dla `sent/viewed/revision`
- Token generuje się automatycznie przez trigger `generate_public_token` na INSERT — trzeba to zmienić

## Zmiany do wdrożenia

### 1. Trigger bazy danych — token NIE przy INSERT
Obecnie trigger `generate_public_token` generuje token przy każdym INSERT. Wymaganie: token powstaje dopiero przy pierwszym wysłaniu.
- Migracja: usuń trigger z INSERT, dodaj trigger na UPDATE, który generuje token gdy `status` zmienia się na `sent` i `public_token IS NULL`
- Alternatywa: zostaw trigger INSERT ale ustaw `public_token = NULL` jawnie, a token generuj w logice wysyłania — prostsze: zmień trigger na BEFORE UPDATE

### 2. `step-preview.tsx` — "Zapisz szkic" NIE resetuje statusu
- Linia 141: `statusMutation.mutate({ status: 'draft' })` — to jest jawny reset statusu
- Zmiana: "Zapisz szkic" nie powinno zmieniać statusu jeśli oferta była już wysłana
- Logika: jeśli `offer.status` jest w `['sent','viewed','revision','accepted','won']`, przycisk "Zapisz szkic" po prostu nawiguje bez zmiany statusu
- "Zapisz i pokaż link" oraz "Gotowa" — ustawiają `ready`, OK
- "Generuj email" — ustawia `ready` + wysyła, zmienić na `sent`

### 3. `offer.tsx` — pełna obsługa statusów wg tabeli
Zmienić logikę ekranów statusowych:
- `draft`: "Oferta jest w trakcie aktualizacji. Wróć później." + telefon + email. BEZ dań/cen/wariantów
- `ready`: pełna oferta, ale BEZ akceptacji (oferta jeszcze nie wysłana)
- `sent/viewed`: pełna oferta + pełne akcje (zamiany, pytania, akceptacja)
- `revision`: pełna oferta + poprawki widoczne + pytania
- `accepted`: pełna oferta + baner "Oferta zaakceptowana [data]", bez akcji
- `won`: pełna oferta + baner "Zamówienie potwierdzone", bez akcji
- `lost`: "Oferta zamknięta. Skontaktuj się z nami." + dane kontaktowe. BEZ dań
- Wygasła (`valid_until < now()`): pełna oferta widoczna + baner na górze "Termin ważności minął [data]. Skontaktuj się w celu przedłużenia." Akcje zablokowane

Obecnie `isExpired` blokuje całą stronę. Zmienić: pokazać pełną ofertę + baner + zablokować akcje.

### 4. `acceptance-section.tsx` — dostosować widoczność
- Obecnie: `['ready', 'sent', 'viewed', 'revision']`
- Zmienić na: `['sent', 'viewed', 'revision']` — `ready` nie pokazuje akceptacji
- Dodać warunek: `!isExpired` (przekazać jako prop)

### 5. `changes-panel.tsx` / `communication-section.tsx` — blokada dla expired/accepted/won
- Dodać prop `actionsDisabled` do tych komponentów
- Gdy `actionsDisabled = true`: ukryj formularze, pokaż tylko historię

### 6. `find_offer_by_email_and_number` RPC — filtruj po tokenie
- Obecna funkcja nie sprawdza `public_token IS NOT NULL` — może zwrócić ofertę bez tokena
- Migracja: dodać `AND o.public_token IS NOT NULL` do WHERE

### 7. Admin UI — ukryj "Kopiuj link" gdy brak tokena
- `offers-list.tsx` linia 201: `{offer.public_token && (...)}` — już OK
- `step-preview.tsx`: przycisk "Zapisz i pokaż link" powinien być widoczny zawsze (generuje token przy ustawieniu ready/sent)

## Pliki do zmiany
- Nowa migracja SQL: zmiana triggera `generate_public_token`, update RPC `find_offer_by_email_and_number`
- `src/components/features/offers/steps/step-preview.tsx` — nie resetuj statusu przy "Zapisz szkic"
- `src/pages/public/offer.tsx` — pełna obsługa statusów wg tabeli, expired jako baner zamiast blokady
- `src/components/public/acceptance-section.tsx` — usunąć `ready` z widocznych statusów, dodać prop `isExpired`
- `src/components/public/changes-panel.tsx` — dodać prop `actionsDisabled`
- `src/components/public/communication-section.tsx` — dodać prop `actionsDisabled`

## Efekt końcowy
- Nowa oferta nie dostaje tokena dopóki nie zostanie wysłana
- Edycja wysłanej oferty nie resetuje statusu
- Link zawsze działa, ale klient widzi odpowiedni ekran zależnie od statusu
- Expired oferty pokazują pełną treść + baner ostrzegawczy
- Akcje klienta zablokowane w stanach: draft, accepted, won, lost, expired

