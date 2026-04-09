

# Google Login + Konfigurator kont (usuwanie, zmiana hasła)

## Zakres
1. Dodanie logowania Google (Lovable Cloud managed) — tylko dla istniejących użytkowników
2. Rozbudowa AccountsPage o usuwanie kont i zmianę hasła
3. Strona `/reset-password` do ustawiania nowego hasła po resecie

## Pliki do utworzenia/zmodyfikowania

### 1. Konfiguracja Google OAuth
- Wywołanie narzędzia **Configure Social Auth** (Lovable Cloud managed Google OAuth)
- Wygeneruje `src/integrations/lovable/` z modułem `lovable.auth.signInWithOAuth("google")`

### 2. `src/pages/auth/login.tsx`
- Import `lovable` z `@/integrations/lovable`
- Dodanie przycisku "Zaloguj się przez Google" pod formularzem email/hasło
- Separator "lub" między formularzem a przyciskiem Google
- `handleGoogleSignIn`: wywołuje `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- Po zalogowaniu Google: sprawdź czy user istnieje (sesja się ustawi automatycznie przez `onAuthStateChange` — jeśli konto nie istnieje w systemie, Supabase Auth zwróci błąd bo nie ma signup)
- Ikona Google (SVG inline)

### 3. `src/hooks/use-auth.tsx`
- Dodanie metod `updatePassword` i `deleteAccount` do kontekstu:
  - `updatePassword(newPassword: string)` → `supabase.auth.updateUser({ password })`
  - `deleteAccount(userId: string)` → wywołanie edge function `list-users` z metodą DELETE

### 4. `supabase/functions/list-users/index.ts`
- Dodanie obsługi **DELETE** method:
  - Body: `{ userId: string }`
  - Walidacja: admin nie może usunąć samego siebie
  - `adminClient.auth.admin.deleteUser(userId)`
- Dodanie obsługi **PATCH** method (zmiana hasła przez admina):
  - Body: `{ userId: string, password: string }`
  - `adminClient.auth.admin.updateUserById(userId, { password })`

### 5. `src/components/features/settings/accounts-page.tsx`
Rozbudowa tabeli kont o nowe akcje per user:
- **Zmień hasło**: przycisk → Dialog z formularzem (nowe hasło, potwierdzenie hasła, min 6 znaków)
  - Wywołuje edge function PATCH
- **Usuń konto**: przycisk (czerwony, ikona Trash) → ConfirmDialog "Czy na pewno usunąć konto X? Tej operacji nie można cofnąć."
  - Nie pozwala usunąć aktualnie zalogowanego usera
  - Wywołuje edge function DELETE
- Dropdown menu akcji zamiast pojedynczego przycisku (MoreHorizontal → DropdownMenu z: Wyślij reset, Zmień hasło, Usuń konto)

### 6. `src/pages/auth/reset-password.tsx` (nowy plik)
- Strona do ustawienia nowego hasła po kliknięciu linku resetującego
- Sprawdza `type=recovery` w URL hash
- Formularz: nowe hasło + potwierdzenie
- Wywołuje `supabase.auth.updateUser({ password })`
- Po sukcesie: redirect do `/login` z toastem

### 7. `src/App.tsx`
- Dodanie route `/reset-password` → `ResetPasswordPage`

### 8. Konfiguracja auth (Lovable Cloud)
- Wywołanie `cloud--configure_auth` aby upewnić się że Google provider jest włączony
- **Wyłączenie rejestracji nowych użytkowników** — tylko istniejące konta mogą się logować (disable signup)

## Ważne zasady
- Google login NIE tworzy nowych kont — signup jest wyłączony, więc jeśli user z danym emailem Google nie istnieje w systemie, logowanie się nie powiedzie
- Admin tworzy konta ręcznie przez AccountsPage (jak dotąd)
- Managed Google OAuth — brak konieczności konfiguracji credentials
- Edge function `list-users` obsługuje GET/POST/PATCH/DELETE

## Brak zmian w bazie danych
Wszystko oparte na Supabase Auth — bez nowych tabel.

