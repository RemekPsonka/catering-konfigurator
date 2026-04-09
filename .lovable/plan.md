
# Naprawa linku publicznego: oferta ma status obsługiwany w froncie, ale blokowany przez polityki publicznego odczytu

## Co potwierdziłem
To nie jest już biały ekran z crashem frontendowym.

Na opublikowanym URL:
- strona ładuje aktualny frontend
- zapytanie do backendu wykonuje się poprawnie
- odpowiedź ma HTTP 200, ale body jest puste: `[]`
- UI pokazuje więc ekran „Nie znaleziono oferty”

To oznacza, że rekord istnieje logicznie dla aplikacji, ale **nie przechodzi publicznego odczytu**.

## Najbardziej prawdopodobna przyczyna
Frontend publiczny dopuszcza status:
- `ready`
- `sent`
- `viewed`
- `revision`
- `accepted`
- `won`

Widać to w:
- `src/hooks/use-public-offer.ts`
- `src/pages/public/offer-find.tsx`

Natomiast polityki RLS dla publicznego odczytu w migracji:
`supabase/migrations/20260409190237_0942594f-3937-432c-a2a5-4b451a59f5c7.sql`

wpuszczają tylko:
- `ready`
- `sent`
- `viewed`
- `revision`
- `accepted`

Brakuje tam `won`.

Jeśli ta konkretna oferta ma status `won`, to:
- frontend próbuje ją pobrać
- ale backend odrzuca ją przez RLS
- wynik to pusta lista i ekran „Nie znaleziono oferty”

## Zakres naprawy
### 1. Zaktualizować polityki publicznego odczytu, aby obejmowały także `won`
Plik:
- `supabase/migrations/` — nowa migracja SQL

Do rozszerzenia:
- `public_offer_read` na `offers`
- `public_variants_read` na `offer_variants`
- `public_items_read` na `variant_items`
- `public_services_read` na `offer_services`

W każdej polityce statusy publiczne powinny być spójne z frontendem i zawierać:
- `ready`
- `sent`
- `viewed`
- `revision`
- `accepted`
- `won`

### 2. Utrzymać spójność frontend ↔ backend
Kod frontendu już zakłada dostępność `won`, więc nie trzeba zmieniać logiki linku.
Trzeba tylko wyrównać backendowe zasady dostępu do tego, co frontend już wspiera.

### 3. Zweryfikować konkretny link po wdrożeniu
Po migracji sprawdzę ponownie dokładnie ten URL:
`/offer/f6239fb2ab0f4a8681c35532a767c7c5dec984d1ce08400bbc8ddc132aa32631`

Oczekiwany efekt:
- request do `offers` nie zwraca już `[]`
- strona renderuje ofertę zamiast komunikatu „Nie znaleziono oferty”

## Dodatkowa uwaga
W kodzie publicznym nadal są defensywne poprawki usług:
- `src/lib/calculations.ts` już zabezpiecza `os.services === null`

Ale `src/components/public/services-section.tsx` nadal ma bezpośrednie użycia:
- `s.services.price`
- `s.services.name`

To nie tłumaczy obecnego ekranu „Nie znaleziono oferty”, ale warto to domknąć przy kolejnej rundzie, żeby uniknąć powrotu do realnego białego ekranu przy uszkodzonej relacji usług.

## Plan wykonania
1. Dodać nową migrację SQL rozszerzającą publiczne RLS o status `won`
2. Nie zmieniać generowania linku ani tokenu — to nie jest źródło obecnego problemu
3. Przetestować ponownie opublikowany URL
4. Jeśli oferta się otworzy, opcjonalnie domknąć jeszcze ostatnie null-guardy w `services-section.tsx`

## Szczegóły techniczne
Aktualny request z published:
```text
GET /rest/v1/offers?...&public_token=eq.f6239fb2...&status=in.(ready,sent,viewed,revision,accepted,won)
→ 200
→ Response Body: []
```

Frontend oczekuje `won`:
- `src/hooks/use-public-offer.ts`:
```ts
.in('status', ['ready', 'sent', 'viewed', 'revision', 'accepted', 'won'])
```

- `src/pages/public/offer-find.tsx`:
```ts
const ACCESSIBLE_STATUSES = ['ready', 'sent', 'viewed', 'revision', 'accepted', 'won'];
```

Backendowe polityki publiczne nadal kończą się na `accepted`:
- `supabase/migrations/20260409190237_0942594f-3937-432c-a2a5-4b451a59f5c7.sql`
