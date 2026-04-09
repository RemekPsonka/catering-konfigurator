

# Rozwiązanie: opublikuj aktualną wersję aplikacji

## Diagnoza
Kod w `src/hooks/use-public-offer.ts` jest **już poprawny**:
- Linia 34: `offer_variants!offer_variants_offer_id_fkey(` — explicit FK hint ✓
- Linia 47: `.in('status', ['ready', 'sent', 'viewed', 'revision', 'accepted', 'won'])` — zawiera `ready` ✓

Problem: opublikowana strona (`catering-konfigurator.lovable.app`) serwuje **stary bundle JS** sprzed tych poprawek.

## Wymagane działanie
**Nie ma zmian w kodzie do wykonania.** Kod jest gotowy.

Musisz kliknąć przycisk **"Publish"** (ikona globu w prawym górnym rogu edytora) → **"Update"**, żeby wdrożyć aktualny kod na domenę produkcyjną.

Po opublikowaniu link powinien działać:
`https://catering-konfigurator.lovable.app/offer/f6239fb2ab0f4a8681c35532a767c7c5dec984d1ce08400bbc8ddc132aa32631`

## Po publikacji — weryfikacja
Po kliknięciu Update, otworzę link w przeglądarce i potwierdzę, że oferta się wyświetla poprawnie.

