
# Konfigurator Ofert — "Catering Śląski"

## Zakres
Scaffold projektu z pełną strukturą folderów, routingiem, layoutami i placeholder stronami.

## Co zostanie zbudowane

### 1. Struktura plików i typy
- `src/types/database.ts` i `src/types/index.ts` — podstawowe typy (Offer, Dish, Client, Lead, statuses)
- `src/lib/supabase.ts` — klient Supabase (createClient z env vars)
- `src/lib/constants.ts` — stałe (statusy ofert, typy eventów, kolory statusów)
- `src/lib/calculations.ts` — placeholder na logikę kalkulacji

### 2. Komponenty wspólne (common)
- `LoadingSpinner` — spinner z tekstem "Ładowanie..."
- `EmptyState` — ikona + tekst + opcjonalny przycisk CTA
- `ConfirmDialog` — AlertDialog do destrukcyjnych akcji
- `StatusBadge` — Badge z mapowaniem kolorów wg statusu

### 3. Layouty
- `AdminLayout` — SidebarProvider + Sidebar (logo "CS", nawigacja: Oferty, Baza potraw, Klienci, Leady, Ustawienia) + TopBar (użytkownik, wyloguj). Sidebar collapsible z hamburger na mobile.
- `PublicLayout` — prosty layout pełnej szerokości bez sidebara

### 4. Auth
- `useAuth` hook — sesja, login, logout, AuthGuard
- Strona `/login` — formularz email + hasło
- AuthGuard wrapper na wszystkich `/admin/*` routach

### 5. Placeholder strony (każda z nagłówkiem "Nazwa — w budowie")
- **Admin**: Dashboard, Lista ofert, Nowa oferta, Edycja oferty, Diff view propozycji, Lista dań, Nowe danie, Edycja dania, Lista klientów, Pipeline leadów, Detal leada, Ustawienia
- **Public**: Strona oferty klienta (`/offer/:publicToken`)

### 6. Routing (App.tsx)
- Wszystkie ścieżki z planu, admin routes owrapowane AuthGuardem
- `/admin` redirectuje do `/admin/offers`
- `/offer/:publicToken` bez auth guardu

### Styl
- Kolorystyka domyślna shadcn (neutralna, profesjonalna)
- Polski język na wszystkich etykietach UI
- Sidebar: ikony Lucide + tekst, aktywny link podświetlony
