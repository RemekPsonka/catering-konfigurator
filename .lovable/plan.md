

# Pełna komunikacja klient ↔ manager na stronie oferty

## Zakres zmian

### Część A: Nowa sekcja "Pytania i uwagi" (strona klienta)
Zastąpienie `CorrectionsSection` nowym komponentem `CommunicationSection` z dwoma zakładkami:
- **Tab 1 "💬 Mam pytanie"**: textarea + imię (opcjonalne, prefill z client.name) + przycisk outline. INSERT do `offer_corrections` z `type = 'question'`, BEZ zmiany statusu oferty. Powiadomienie `question_submitted`.
- **Tab 2 "📝 Zgłoś korektę"**: textarea + imię + przycisk primary + uwaga pod przyciskiem. INSERT z `type = 'correction'`, zmiana statusu oferty na `revision`. Powiadomienie `correction_submitted`.

### Część B: Historia komunikacji (strona klienta)
Pod formularzem — timeline z `offer_corrections` + resolved `change_proposals`:
- Pytania (💬 niebieski badge) i korekty (📝 pomarańczowy badge) z treścią klienta (lewa strona, szare tło)
- Odpowiedzi managera (prawa strona, border primary) gdy `status = 'resolved'`
- Propozycje zmian (🔄 fioletowy badge) z listą pozycji i statusami ✅/❌
- Chronologicznie, najnowsze na górze, animacja fadeInUp

### Część C: Panel admina — tab "💬 Komunikacja"
Nowa strona `/admin/offers/:id/communication` (lub tab w istniejącym edytorze). Ponieważ edytor oferty to OfferWizard (7 kroków), dodam **osobną stronę** `/admin/offers/:id/messages` z linkiem z listy ofert i z wizarda.

Zawartość:
- Lista pytań/korekt chronologicznie
- Badge typu + data + imię klienta + treść
- Dla `status = 'new'`: textarea odpowiedzi + przycisk "Odpowiedz"/"Rozwiąż"
- UPDATE `offer_corrections` → `status = 'resolved'`, `manager_response`, `responded_at`
- Po odpowiedzi → modal emailowy (Część D)

### Część D: EmailTemplateModal — reużywalny komponent
Modal po odpowiedzi managera:
- Pole "Do:" (readonly + kopiuj), "Temat:" (gotowy), "Treść:" (edytowalna textarea z template)
- Trzy przyciski: "📋 Kopiuj wszystko", "✉️ Otwórz w kliencie email" (mailto), "Pomiń"
- Wydzielony jako `src/components/common/email-template-modal.tsx`

## Nowe pliki
1. `src/components/public/communication-section.tsx` — zastępuje corrections-section (A+B)
2. `src/components/common/email-template-modal.tsx` — reużywalny modal emailowy (D)
3. `src/pages/admin/offer-messages.tsx` — strona komunikacji admina (C)
4. `src/hooks/use-offer-corrections.ts` — hooki: fetch corrections, respond, fetch for public

## Modyfikowane pliki
1. `src/pages/public/offer.tsx` — zamiana `CorrectionsSection` na `CommunicationSection`
2. `src/hooks/use-public-offer.ts` — dodanie hooka `usePublicCorrections` (query offer_corrections + change_proposals resolved)
3. `src/App.tsx` — dodanie route `/admin/offers/:id/messages`
4. `src/lib/email-templates.ts` — template odpowiedzi na pytanie/korektę

## Baza danych
Tabela `offer_corrections` ma już kolumny: `type`, `status`, `manager_response`, `responded_at`, `responded_by`. **Nie trzeba migracji.**

Potrzebna jest RLS policy na SELECT dla publicznego odczytu `offer_corrections` (klient musi widzieć swoje wpisy + odpowiedzi). Obecnie jest tylko `public_corrections_insert`. Dodam **migrację** z polityką:
```sql
CREATE POLICY "public_corrections_read" ON offer_corrections
FOR SELECT USING (
  EXISTS (SELECT 1 FROM offers WHERE offers.id = offer_corrections.offer_id AND offers.public_token IS NOT NULL)
);
```

## Szczegóły techniczne

### Hook `usePublicCorrections(offerId)`
Fetch `offer_corrections` z filtrem `offer_id`, order by `created_at DESC`. Publiczny (bez auth).

### Hook `usePublicResolvedProposals(offerId)`
Fetch `change_proposals` z `status IN ('accepted', 'partially_accepted', 'rejected')` + `proposal_items(*, dishes)`. Publiczny.

### Hook `useOfferCorrections(offerId)` (admin)
Fetch z auth. CRUD — odpowiadanie.

### EmailTemplateModal props
```typescript
interface EmailTemplateModalProps {
  open: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName: string;
  subject: string;
  body: string;
  offerNumber: string;
}
```

