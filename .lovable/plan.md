
# Stały, niegasnący link publiczny oferty

## Co teraz psuje link
Znalazłem dwa źródła problemu:

1. `use-offer-wizard.ts` przy zapisie istniejącej oferty ustawia zawsze `status: 'draft'`
   - więc oferta, która działała wczoraj, po wejściu do konfiguratora i auto-zapisie może znów stać się szkicem
2. Dostęp publiczny jest dziś uzależniony od statusu:
   - frontend `usePublicOffer` filtruje tylko `ready/sent/viewed/revision/accepted/won`
   - RLS `public_offer_read` też blokuje `draft` i `lost`
   - `/offer/find` i adminowe akcje “kopiuj link” też mają własne listy statusów

Jeśli wymaganie brzmi: “jak raz wygenerujemy link, to zawsze ma działać”, to obecna architektura musi zostać zmieniona całościowo.

## Proponowana logika docelowa
Po wygenerowaniu `public_token`:
- link pozostaje ten sam na zawsze
- oferta pod tym linkiem zawsze się otwiera
- status wpływa tylko na to, co klient może zrobić, a nie czy w ogóle zobaczy stronę

Czyli:
- odczyt publiczny: dozwolony dla każdej oferty z `public_token`
- akcje publiczne nadal kontrolowane osobno:
  - `viewed`
  - `revision`
  - `accepted`
- dla `lost` / po terminie / szkicu:
  - strona się otwiera
  - ale pokazuje odpowiedni stan informacyjny i blokuje akcje, jeśli trzeba

## Zakres zmian

### 1. Backend / RLS
Przygotuję migrację, która:
- zmieni `public_offer_read` na regułę opartą tylko o `public_token IS NOT NULL`
- zaktualizuje polityki odczytu zależnych tabel publicznych, żeby nie były blokowane przez status oferty:
  - `clients`
  - `offer_variants`
  - `variant_items`
  - `offer_services`
- zostawi kontrolę publicznych update’ów osobno, żeby klient nadal mógł zmieniać tylko dozwolone pola/statusy

To jest kluczowe, bo samo zdjęcie filtra w React nie wystarczy.

### 2. Frontend publiczny
Zmienię `src/hooks/use-public-offer.ts`:
- usunę `.in('status', ...)`
- odczyt będzie po samym `public_token`

Zmienię `src/pages/public/offer.tsx`:
- widok ma działać także dla szkicu i oferty zamkniętej
- statusy będą sterować sekcjami akcji, nie samym dostępem
- dodam czytelne stany:
  - szkic / oferta jeszcze przygotowywana
  - wygasła
  - zamknięta / przegrana
  - zaakceptowana

### 3. Naprawa resetowania statusu przy edycji
Zmienię `src/hooks/use-offer-wizard.ts`, bo to jest główna przyczyna “link działał, a dziś nie działa”:
- przy update istniejącej oferty nie będziemy bezwarunkowo ustawiać `status: 'draft'`
- status ma zostać zachowany
- tylko nowa oferta startuje jako `draft`

Dodatkowo sprawdzę, czy w podglądzie / zapisie końcowym nie ma innych miejsc, które cofają status niepotrzebnie.

### 4. Spójność w innych miejscach UI
Zmienię też miejsca, które dziś ukrywają link zależnie od statusu:
- `src/pages/public/offer-find.tsx`
- `src/pages/admin/offers-list.tsx`

Efekt:
- jeśli oferta ma `public_token`, da się ją otworzyć i skopiować link
- “Znajdź ofertę” nie będzie sztucznie blokować dostępu tylko dlatego, że status to `draft` albo inny nieobsłużony wariant

## Ważna decyzja produktowa
To oznacza realnie:
- klient zobaczy ofertę także wtedy, gdy manager zedytuje ją ponownie i wróci do szkicu
- jeśli nie chcesz pokazywać pełnego szkicu, mogę zrobić wariant bezpieczny:
  - link zawsze działa
  - ale dla `draft` pokazujemy stronę “Oferta jest aktualizowana, wróć później”, zamiast pełnej treści

To moim zdaniem jest najlepszy kompromis:
- link nigdy nie umiera
- klient nie dostaje “nie znaleziono”
- a jednocześnie nie ogląda przypadkowo roboczej wersji

## Pliki do zmiany
- `src/hooks/use-public-offer.ts`
- `src/pages/public/offer.tsx`
- `src/pages/public/offer-find.tsx`
- `src/hooks/use-offer-wizard.ts`
- `src/pages/admin/offers-list.tsx`
- nowa migracja SQL zmieniająca polityki RLS dla publicznego odczytu ofert i powiązanych danych

## Efekt końcowy
Po wdrożeniu:
- raz wygenerowany link będzie stały
- oferta pod tym linkiem zawsze się otworzy
- edycja w konfiguratorze nie zabije linku
- status będzie kontrolował tylko dostępne akcje i komunikaty, a nie samą dostępność URL
