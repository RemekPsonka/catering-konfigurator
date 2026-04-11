

## Plan: Edycja kolorów/czcionek w panelu profilu eventu

### Obecny stan
- `offer_themes` — 14 wierszy (B2B, BOX, FIR, GAL, GRI, KAW, KOM, KON, PRY, SPE, STY, SWI, SZK, WES), IDs identyczne z `event_type_profiles.id`
- Kolory/czcionki zahardkodowane jako seed, brak UI do edycji
- `event-profile-edit.tsx` (636 linii) — edytuje treść profilu, zapisuje przez `useUpdateEventProfile()`
- `company_info` — tabela istnieje z danymi firmy, ale kod używa hardcoded `COMPANY` z `company-config.ts`

### Zmiany

**1. Nowy hook: `src/hooks/use-offer-theme.ts`**
- `useOfferTheme(themeId: string)` — React Query, `offer_themes` WHERE id = themeId
- `useUpdateOfferTheme()` — mutation, update `offer_themes` SET primary_color, secondary_color, accent_color, background_color, text_color, font_family, header_font WHERE id
- Typ `OfferTheme` exportowany

**2. Nowy hook: `src/hooks/use-company-info.ts`**
- `useCompanyInfo()` — React Query, `company_info` LIMIT 1
- Fallback na stałe z `company-config.ts` jeśli brak danych
- Eksport: `useCompanyInfo`

**3. Modyfikacja: `src/pages/admin/event-profile-edit.tsx`**
- Import `useOfferTheme`, `useUpdateOfferTheme`
- Dodaj stany: `primaryColor`, `secondaryColor`, `accentColor`, `bgColor`, `textColor`, `fontFamily`, `headerFont`
- `useEffect` init z theme data
- Nowa Card "🎨 Wygląd strony klienta" po sekcji "Opinia klienta" (przed galerią):
  - 5 color pickers (Input type="color" + Input text hex obok)
  - 2 Select (font_family, header_font) z opcjami: Playfair Display, Cormorant Garamond, Lora, Merriweather, Inter, DM Sans, Poppins, Montserrat
  - Mini-preview (320px): gradient header (primary→secondary) z heading w header_font, body z sample text w font_family, accent color na cenie
- `handleSave`: rozszerz o `updateTheme.mutate(...)` obok `updateProfile.mutate(...)`
- Podgląd dialog: użyj kolorów/czcionek z theme state

**4. Modyfikacja: `src/components/public/contact-section.tsx`**
- Import `useCompanyInfo()` zamiast hardcoded `COMPANY`
- Fallback na stałe wartości

**5. Modyfikacja: `src/lib/company-config.ts`**
- Zachowaj jako fallback/default values (nie usuwaj)

### Nowe pliki
1. `src/hooks/use-offer-theme.ts`
2. `src/hooks/use-company-info.ts`

### Modyfikowane pliki
1. `src/pages/admin/event-profile-edit.tsx` — sekcja Wygląd + rozszerzony save
2. `src/components/public/contact-section.tsx` — useCompanyInfo hook

### Nie ruszam
- Tabeli `offer_themes` (brak migracji)
- Seed data (wartości domyślne zostają)
- Strony publicznej oferty (theme loading już działa)
- Wizarda ofert, tracking, Edge Functions

