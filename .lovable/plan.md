

# Pobierz ofertę PDF — window.print() z @media print

## Podejście
Użycie `window.print()` z dedykowanym CSS `@media print`. Przycisk w hero i w sekcji kontakt. Dodatkowy header/footer widoczny tylko w druku.

## Pliki do zmiany

### 1. `src/index.css` — dodać blok `@media print`
Reguły ukrywające elementy interaktywne, resetujące animacje, wymuszające A4 layout, otwierające accordion warunków, formatujące hero i galerię.

### 2. `src/pages/public/offer.tsx` — 3 zmiany:
- **Import** `FileDown` z lucide-react
- **Przycisk w hero** (po offer_number, linia ~454): `<button className="no-print ..." onClick={handlePrint}>Pobierz ofertę PDF</button>`
- **Print header** (przed hero, widoczny tylko @media print): div z logo, offer_number, client name, dates
- **Print footer** (po footer, widoczny tylko @media print): dane kontaktowe + data generowania
- **Funkcja `handlePrint`**: zmienia `document.title` na `Oferta_[numer]_Catering_Slaski`, wywołuje `window.print()`, przywraca tytuł
- Dodać klasy `no-print` na: `OnboardingOverlay`, `EditableTooltip`, `ChangesPanel`, `AcceptanceSection`, `CommunicationSection`, przycisk hero

### 3. `src/components/public/contact-section.tsx` — dodać przycisk "Pobierz ofertę PDF"
Dodać opcjonalny prop `onPrint?: () => void`. Jeśli podany, renderować przycisk przed kartami kontaktowymi.

## Kluczowe reguły @media print
```css
@media print {
  .no-print, [data-no-print] { display: none !important; }
  .print-only { display: block !important; }
  * { animation: none !important; transition: none !important; 
      opacity: 1 !important; transform: none !important; }
  body { font-size: 11pt; color: #1A1A1A; background: white; }
  section { page-break-inside: avoid; }
  /* Hero: static, smaller */
  /* Terms: all expanded */
  /* Gallery: 3-col grid, smaller images */
}
```

## Print-only header (ukryty na ekranie, widoczny w druku)
```
Catering Śląski — Oferta cateringowa
[offer_number] | Dla: [client_name] | Data: [created_at] | Ważna do: [valid_until]
```

## Brak zmian w bazie danych

