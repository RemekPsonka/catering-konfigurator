

# Tryb deweloperski (DEV_MODE)

## Zakres
Dodanie stałej `DEV_MODE` i warunkowe pomijanie logowania na frontendzie. Brak zmian w bazie danych.

## Pliki do zmodyfikowania

### 1. `src/lib/constants.ts`
- Dodaj na górze: `export const DEV_MODE = true;`

### 2. `src/hooks/use-auth.tsx`
- Import `DEV_MODE`
- Gdy `DEV_MODE === true`: AuthProvider ustawia mock usera zamiast odpytywać Supabase Auth:
  ```typescript
  const DEV_USER: User = { id: 'dev-user-id', email: 'dev@test.pl', user_metadata: { role: 'admin' } } as User;
  const DEV_SESSION: Session = { user: DEV_USER } as Session;
  ```
- `isLoading` od razu `false`, `signIn`/`signOut` jako no-op

### 3. `src/components/layout/auth-guard.tsx`
- Import `DEV_MODE`
- Gdy `DEV_MODE === true` → zwróć `children` bez sprawdzania auth

### 4. `src/pages/auth/login.tsx`
- Import `DEV_MODE` + `Navigate`
- Gdy `DEV_MODE === true` → return `<Navigate to="/admin/offers" replace />`

### 5. `src/components/layout/admin-layout.tsx`
- Import `DEV_MODE`
- Gdy `DEV_MODE === true` → render czerwony banner na górze: `"⚠️ TRYB DEWELOPERSKI — logowanie wyłączone"`

## Uwagi
- RLS: istniejące policies `auth_full_access` wymagają `auth.uid() IS NOT NULL`. Mock user działa tylko na frontendzie — zapytania do Supabase nadal idą z anon key bez sesji. Jeśli RLS blokuje dane, trzeba będzie zalogować się raz prawdziwym kontem lub dodać tymczasowe policy. Na razie zostawiamy bez zmian w RLS.
- Kod auth guard zachowany w pełni — tylko warunkowo pomijany.

