

# Naprawa: liczba uczestników nie przelicza + brak przycisku akceptacji

## Diagnoza

### Problem 1: Liczba uczestników nie przelicza
Oferta ma `price_display_mode = 'PER_PERSON_ONLY'`. W tym trybie:
- Wyświetlane są tylko ceny per-person (`vt.perPerson`) — te NIE zależą od liczby osób
- Sekcja z grand total jest UKRYTA (linia 282: `price_display_mode !== 'PER_PERSON_ONLY'` → nie renderuje)
- Efekt: klient klika +/-, liczba się zmienia, ale nic się nie przelicza wizualnie

**Fix**: W trybie `PER_PERSON_ONLY` po wariantach per-person dodać sekcję z łączną kwotą (perPerson × peopleCount) dla najdroższego wariantu, żeby zmiana liczby osób miała widoczny efekt.

### Problem 2: Brak przycisku akceptacji
Oferta ma `status = 'ready'`. `AcceptanceSection` sprawdza:
```typescript
const isVisible = ['sent', 'viewed', 'revision'].includes(offer.status);
```
`ready` NIE jest na liście → sekcja się nie renderuje.

**Fix**: Dodać `'ready'` do listy statusów w `AcceptanceSection`.

## Plan zmian

### 1. `src/components/public/acceptance-section.tsx` linia 24
```typescript
// PRZED:
const isVisible = ['sent', 'viewed', 'revision'].includes(offer.status)

// PO:
const isVisible = ['ready', 'sent', 'viewed', 'revision'].includes(offer.status)
```

### 2. `src/components/public/calculation-section.tsx`
W trybie `PER_PERSON_ONLY` — po liście wariantów per-person dodać podsumowanie z łączną kwotą (grand total), żeby zmiana liczby osób miała widoczny efekt. Dodać sekcję analogiczną do grand total z linii 281-305, ale pokazywaną też dla `PER_PERSON_ONLY`.

Zmiana: usunąć warunek `price_display_mode !== 'PER_PERSON_ONLY'` z linii 282, żeby grand total zawsze się wyświetlał (oprócz HIDDEN, które ma osobny return).

Alternatywnie: zmienić warunek na `price_display_mode !== 'HIDDEN'` — bo HIDDEN już ma early return wyżej, więc można po prostu zawsze renderować grand total.

## Brak zmian w bazie danych

