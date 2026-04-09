
# Naprawa białego ekranu na publicznym linku oferty

## Co potwierdziłem
To już nie jest problem starego published bundle ani tokenu.

Na opublikowanym URL:
- zapytanie do backendu jest już poprawne
- oferta zwraca się z HTTP 200
- link działa na poziomie danych

Biały ekran powoduje teraz błąd runtime w frontendzie:
```text
TypeError: Cannot read properties of null (reading 'price')
```

## Najbardziej prawdopodobna przyczyna
W publicznej stronie oferty kod zakłada, że relacja `services` przy `offer_services` zawsze istnieje.

W kilku miejscach jest logika typu:
```ts
os.custom_price != null ? Number(os.custom_price) : os.services.price
```

Jeżeli dla choć jednej pozycji:
- `offer_services.services === null`
to aplikacja wywala się zanim cokolwiek wyrenderuje, stąd biały ekran.

To bardzo pasuje do obecnego objawu:
- zapytanie `offers + offer_services(services(*))` przechodzi
- ale w renderze lub kalkulacji trafia się `null` i cały ekran pada

## Miejsca do poprawy
### 1. `src/lib/calculations.ts`
Zabezpieczyć liczenie usług:
- nie odwoływać się wprost do `os.services.price`
- jeśli `services` jest null, traktować wpis defensywnie:
  - pominąć go w sumie albo
  - użyć `custom_price`, jeśli istnieje
  - w przeciwnym razie `0`

To najpewniej jest główne miejsce crasha.

### 2. `src/components/public/services-section.tsx`
Dodać ochronę na brak relacji `services`:
- nie czytać `s.services.type`, `s.services.name`, `s.services.description` bez sprawdzenia
- filtrować błędne rekordy albo pokazać bezpieczny fallback typu:
  - „Usługa dodatkowa”
  - cena tylko z `custom_price`, jeśli jest

### 3. `src/components/public/calculation-section.tsx`
Zabezpieczyć listę usług:
- `os.services.price`
- `os.services.name`

Tak, żeby brak relacji nie wywracał sekcji podsumowania.

### 4. `src/hooks/use-public-offer.ts`
Doprecyzować typ danych dla `offer_services`, żeby w kodzie było jawne:
- `services` może być `null`

To zmniejszy ryzyko kolejnych błędów tego typu.

## Dodatkowa weryfikacja danych
Sprawdzę w bazie, która usługa przy tej konkretnej ofercie ma zerwaną relację:
- rekord w `offer_services` istnieje
- ale powiązana `services` jest niedostępna lub nie istnieje / nie przechodzi polityk dostępu

Możliwe scenariusze:
1. usługa została usunięta z tabeli `services`
2. relacja istnieje, ale publiczny odczyt `services` jest blokowany
3. w ofercie jest stary rekord `offer_services` wskazujący na nieistniejące `service_id`

## Plan wykonania
1. Zdiagnozować dokładnie rekord usługi dla tej oferty w bazie
2. Naprawić frontend defensywnie we wszystkich publicznych sekcjach usług
3. Jeśli trzeba, poprawić dane albo politykę odczytu relacji usług
4. Przetestować ponownie ten dokładny URL aż zacznie się renderować zamiast białego ekranu

## Oczekiwany efekt
Po wdrożeniu:
- link `https://catering-konfigurator.lovable.app/offer/f6239fb2ab0f4a8681c35532a767c7c5dec984d1ce08400bbc8ddc132aa32631`
ma wyświetlać ofertę zamiast pustej białej strony
- nawet jeśli jedna usługa ma uszkodzoną relację, strona nie może się wywrócić

## Szczegóły techniczne
Potwierdzony request z published:
```text
GET /rest/v1/offers?...offer_variants!offer_variants_offer_id_fkey(...),offer_services(*,services(*))...
status=in.(ready,sent,viewed,revision,accepted,won)
→ 200
```

Potwierdzony błąd z konsoli published:
```text
TypeError: Cannot read properties of null (reading 'price')
```

Najbardziej podejrzane linie:
- `src/lib/calculations.ts`
- `src/components/public/services-section.tsx`
- `src/components/public/calculation-section.tsx`
