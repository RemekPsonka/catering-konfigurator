

# Kompaktowy redesign strony publicznej oferty

## Cel
Zmniejszenie strony z ~9000px (12 ekranów) do ~3500px (4-5 ekranów). Menu i cena widoczne po max 2 przewinięciach.

## Pliki do zmiany

### 1. `src/pages/public/offer.tsx` — główne zmiany
- **Hero**: Usunąć `min-h-[50vh]` / `min-h-[60vh]`, H1 z `text-7xl` → `text-4xl`, dane oferty (numer, typ, ważność) w jednym wierszu flexbox row
- **Powitanie + AI Summary**: Połączyć w jedną sekcję. Pierwsze ~150 słów widoczne, reszta za "Czytaj więcej" (collapsible)
- **Usunąć**: `AboutCateringSection`, `FeaturesSection`, `EventGallerySection`, `TestimonialSection` — nie renderować na stronie oferty
- **Szczegóły wydarzenia**: Grid 2 kolumny, etykieta+wartość w jednym wierszu, H2 → `text-xl`, `py-8 md:py-12`
- **Sekcje py-16 md:py-24**: Zmienić na `py-8 md:py-12` we WSZYSTKICH inline sekcjach
- **H2 sekcji**: Zmienić `text-2xl md:text-3xl` → `text-xl`, `mb-10` → `mb-6`
- **Footer**: Skompresować do ~60px, jedna linia

### 2. `src/components/public/menu-variants-section.tsx`
- H2 `text-2xl md:text-3xl` → `text-xl`, `mb-10` → `mb-6`
- Nazwy kategorii: `text-lg md:text-xl` → `text-base font-semibold`
- `py-16 md:py-24` → `py-8 md:py-12`
- Gap między kategoriami: `mb-8` → `mb-4`
- Gap między daniami: `gap-3` → `gap-2`

### 3. `src/components/public/services-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`, `mb-10` → `mb-6`
- Nagłówki kategorii: `text-lg` → `text-base`
- Gap między usługami: `gap-2` (już jest), gap między grupami: `gap-8` → `gap-4`

### 4. `src/components/public/calculation-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`, `mb-10` → `mb-6`
- People count selector: kompaktowy, mniejszy (`mb-10` → `mb-4`)
- Grand total box: `p-8 md:p-10` → `p-5 md:p-6`, font `text-3xl md:text-5xl` → `text-2xl md:text-3xl`
- Wielowariantowe totale: kompaktowa tabelka zamiast dużych bloków

### 5. `src/components/public/terms-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`, `mb-10` → `mb-6`
- Domyślnie `openIndex = -1` (wszystkie zwinięte)
- Padding w accordion items: `p-5` → `p-3`

### 6. `src/components/public/communication-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`, `mb-8` → `mb-4`
- Textarea: `min-h-[120px]` → `min-h-[80px]`
- Historia: domyślnie pokaż 2 ostatnie, reszta za "Pokaż starszą historię"

### 7. `src/components/public/acceptance-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`, `mb-10` → `mb-6`
- Warianty: z dużych kafelków na kompaktowe radio buttons w jednym wierszu
- Przycisk CTA: zostaje duży

### 8. `src/components/public/contact-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`, `mb-10` → `mb-4`
- Kontakty w jednym wierszu (flexbox row) na desktopie
- Usunąć CTA "Zaplanuj catering"

### 9. `src/components/public/logistics-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`

### 10. `src/components/public/variant-comparison-section.tsx`
- `py-16 md:py-24` → `py-8 md:py-12`
- H2 → `text-xl`

## Co NIE ulega zmianie
- Panel admina — zero zmian
- Kolorystyka i gradienty — zachowane
- Responsywność — zachowana (1 kolumna na mobile)
- Logika biznesowa — zero zmian
- Drukowanie — zachowane

## Oczekiwany rezultat
~3400-3500px łącznej wysokości zamiast ~9000px

