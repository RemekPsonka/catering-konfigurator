

## Plan: Napraw wyświetlanie nazw produktów w panelu "Moje zmiany"

### Problem
Panel upsell pokazuje "Dodatek" zamiast prawdziwych nazw produktów (np. "Piramidka makaroników", "Patera owoców sezonowych", "Lemoniadowy bar").

### Przyczyna
Tabela `offer_upsell_selections` nie ma klucza obcego (FK) do `upsell_items` na kolumnie `upsell_item_id`. Bez FK Supabase PostgREST nie potrafi wykonać joina `.select('*, upsell_items(name, emoji)')` — zwraca null, co powoduje fallback na tekst "Dodatek".

### Rozwiązanie

**1. Migracja SQL** — dodaj brakujący FK:
```sql
ALTER TABLE public.offer_upsell_selections
  ADD CONSTRAINT offer_upsell_selections_upsell_item_id_fkey
  FOREIGN KEY (upsell_item_id) REFERENCES public.upsell_items(id) ON DELETE CASCADE;
```

Po tej jednej zmianie join zacznie działać i nazwy produktów pojawią się automatycznie we wszystkich 3 miejscach w kodzie (changes-panel, step-pricing, step-preview-send).

**2. Bez zmian w kodzie** — logika `{item?.name ?? 'Dodatek'}` jest poprawna — po dodaniu FK `item?.name` przestanie być null.

### Weryfikacja
- Panel "Moje zmiany" pokaże: "🎂 Piramidka makaroników 400,00 zł" zamiast "🛒 Dodatek 400,00 zł"

