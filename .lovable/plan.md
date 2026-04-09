

# System szablonów ofert

## Zakres
Trzy funkcjonalności: zapisywanie oferty jako szablon, tworzenie nowej oferty z szablonu, zarządzanie szablonami w ustawieniach.

## Pliki do utworzenia

### 1. `src/hooks/use-offer-templates.ts`
Hook React Query do CRUD `offer_templates`:
- `useOfferTemplates(filterEventType?)` — lista szablonów z opcjonalnym filtrem
- `useSaveAsTemplate()` — mutation: pobiera pełne dane oferty (variants + items + services + settings), buduje `template_data` JSONB, INSERT do `offer_templates`
- `useCreateFromTemplate()` — mutation: pobiera szablon, tworzy nową ofertę draft z `template_data` (warianty, dania, usługi, ustawienia), klient/daty/osoby puste
- `useUpdateTemplate()` — mutation: update nazwy/opisu
- `useToggleTemplate()` — mutation: toggle `is_active`

### 2. `src/components/features/offers/save-template-dialog.tsx`
Modal "Zapisz jako szablon":
- Pola: nazwa (required), opis (optional), event_type (pre-filled, readonly), pricing_mode (pre-filled, readonly)
- Przycisk "Zapisz" → `useSaveAsTemplate().mutate({ offerId, name, description })`
- Props: `offerId: string; eventType: string; pricingMode: string; open: boolean; onOpenChange`

### 3. `src/components/features/offers/use-template-dialog.tsx`
Modal "Użyj szablonu":
- Lista szablonów (`is_active = true`) z filtrami per event_type
- Per szablon: nazwa, opis, event_type label, pricing_mode label, liczba wariantów (z `template_data`)
- Klik → `useCreateFromTemplate().mutate(templateId)` → navigate do `/admin/offers/{newOfferId}/edit`
- Props: `open: boolean; onOpenChange`

### 4. `src/components/features/settings/templates-page.tsx`
Tab "Szablony" w ustawieniach:
- Tabela: Nazwa | Typ eventu | Pricing mode | Warianty | Aktywny (Switch) | Akcje (edycja nazwy/opisu)
- Inline edit dialog dla nazwy/opisu
- Toggle `is_active` via Switch

## Pliki do zmodyfikowania

### 5. `src/pages/admin/offers-list.tsx`
- Import `SaveTemplateDialog` i `UseTemplateDialog`
- Dodaj do dropdown menu per wiersz: "Zapisz jako szablon" → otwiera `SaveTemplateDialog`
- Dodaj przycisk "Z szablonu" obok "Nowa oferta" → otwiera `UseTemplateDialog`

### 6. `src/components/features/offers/steps/step-preview.tsx`
- Dodaj przycisk "Zapisz jako szablon" (BookTemplate icon) obok przycisków akcji
- Otwiera `SaveTemplateDialog` z danymi oferty

### 7. `src/components/features/offers/steps/step-event-data.tsx`
- Dodaj przycisk "Użyj szablonu" na górze formularza
- Otwiera `UseTemplateDialog`

### 8. `src/pages/admin/settings.tsx`
- Dodaj tab "Szablony" z komponentem `TemplatesPage`

## Template data JSONB structure
```typescript
interface TemplateData {
  variants: Array<{
    name: string;
    description: string | null;
    is_recommended: boolean;
    sort_order: number;
    items: Array<{
      dish_id: string;
      quantity: number;
      custom_price: number | null;
      custom_name: string | null;
      sort_order: number;
      is_client_editable: boolean;
      allowed_modifications: unknown;
      selected_variant_option: string | null;
    }>;
  }>;
  services: Array<{
    service_id: string;
    quantity: number;
    custom_price: number | null;
    notes: string | null;
  }>;
  settings: {
    price_display_mode: string;
    is_people_count_editable: boolean;
    min_offer_price: number | null;
    theme_id: string | null;
    greeting_text: string | null;
    notes_client: string | null;
    discount_percent: number;
    discount_value: number;
    delivery_cost: number;
  };
  pricing_mode: string;
}
```

## Logika `useCreateFromTemplate`
1. Pobierz szablon z `offer_templates`
2. INSERT `offers` z `template_data.settings` + `pricing_mode` + `event_type` ze szablonu, `client_id` = placeholder (wymaga uzupełnienia w kroku 1), `status = 'draft'`
3. Per wariant z `template_data.variants`: INSERT `offer_variants`, potem bulk INSERT `variant_items`
4. Bulk INSERT `offer_services` z `template_data.services`
5. Navigate do `/admin/offers/{newId}/edit`

## Szczegóły techniczne
- Tabela `offer_templates` już istnieje z kolumnami: `id, name, description, event_type, pricing_mode, template_data (JSONB), is_active, created_by, created_at, updated_at`
- `created_by` = `auth.uid()` z hooka `useAuth`
- Brak zmian w bazie danych
- Reuse `useDuplicateOffer` pattern dla tworzenia z szablonu (INSERT offer → INSERT variants → INSERT items → INSERT services)
- Filtrowanie szablonów: `is_active = true` w dialogu użycia, wszystkie w ustawieniach

