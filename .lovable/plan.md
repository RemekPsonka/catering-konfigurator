

# Naprawy bezpieczeństwa — RPC, .gitignore, DEV_MODE

## Pliki do zmiany

### 1. Migracja SQL — zabezpieczenie RPC `find_offer_by_email_and_number`

Dodać walidację inputów w funkcji (minimalna długość email i numeru). Nie tworzę tabeli `offer_search_attempts` — rate-limiting jest już obsłużony w UI (cooldown 30s po 3 próbach). Dodaję tylko server-side input validation.

```sql
CREATE OR REPLACE FUNCTION public.find_offer_by_email_and_number(p_email text, p_offer_number text)
RETURNS TABLE(...) -- zachowaj istniejące kolumny
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) < 3 THEN
    RAISE EXCEPTION 'Podaj prawidłowy adres email';
  END IF;
  IF p_offer_number IS NULL OR length(trim(p_offer_number)) < 2 THEN
    RAISE EXCEPTION 'Podaj prawidłowy numer oferty';
  END IF;
  -- reszta query bez zmian, dodaj trim()
END;
$function$;
```

### 2. `src/pages/public/offer-find.tsx` — cooldown po każdym wyszukiwaniu

Dodać 3-sekundowy cooldown po KAŻDYM wyszukiwaniu (nie tylko po 3 nieudanych próbach). Zmiana w `handleSubmit`: po `finally` ustawić `setCooldownSeconds(3)`.

### 3. `.gitignore` — dodać `.env` i warianty

Dodać na końcu:
```
# Environment variables
.env
.env.local
.env.production
```

### 4. Usunięcie DEV_MODE — 6 plików

**`src/lib/constants.ts`**: Usunąć `export const DEV_MODE = false;`

**`src/hooks/use-auth.tsx`**: Usunąć import DEV_MODE, DEV_USER, DEV_SESSION. Zamienić warunkowe wyrażenia na bezpośrednie wartości (`null`, `true`). Usunąć `if (DEV_MODE) return;` z signIn, signOut, useEffect.

**`src/components/layout/auth-guard.tsx`**: Usunąć import i `if (DEV_MODE) return <>{children}</>;`

**`src/components/layout/admin-layout.tsx`**: Usunąć import i cały blok `{DEV_MODE && (<div>⚠️ TRYB DEWELOPERSKI...</div>)}`

**`src/pages/auth/login.tsx`**: Usunąć import i `if (DEV_MODE) return <Navigate to="/admin/offers" replace />;`

**`src/components/features/settings/accounts-page.tsx`**: Usunąć import DEV_MODE, `DEV_MOCK_USERS`, i warunki `if (DEV_MODE)` w `useUsers` i `createUser`.

## Efekt
- RPC waliduje inputy server-side
- 3s cooldown po każdym wyszukiwaniu w UI
- `.env` nie będzie commitowany w przyszłości
- Zero DEV_MODE w kodzie — brak możliwości bypass'u auth

