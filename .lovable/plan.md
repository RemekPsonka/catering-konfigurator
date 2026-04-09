

# Zamiana adresu email kontakt@cateringsl.pl → zamowienia@cateringslaski.pl

## Pliki do zmodyfikowania

### 1. `src/components/public/contact-section.tsx` (linie 15-16)
- `value: 'kontakt@cateringsl.pl'` → `'zamowienia@cateringslaski.pl'`
- `href: 'mailto:kontakt@cateringsl.pl'` → `'mailto:zamowienia@cateringslaski.pl'`

### 2. `src/lib/email-templates.ts` (linia 20)
- `kontakt@cateringsl.pl` → `zamowienia@cateringslaski.pl`

### 3. `src/pages/public/offer.tsx` (linie 235, 282)
- Oba `href="mailto:kontakt@cateringsl.pl"` → `"mailto:zamowienia@cateringslaski.pl"`

## Uwaga
Screenshot pokazuje "Nie znaleziono oferty" — to osobny problem (status oferty lub token). Jeśli chcesz to też zbadać, daj znać.

## Brak zmian w bazie danych

