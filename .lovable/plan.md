

# Dodanie "Zapisz i pokaż link" w kroku Podgląd

## Zakres
Nowy przycisk "Zapisz i pokaż link" w akcjach kroku 7 — ustawia status na `ready`, wyświetla dialog z linkiem publicznym do skopiowania. Bez wysyłki emaila.

## Plik do zmodyfikowania: `src/components/features/offers/steps/step-preview.tsx`

### 1. Nowy stan
- `linkDialogOpen` + `publicLink` — do wyświetlenia dialogu z linkiem

### 2. Nowa funkcja `handleSaveAndShowLink`
- Wywołuje `statusMutation.mutate({ status: 'ready' })`
- W `onSuccess`: buduje URL `${window.location.origin}/offer/${offer?.public_token}`, ustawia `publicLink` i otwiera dialog
- Nie nawiguje do listy ofert — zostaje na podglądzie

### 3. Dialog z linkiem
- Prosty `Dialog` z:
  - Tekst: "Oferta gotowa! Skopiuj link i wyślij klientowi:"
  - Input readonly z pełnym URL
  - Przycisk "Kopiuj link" → `navigator.clipboard.writeText(link)` + toast "Link skopiowany"
  - Przycisk "Otwórz w nowej karcie" → `window.open(link, '_blank')`

### 4. Nowy przycisk w sekcji Actions (linia ~358)
- Między "Oznacz jako gotowa" a "Wyślij do klienta"
- Ikona: `Link2` z lucide-react
- Label: "Zapisz i pokaż link"

### 5. Fix inner join w offerQuery (linia 45)
- Zmiana `clients!client_id(name, email)` → `clients(name, email)` — ten sam bug co wcześniej (left join zamiast inner)

## Brak zmian w bazie danych

