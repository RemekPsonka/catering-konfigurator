

# Naprawa białego ekranu: brak publicznego dostępu do `dish_categories`

## Diagnoza
Otworzyłem link na published. Dane ładują się (HTTP 200), ale aplikacja crashuje z:
```
TypeError: Cannot read properties of null (reading 'id')
```

Przyczyna: w odpowiedzi Supabase `dish_categories` jest `null` dla każdego dania, bo tabela `dish_categories` **nie ma publicznej polityki RLS** — ma tylko `auth_full_access`.

Crash następuje w `src/components/public/menu-variants-section.tsx` linia 28:
```ts
const cat = item.dishes.dish_categories;
const existing = groups.get(cat.id);  // cat === null → crash
```

Dodatkowo: `clients` też jest `null` (brak publicznego RLS), ale kod już używa `?.` więc nie crashuje. Warto jednak dodać politykę, bo dane klienta nie wyświetlają się.

## Plan naprawy

### 1. Nowa migracja SQL — publiczny odczyt `dish_categories` i `clients`
```sql
-- dish_categories: publiczny odczyt aktywnych kategorii
CREATE POLICY "public_categories_read" ON public.dish_categories
FOR SELECT USING (is_active = true);

-- clients: publiczny odczyt tylko przez ofertę z tokenem
CREATE POLICY "public_clients_read" ON public.clients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM offers
    WHERE offers.client_id = clients.id
      AND offers.public_token IS NOT NULL
      AND offers.status = ANY (ARRAY[
        'ready'::offer_status, 'sent'::offer_status,
        'viewed'::offer_status, 'revision'::offer_status,
        'accepted'::offer_status, 'won'::offer_status
      ])
  )
);
```

### 2. Defensywny null check w `menu-variants-section.tsx`
Zabezpieczyć `groupByCategory` na wypadek gdyby `dish_categories` było `null`:
```ts
const cat = item.dishes.dish_categories;
const catId = cat?.id ?? 'uncategorized';
const existing = groups.get(catId);
```

## Oczekiwany efekt
Po migracji + republish link wyświetla ofertę zamiast białego ekranu.

