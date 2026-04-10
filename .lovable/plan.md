

# Refaktor EmailTemplateModal — ujednolicenie props i dodanie mailto limit

## Obecny stan
Komponent istnieje i działa. Wymaga drobnych zmian w interfejsie props i dodania obsługi limitu mailto.

## Zmiany w `src/components/common/email-template-modal.tsx`

### Props — nowy interfejs
```typescript
interface EmailTemplateModalProps {
  open: boolean;           // było: open
  onClose: () => void;     // bez zmian
  recipientEmail: string;  // było: clientEmail
  subject: string;         // bez zmian
  body: string;            // bez zmian
  title?: string;          // NOWE (domyślnie "📧 Email do klienta")
}
```
Usunięte: `clientName`, `offerNumber` (nieużywane wewnętrznie).

### Logika
- Temat: readonly (nie edytowalny) — usunąć `onChange`, dodać `readOnly className="bg-muted"`
- Treść: edytowalna (bez zmian)
- Mailto limit: jeśli `encodeURIComponent(body).length > 1800` → wyłączyć przycisk mailto + info tekst "Treść zbyt długa dla mailto — użyj przycisku Kopiuj"
- State `body` inicjalizowany z props — dodać `useEffect` sync gdy props się zmienią (re-open z inną treścią)

### Caller update
- `src/pages/admin/offer-messages.tsx` — zmienić `clientEmail` → `recipientEmail`, usunąć `clientName`/`offerNumber`

