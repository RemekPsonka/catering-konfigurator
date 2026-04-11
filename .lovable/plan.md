

## Plan: Napraw generowanie linku publicznego dla nowych ofert

### Problem
`handleSaveAndShowLink` ustawia status na `'ready'`, ale trigger `generate_public_token()` generuje token tylko przy `status = 'sent'`. Więc `public_token` zostaje `NULL` → link wychodzi jako `/offer/` (pusty).

Ten sam problem dotyczy `handleGenerateEmail` — też ustawia `'ready'` i czyta `offer?.public_token` z cache'u.

### Rozwiązanie

**1. Zmiana triggera w bazie** — generuj token także dla `'ready'`:
```sql
IF NEW.status IN ('sent', 'ready') AND NEW.public_token IS NULL THEN
```

**2. Refetch oferty po mutacji** — w `handleSaveAndShowLink` i `handleGenerateEmail` po ustawieniu statusu trzeba odświeżyć dane oferty, żeby pobrać nowo wygenerowany token, zanim zbudujemy link.

W `statusMutation.onSuccess` już jest `invalidateQueries(['offers'])`, ale brakuje `invalidateQueries(['offer', offerId])` — więc `offer` w komponencie nie odświeża się.

Konkretnie w `handleSaveAndShowLink`:
- Po mutacji: refetch oferty → odczytaj nowy `public_token` → dopiero wtedy `setPublicLink(...)`.

**3. Analogicznie w `handleGenerateEmail`** — po refetch użyj świeżego tokenu w emailu.

### Pliki do zmiany
1. **Migracja SQL** — rozszerzenie triggera `generate_public_token()` o status `'ready'`
2. **`src/components/features/offers/steps/step-preview-send.tsx`** — refetch oferty w `onSuccess` obu handlerów, budowanie linku z odświeżonego tokenu

### Efekt
- "Zapisz i pokaż link" → token generowany natychmiast → poprawny link
- "Wygeneruj email" → email zawiera poprawny link publiczny
- Istniejące oferty ze statusem `sent` → bez zmian (trigger i tak działa)

