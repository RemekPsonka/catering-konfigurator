

## Plan: Napraw znikającą belkę zakładek w Ustawieniach

### Problem
Zakładki "Dane firmy" i "Profile eventów" używają `navigate()` do osobnych stron (`/admin/settings/company`, `/admin/settings/event-profiles`). Po kliknięciu użytkownik traci pasek zakładek i nie ma łatwego powrotu.

### Rozwiązanie
Zamiast nawigować do osobnych stron, renderować "Dane firmy" i "Profile eventów" jako zawartość zakładek (`TabsContent`) bezpośrednio na stronie Ustawień — tak jak działają już "Konta", "Szablony" i "Warunki".

### Zmiany

**1. `src/pages/admin/settings.tsx`**
- Usunąć `onClick` z zakładek "Dane firmy" i "Profile eventów"
- Dodać `<TabsContent value="company">` z `<CompanySettingsPage />` (bez nagłówka — bo jest już "Ustawienia")
- Dodać `<TabsContent value="event-profiles">` z `<EventProfilesListPage />`
- Obsłużyć URL: jeśli ktoś wejdzie na `/admin/settings/company` → redirect do `/admin/settings` z aktywną zakładką "company"

**2. `src/App.tsx`** (opcjonalnie)
- Zachować route `/admin/settings/company` jako redirect do `/admin/settings?tab=company` albo usunąć, jeśli nie jest linkowany z innych miejsc

**3. `src/pages/admin/company-settings.tsx`**
- Wyodrębnić formularz do komponentu, który można renderować bez własnego nagłówka "Dane firmy" (albo warunkowe ukrycie nagłówka gdy renderowany w zakładce)

### Efekt
- Pasek zakładek zawsze widoczny
- Nawigacja między sekcjami ustawień bez przeładowania strony
- Spójna nawigacja z resztą zakładek

