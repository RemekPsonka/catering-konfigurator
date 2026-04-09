

# Dezaktywacja "Wyślij do klienta" + przycisk "Wygeneruj treść emaila"

## Zakres
1. Dezaktywacja przycisku "Wyślij do klienta" (disabled + tooltip z info)
2. Nowy przycisk "Wygeneruj treść emaila" — generuje gotowy tekst emaila z podsumowaniem oferty, linkiem publicznym i onboardingiem (informacja że klient może dopasować ofertę po kliknięciu)
3. Dialog z wygenerowanym tekstem do skopiowania

## Plik do zmodyfikowania: `src/components/features/offers/steps/step-preview.tsx`

### 1. Nowy stan
- `emailDialogOpen: boolean` — dialog z treścią emaila
- `emailText: string` — wygenerowana treść

### 2. Funkcja `handleGenerateEmail`
- Zapisz ofertę jako `ready` (jak "Zapisz i pokaż link")
- Zbuduj treść emaila z danymi oferty:
  - Powitanie klienta
  - Numer oferty, typ wydarzenia, data, liczba osób
  - Podsumowanie wariantów (nazwy + liczba dań)
  - Usługi dodatkowe
  - Łączna kwota
  - Link publiczny do oferty
  - **Onboarding**: informacja że po kliknięciu w link klient może przeglądać menu, proponować zmiany w daniach, zaakceptować ofertę
  - Dane kontaktowe
- Otwórz dialog z treścią

### 3. Nowy szablon w `src/lib/email-templates.ts`
- `OFFER_EMAIL_RICH_TEMPLATE` — rozbudowany szablon z placeholderami na podsumowanie oferty i sekcję onboardingową
- `buildRichOfferEmail(params)` — funkcja budująca treść

### 4. Dialog z treścią emaila
- Textarea (read-only) z wygenerowaną treścią
- Przycisk "Kopiuj do schowka"
- Przycisk "Otwórz w kliencie email" → `mailto:{clientEmail}?subject=...&body=...`

### 5. Przycisk "Wyślij do klienta"
- `disabled` na stałe
- Tooltip: "Funkcja w przygotowaniu"

### 6. Nowy przycisk w akcjach
- Ikona: `Mail` z lucide-react
- Label: "Wygeneruj treść emaila"
- Pozycja: przed disabled "Wyślij do klienta"

## Treść emaila (szablon)
```
Szanowna/y {clientName},

Przygotowaliśmy dla Państwa ofertę cateringową nr {offerNumber}.

📋 Szczegóły:
- Typ wydarzenia: {eventType}
- Data: {eventDate}
- Liczba osób: {peopleCount}

🍽️ Menu:
{variantsSummary}

{servicesSummary}

💰 Wartość oferty: {totalValue}

👉 Kliknij aby zobaczyć pełną ofertę:
{offerLink}

✨ Po otwarciu linku możesz:
- Przeglądać szczegółowe menu z opisami dań
- Proponować zmiany — zamienić dania na alternatywne
- Zaakceptować ofertę online jednym kliknięciem

Jeśli link nie działa, wejdź na {findLink} i wpisz swój email oraz numer oferty.

Oferta ważna do: {validUntil}

Pozdrawiamy,
Catering Śląski
tel. +48 123 456 789 | zamowienia@cateringslaski.pl
```

## Brak zmian w bazie danych

