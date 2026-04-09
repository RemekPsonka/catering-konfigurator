

# Naprawa: Nie da się dodać klienta, usługi, sprzętu

## Diagnoza
Potwierdzony problem: **DEV_MODE = true** w `src/lib/constants.ts` omija AuthGuard (UI), ale tworzy **fałszywy** obiekt `User` z `id: 'dev-user-id'` który **nie jest prawdziwą sesją Supabase**. Klient Supabase wysyła requesty z kluczem anon, ale bez JWT → `auth.uid()` jest NULL → RLS policy `auth.uid() IS NOT NULL` blokuje INSERT/UPDATE (401).

- GET (SELECT) zwraca 200 ale puste dane (bo policy sprawdza `auth.uid() IS NOT NULL` a to jest NULL)
- POST (INSERT) zwraca **401** — widoczny toast "Nie udało się dodać klienta"

## Rozwiązanie

Zmiana DEV_MODE na `false` i zapewnienie prawdziwego logowania. To wymaga:

### 1. `src/lib/constants.ts`
- Zmień `DEV_MODE = true` na `DEV_MODE = false`

### 2. Konfiguracja Auth
- Włączyć auto-confirm email (dla dev) za pomocą `cloud--configure_auth`
- Utworzyć konto testowe (np. `admin@cateringsl.pl` / hasło) przez Supabase Auth

### 3. Weryfikacja
- Po zmianie DEV_MODE na false, app przekieruje na `/login`
- Zalogowanie prawdziwym kontem → `auth.uid()` dostępny → RLS przepuszcza operacje
- Dodawanie klientów, usług, sprzętu działa

### Alternatywa (jeśli wolisz zostawić DEV_MODE):
Nie zmieniać DEV_MODE, tylko w `use-auth.tsx` przy DEV_MODE automatycznie logować się do Supabase prawdziwym kontem (np. `supabase.auth.signInWithPassword`). To da prawdziwą sesję + wygodę dev mode.

## Rekomendacja
Opcja z prawdziwym logowaniem (DEV_MODE = false) — bezpieczniejsza i bliższa produkcji. Strona logowania już istnieje (`/login`).

## Brak zmian w bazie danych
Tabele i RLS policies są poprawne — problem jest wyłącznie po stronie braku autentykacji.

