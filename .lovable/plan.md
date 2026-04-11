

## Plan: CS-PDF-01 — Ustawienia Danych Firmy

### Obecny stan
- Tabela `company_info` istnieje z 1 wierszem (dane NONO FOOD już w seedzie)
- Hook `useCompanyInfo()` istnieje — tylko odczyt z `select` transformacją
- Brak strony edycji, brak uploadu logo, brak bucketu `company-assets`

### Zmiany

**1. Migracja SQL: bucket `company-assets`**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);
-- RLS: auth upload, public read
```

**2. Rozszerzenie hooka: `src/hooks/use-company-info.ts`**
- Dodaj `useCompanyInfoRaw()` — zwraca surowe dane z DB (bez transformacji `select`) do pre-fill formularza
- Dodaj `useUpdateCompanyInfo()` — mutation UPDATE company_info WHERE id, invalidate queryKey `['company-info']`

**3. Nowa strona: `src/pages/admin/company-settings.tsx`**
- Formularz React Hook Form + Zod:
  - company_name, legal_form (text)
  - address_line1, address_line2 (text)
  - nip (walidacja: 10 cyfr lub XXX-XXX-XX-XX), regon (text)
  - bank_name, bank_account (text)
  - phone, email (walidacja format), website, instagram, facebook (text)
  - Logo: upload do `company-assets/{uuid}.{ext}`, podgląd aktualnego logo
- Przycisk "Zapisz" → update + toast "Dane firmy zapisane"
- Card layout z sekcjami: Dane prawne, Kontakt, Media społecznościowe, Dane bankowe, Logo

**4. Routing: `src/App.tsx`**
- Dodaj route: `settings/company` → `CompanySettingsPage` (wewnątrz `/admin`)

**5. Nawigacja: `src/pages/admin/settings.tsx`**
- Dodaj nowy TabsTrigger "Dane firmy" z onClick navigate do `/admin/settings/company`

### Nowe pliki
1. `src/pages/admin/company-settings.tsx`

### Modyfikowane pliki
1. `src/hooks/use-company-info.ts` — dodaj `useCompanyInfoRaw`, `useUpdateCompanyInfo`
2. `src/App.tsx` — dodaj route `settings/company`
3. `src/pages/admin/settings.tsx` — dodaj tab "Dane firmy"

### Migracja SQL
- Bucket `company-assets` + RLS policies

### Nie ruszam
- `company-config.ts` (fallback zostaje)
- Komponentów publicznych, PDF, Edge Functions

