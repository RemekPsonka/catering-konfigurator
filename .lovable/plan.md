
# Naprawa linku oferty: stały token + działający link po publikacji

## Co ustaliłem
Problem nie jest już w samej ofercie ani w tokenie:
- ten konkretny link działa w preview i otwiera poprawną ofertę
- na opublikowanej stronie nadal ładuje się stary frontend
- stary frontend wysyła błędne zapytanie:
  - bez `ready` w filtrze statusów
  - bez jawnego `offer_variants!offer_variants_offer_id_fkey`
- dlatego opublikowany link pokazuje „Nie znaleziono oferty”, mimo że dane oferty są poprawne

Dodatkowo:
- link/token wygląda na stały dla oferty, bo wszędzie w kodzie używany jest istniejący `offer.public_token`
- nie widzę w kodzie żadnego mechanizmu regeneracji tokenu przy każdym zapisie
- ale trzeba jeszcze domknąć logikę generowania linku, żeby nie było żadnych wątpliwości i żeby zawsze używał jednego, trwałego tokenu

## Plan naprawy

### 1. Uporządkować logikę publicznego URL
Dodać jedno wspólne helper API do budowania linku oferty:
- `buildPublicOfferUrl(publicToken)`
- używać go wszędzie:
  - krok Podgląd
  - generowanie treści emaila
  - lista ofert / podgląd klienta
  - ewentualnie inne miejsca z `window.open('/offer/...')`

Cel: jeden format linku i zero rozjazdów między miejscami.

### 2. Zagwarantować stałość tokenu dla oferty
Przy zapisie/generowaniu linku:
- nie tworzyć nowego tokenu, jeśli `public_token` już istnieje
- jeśli oferta nie ma tokenu, wygenerować go raz i zapisać w bazie
- po tym momencie zawsze używać tego samego tokenu

To zrobię defensywnie po stronie frontu:
- przed pokazaniem linku odczytać aktualny `public_token`
- jeśli brak, wygenerować/zapisać raz
- dopiero potem budować URL

Dzięki temu link dla jednej oferty będzie stały.

### 3. Naprawić wszystkie miejsca otwierające link klienta
W szczególności:
- `src/components/features/offers/steps/step-preview.tsx`
- `src/lib/email-templates.ts`
- `src/pages/admin/offers-list.tsx`

W `offers-list.tsx` jest jeszcze otwieranie względnego URL:
```ts
window.open(`/offer/${offer.public_token}`, '_blank')
```
To powinno używać opublikowanego adresu i wspólnego helpera.

### 4. Naprawić publiczny fetch oferty w opublikowanej wersji
Sprawdzę i dopnę:
- `offer_variants!offer_variants_offer_id_fkey(...)`
- statusy z `ready`
- spójność z aktualnym kodem preview

To już jest poprawione lokalnie w kodzie, ale trzeba domknąć wdrożenie i upewnić się, że opublikowana wersja korzysta z tej samej logiki.

### 5. Usunąć poboczne ostrzeżenie z dialogu
W konsoli jest warning:
- `Function components cannot be given refs`
- źródło: `StepPreview` / `DialogHeader`

To nie blokuje linku, ale poprawię to przy okazji, żeby preview było czyste i bez mylących błędów.

## Pliki do zmiany
- `src/hooks/use-public-offer.ts`
- `src/components/features/offers/steps/step-preview.tsx`
- `src/lib/email-templates.ts`
- `src/pages/admin/offers-list.tsx`
- ewentualnie nowy helper w `src/lib/` lub rozszerzenie `src/lib/constants.ts`

## Jak zweryfikuję po wdrożeniu
Przetestuję do końca:
1. Otworzę istniejącą ofertę w panelu managera
2. Kliknę „Zapisz i pokaż link”
3. Sprawdzę, czy link ma ten sam token po kolejnym zapisie
4. Otworzę link na opublikowanej domenie
5. Potwierdzę, że ładuje prawidłową ofertę, a nie „Nie znaleziono oferty”
6. Sprawdzę też podgląd z listy ofert i link w wygenerowanej treści emaila

## Ważny wniosek techniczny
To nie wygląda na problem „jeden link na wiele ofert” ani „token zmienia się przy zapisie”. Główny problem jest taki, że opublikowana strona nadal korzysta ze starego bundle’a lub starej ścieżki kodu. Po wdrożeniu i ujednoliceniu generowania linku trzeba to potwierdzić testem na opublikowanym URL.

## Szczegóły techniczne
Aktualny błąd z opublikowanej strony:
```text
PGRST201: Could not embed because more than one relationship was found
for 'offers' and 'offer_variants'
```

Stare zapytanie z published:
```text
offer_variants(...)
status in (sent, viewed, revision, accepted, won)
```

Poprawne zapytanie:
```text
offer_variants!offer_variants_offer_id_fkey(...)
status in (ready, sent, viewed, revision, accepted, won)
```
