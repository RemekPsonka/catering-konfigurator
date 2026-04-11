

## Plan: Social Proof + Opinie + Badge rekomendowanego [CS-033]

### Analiza obecnego stanu

- **Badge "Polecany"** na wariancie z `is_recommended=true` — **już istnieje** w `variant-comparison-section.tsx` i `menu-variants-section.tsx` (ikona Sparkles + "Polecany"). Zmienię tekst na "Najczęściej wybierany ⭐".
- **Checkbox "Polecany"** w wizardzie (step-menu) — **już istnieje** (linia 271-277).
- `TestimonialSection` istnieje ale to prosty komponent na 1 cytat z event_type_profiles — nie pobiera z tabeli `testimonials`.
- Tabele `company_stats` i `testimonials` już istnieją w bazie.

### Zmiany

**1. Nowa strona admin `/admin/social-proof`** (nowy plik `src/pages/admin/social-proof.tsx`)
- Tabs: "Statystyki firmy" | "Opinie klientów"
- Tab Statystyki: edytowalne karty z `company_stats` (stat_value, stat_label, stat_icon, sort_order, is_active)
- Tab Opinie: lista z `testimonials`, CRUD dialog (client_name, event_type dropdown, event_description, quote, rating 1-5, is_active toggle, photo_url)
- Dodaj route w `App.tsx`: `<Route path="social-proof" element={<SocialProofPage />} />`
- Dodaj link w sidebar (`admin-layout.tsx`): "Social Proof" z ikoną `Award`, po "Usługi"

**2. Hook `src/hooks/use-social-proof.ts`**
- `useCompanyStats()` — fetch `company_stats` WHERE is_active=true ORDER BY sort_order
- `useTestimonials(eventType?)` — fetch `testimonials` WHERE is_active=true, preferuj pasujące do event_type, dopełnij do max 3
- `useUpdateStat()`, `useCreateTestimonial()`, `useUpdateTestimonial()`, `useDeleteTestimonial()` — CRUD mutations

**3. Publiczna strona — pasek statystyk** (`src/components/public/social-proof-stats.tsx`)
- Fetch `company_stats` WHERE is_active=true
- Grid 4 kolumny desktop, 2 mobile
- Każdy: emoji (stat_icon) + duża liczba (countUp z framer-motion + useInView) + label
- Styl premium, theme CSS vars

**4. Publiczna strona — sekcja opinii** (`src/components/public/testimonials-carousel.tsx`)
- Fetch `testimonials` WHERE is_active=true, filtruj po event_type oferty (dopełnij globalnymi do 3)
- 3 karty: cytat w cudzysłowie, imię, opis wydarzenia, gwiazdki (Star icons)
- framer-motion staggerChildren fadeInUp

**5. Integracja w `src/pages/public/offer.tsx`**
- Dodaj `<SocialProofStats />` i `<TestimonialsCarousel eventType={offer.event_type} />` przed `<TermsSection />`

**6. Badge "Najczęściej wybierany ⭐"**
- W `variant-comparison-section.tsx` i `menu-variants-section.tsx`: zmień tekst z "Polecany" na "Najczęściej wybierany ⭐", zachowaj Sparkles icon + dodaj gwiazdkę

### Pliki nowe
1. `src/pages/admin/social-proof.tsx`
2. `src/hooks/use-social-proof.ts`
3. `src/components/public/social-proof-stats.tsx`
4. `src/components/public/testimonials-carousel.tsx`

### Pliki modyfikowane
1. `src/App.tsx` — nowa route
2. `src/components/layout/admin-layout.tsx` — nowy link w sidebar
3. `src/pages/public/offer.tsx` — integracja sekcji
4. `src/components/public/variant-comparison-section.tsx` — zmiana tekstu badge
5. `src/components/public/menu-variants-section.tsx` — zmiana tekstu badge

### Nie ruszam
- Logiki kalkulacji, wizarda (checkbox już istnieje), systemu propozycji
- `testimonial-section.tsx` (stary komponent, może być używany gdzie indziej)
- Schemy bazy (tabele `company_stats` i `testimonials` już istnieją)

