

## Plan: Udostępnij ofertę + FAQ [CS-034]

### Analiza
- Tabela `offer_events` istnieje (insert RLS dla public z token check)
- Tabela `offer_faq` istnieje (question, answer, event_types[], is_active, sort_order)
- Brak istniejącego helpera do insertowania eventów — trzeba stworzyć
- `ChangesPanel` jest fixed bottom — ShareOffer FAB będzie obok (prawy dolny róg, wyżej)
- Sekcja FAQ powinna być PO testimonials, PRZED TermsSection

### Nowe pliki (3)

**1. `src/lib/tracking.ts`** — helper do fire-and-forget event tracking
- `trackOfferEvent(offerId, eventType, eventData?)` — insert do `offer_events` z session_id (random, cached in sessionStorage), device_type, browser
- Fire-and-forget (no await, no error handling w callerze)

**2. `src/components/public/share-offer.tsx`** — FAB + Sheet
- Props: `offerId`, `offerUrl` (window.location.href), `eventTypeLabel`, `eventDate`
- FAB button: fixed right-4 bottom-20 (nad ChangesPanel), ikona Share2, z pulse animation
- Sheet (z prawej) z 3 opcjami:
  - **Kopiuj link** — `navigator.clipboard.writeText(url)`, toast "Link skopiowany!"
  - **Wyślij emailem** — input na email odbiorcy + textarea opcjonalna wiadomość → `mailto:` link z pre-filled subject/body
  - **WhatsApp** — `https://wa.me/?text={encoded}` w nowym oknie
- Każda akcja → `trackOfferEvent(offerId, 'share_clicked', { method: 'copy'|'email'|'whatsapp' })`

**3. `src/components/public/faq-section.tsx`** — sekcja FAQ
- Fetch `offer_faq` WHERE `is_active=true`, filtruj w JS: `event_types` zawiera `eventType` LUB `event_types` jest puste
- Max 8 pytań, sortowane po `sort_order`
- Shadcn Accordion z premium stylem (theme vars)
- Przy otwarciu pytania → `trackOfferEvent(offerId, 'faq_opened', { question_id })`

### Pliki modyfikowane (1)

**`src/pages/public/offer.tsx`**
- Import `ShareOffer` i `FaqSection`
- Dodaj `<FaqSection offerId={offer.id} eventType={offer.event_type} />` po TestimonialsCarousel, przed TermsSection
- Dodaj `<ShareOffer offerId={offer.id} eventTypeLabel={...} eventDate={offer.event_date} />` w sekcji no-print (obok ChangesPanel)

### Nie ruszam
- `changes-panel.tsx`, sekcji oferty, admin panelu
- Schema bazy (tabele `offer_events` i `offer_faq` już istnieją)

