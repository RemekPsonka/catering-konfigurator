

## Plan: Podpięcie brakujących sekcji profilu eventu do strony publicznej

### Problem
Hook `usePublicEventProfile` jest wywoływany w `offer.tsx` (linia 68), ale wynik jest ignorowany — brak destructuring `{ data }`. Trzy gotowe komponenty (`AboutCateringSection`, `FeaturesSection`, `TestimonialSection`) nie są zaimportowane ani renderowane. `VariantComparisonSection` istnieje, ale nie jest podpięty.

### Zmiany — jeden plik: `src/pages/public/offer.tsx`

**1. Destructure hook (linia 68)**
```
PRZED: usePublicEventProfile(offer?.event_type);
PO:    const { data: eventProfile } = usePublicEventProfile(offer?.event_type);
```

**2. Dodaj importy**
- `AboutCateringSection` z `@/components/public/about-catering-section`
- `FeaturesSection` z `@/components/public/features-section`
- `TestimonialSection` z `@/components/public/testimonial-section`
- `VariantComparisonSection` z `@/components/public/variant-comparison-section`

**3. Dodaj stan `showComparison` (boolean, default false)** — przełącznik "Porównaj warianty"

**4. Renderuj sekcje w JSX (kolejność):**

Po CountdownTimer + Onboarding, PRZED MenuVariantsSection:
```tsx
{eventProfile?.description_long && (
  <div className="no-print">
    <AboutCateringSection descriptionLong={eventProfile.description_long} />
  </div>
)}
{eventProfile?.features && Array.isArray(eventProfile.features) && (eventProfile.features as Feature[]).length > 0 && (
  <div className="no-print">
    <FeaturesSection features={eventProfile.features as Feature[]} />
  </div>
)}
```

Wewnątrz sekcji menu (po `MenuVariantsSection`, w tym samym `data-track-section="menu"` div), jeśli >= 2 warianty:
```tsx
{offer.offer_variants.length >= 2 && (
  <div className="no-print text-center py-4">
    <Button variant="outline" onClick={() => setShowComparison(v => !v)}>
      {showComparison ? 'Ukryj porównanie' : 'Porównaj warianty'}
    </Button>
  </div>
)}
{showComparison && (
  <VariantComparisonSection
    variants={offer.offer_variants}
    pricingMode={offer.pricing_mode}
    peopleCount={offer.people_count ?? 1}
    priceDisplayMode={offer.price_display_mode}
    onSelectVariant={handleVariantChange}
    acceptedVariantId={offer.accepted_variant_id}
  />
)}
```

Po Gallery + Upsell, PRZED SocialProofStats:
```tsx
{eventProfile?.testimonial_text && (
  <div className="no-print">
    <TestimonialSection
      text={eventProfile.testimonial_text}
      author={eventProfile.testimonial_author}
      event={eventProfile.testimonial_event}
    />
  </div>
)}
```

**5. Typ Feature** — lokalny type alias na górze komponentu:
```tsx
type Feature = { icon: string; title: string; text: string };
```

### Kolejność sekcji (finalna)
Hero → Countdown → Onboarding → **AboutCatering** → **Features** → Menu + **VariantComparison toggle** → Services → Calculation → Gallery → Upsell → **Testimonial** → SocialProof → TestimonialsCarousel → FAQ → Terms → Communication → Acceptance → Contact → Footer

### Props compatibility
- `AboutCateringSection`: `descriptionLong: string` — OK, `event_type_profiles.description_long` is `string | null`
- `FeaturesSection`: `features: Feature[]` — OK, cast z `Json | null`
- `TestimonialSection`: `text: string, author?: string | null, event?: string | null` — OK, exact match
- `VariantComparisonSection`: `onSelectVariant: (variantId: string) => void` — reuse `handleVariantChange` (accepts `string | null`, compatible)

### Nie ruszam
- Komponentów `AboutCateringSection`, `FeaturesSection`, `TestimonialSection`, `VariantComparisonSection`
- Hooka `usePublicEventProfile`
- Innych sekcji, tracking, Edge Functions

