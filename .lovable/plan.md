

# Skrócenie public_token z 64 na 12 znaków alfanumerycznych

## Diagnoza
Token jest generowany przez **trigger bazodanowy** `generate_public_token` na tabeli `offers`:
```sql
IF NEW.public_token IS NULL THEN
    NEW.public_token := encode(gen_random_bytes(32), 'hex');
END IF;
```
Produkuje 64-znakowy hex string. Trzeba zmienić na 12-znakowy alfanumeryczny (bez mylących znaków 0/O/1/l/I).

Frontend **nie generuje** tokenu — tylko go odczytuje i buduje URL. Zmiana dotyczy wyłącznie funkcji bazodanowej.

## Plan

### 1. Migracja SQL — zmiana funkcji `generate_public_token`
Nowa wersja funkcji generuje 12-znakowy token z bezpiecznego alfabetu:

```sql
CREATE OR REPLACE FUNCTION generate_public_token()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  bytes bytea;
  result text := '';
  i int;
BEGIN
  IF NEW.public_token IS NULL THEN
    bytes := gen_random_bytes(12);
    FOR i IN 0..11 LOOP
      result := result || substr(chars, (get_byte(bytes, i) % 54) + 1, 1);
    END LOOP;
    NEW.public_token := result;
  END IF;
  RETURN NEW;
END;
$$;
```

Alfabet: 54 znaki (bez 0, O, 1, l, I) — czytelny przy przepisywaniu.

### 2. Frontend — walidacja tokenu w `src/pages/public/offer.tsx`
Dodać walidację formatu tokenu z kompatybilnością wsteczną:
- Akceptuj stare tokeny (>12 znaków, hex)
- Akceptuj nowe tokeny (12 znaków alfanumerycznych)
- Odrzuć tokeny z niedozwolanymi znakami → komunikat "Nieprawidłowy link do oferty"

```typescript
const isValidToken = (token: string): boolean => {
  if (!token || token.length === 0) return false;
  // Old format: 64-char hex
  if (/^[a-f0-9]{64}$/.test(token)) return true;
  // New format: 12-char alphanumeric (safe chars)
  if (/^[A-HJ-NP-Za-hj-km-np-z2-9]{12}$/.test(token)) return true;
  return false;
};
```

### 3. Pliki BEZ zmian
- `src/hooks/use-public-offer.ts` — token to string, działa z dowolną długością
- `src/lib/constants.ts` — `buildPublicOfferUrl` konkatenuje token, OK
- `src/lib/email-templates.ts` — placeholder `{offerLink}`, OK
- RLS policies — sprawdzają `public_token IS NOT NULL`, OK
- Routing — `:publicToken` to dowolny string, OK

### Istniejące oferty
Stare tokeny (64 znaki) **pozostają** w bazie i działają nadal. Nowe oferty dostaną 12-znakowe tokeny.

## Brak zmian strukturalnych w bazie — tylko `CREATE OR REPLACE FUNCTION`.

