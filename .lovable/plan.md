

# Integracja event_type_profiles ze stroną klienta

## Zakres
Nowy hook do pobierania profilu eventu na stronie publicznej. 4 nowe komponenty sekcji (opis, wyróżniki, galeria, opinia). Aktualizacja hero w offer page. Aktualizacja ContactSection z CTA z profilu. Zmiana kolejności sekcji.

## Pliki do utworzenia

### 1. `src/hooks/use-public-event-profile.ts`
Hook pobierający `event_type_profiles` + `event_type_photos` po `event_type` oferty (bez auth — public read):
- `usePublicEventProfile(eventType)` — fetch profile WHERE `id = eventType` AND `is_active = true`
- `usePublicEventPhotos(eventType)` — fetch photos ordered by sort_order

### 2. `src/components/public/about-catering-section.tsx`
Sekcja "O naszym cateringu [typ]":
- Warunek: `description_long` niepuste
- Layout: max-w-prose (65ch), text-lg, leading-relaxed, fadeInUp
- Lekko odróżnione tło (`--theme-bg` z opacity)

### 3. `src/components/public/features-section.tsx`
Sekcja "Dlaczego my" — wyróżniki:
- Warunek: features array niepusty
- Grid 4 kolumny desktop, 2 mobile
- Karty z emoji ikoną, tytułem, opisem, hover y: -6, shadow
- staggerContainer + fadeInUp

### 4. `src/components/public/event-gallery-section.tsx`
Sekcja "Galeria realizacji":
- Warunek: photos (bez hero) > 0
- `MasonryPhotoAlbum` z react-photo-album (już zainstalowany)
- Klik → `yet-another-react-lightbox` z caption
- Responsive columns: 2/3/4
- fadeIn na sekcji

### 5. `src/components/public/testimonial-section.tsx`
Sekcja "Opinia klienta":
- Warunek: `testimonial_text` niepuste
- Ozdobne cudzysłowy, italic, tekst centered
- Autor + wydarzenie pod spodem
- Pełna szerokość, delikatne tło primary/5

## Pliki do zmodyfikowania

### 6. `src/pages/public/offer.tsx`
- Import nowych komponentów + `usePublicEventProfile` / `usePublicEventPhotos`
- **Hero**: jeśli profil ma hero photo → `<img>` z object-cover jako tło parallax + gradient overlay. Headline z profilu zamiast generycznego emoji.
- Nowa kolejność sekcji: Hero → Powitanie → AI Summary → About → Features → Gallery → Event Details → Menu → Services → Calculation → Testimonial → Terms → Corrections → Acceptance → Contact (z CTA) → Footer
- ContactSection: przekaż `ctaText` z profilu

### 7. `src/components/public/contact-section.tsx`
- Dodaj opcjonalny prop `ctaText?: string`
- Jeśli obecny, wyświetl jako przycisk CTA nad kontaktami

## Zależności
- `react-photo-album` — już zainstalowany w package.json
- `yet-another-react-lightbox` — już zainstalowany

## Brak zmian w bazie danych
Tabele `event_type_profiles` i `event_type_photos` już istnieją z public read policies.

