import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

export interface VariantItemWithDish extends Tables<'variant_items'> {
  dishes: {
    id: string;
    display_name: string;
    photo_url: string | null;
    unit_type: string;
    price_per_person: number | null;
    price_per_piece: number | null;
    price_per_kg: number | null;
    price_per_set: number | null;
    is_modifiable: boolean | null;
    modifiable_items: Json | null;
  };
}

export interface VariantWithItems extends Tables<'offer_variants'> {
  variant_items: VariantItemWithDish[];
}

export const getDishPrice = (dish: VariantItemWithDish['dishes']): number => {
  switch (dish.unit_type) {
    case 'PERSON': return dish.price_per_person ?? 0;
    case 'PIECE': return dish.price_per_piece ?? 0;
    case 'KG': return dish.price_per_kg ?? 0;
    case 'SET': return dish.price_per_set ?? 0;
    default: return 0;
  }
};

export const getItemPrice = (item: VariantItemWithDish): number => {
  const base = item.custom_price != null ? Number(item.custom_price) : getDishPrice(item.dishes);
  return base + (Number(item.variant_price_modifier) || 0);
};

export const useOfferVariants = (offerId: string | null) => {
  return useQuery({
    queryKey: ['offer-variants', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_variants')
        .select('*, variant_items!variant_items_variant_id_fkey(*, dishes(id, display_name, photo_url, unit_type, price_per_person, price_per_piece, price_per_kg, price_per_set, is_modifiable, modifiable_items))')
        .eq('offer_id', offerId)
        .order('sort_order');
      if (error) throw error;
      // Sort variant_items by sort_order within each variant
      return (data as VariantWithItems[]).map(v => ({
        ...v,
        variant_items: (v.variant_items ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      }));
    },
    enabled: !!offerId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { offer_id: string; name: string; sort_order: number }) => {
      const { data: result, error } = await supabase
        .from('offer_variants')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', vars.offer_id] });
      toast.success('Wariant dodany');
    },
    onError: () => toast.error('Nie udało się dodać wariantu'),
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, offer_id, ...data }: { id: string; offer_id: string; name?: string; description?: string | null; is_recommended?: boolean }) => {
      const { error } = await supabase.from('offer_variants').update(data).eq('id', id);
      if (error) throw error;
      return { offer_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', result.offer_id] });
    },
    onError: () => toast.error('Nie udało się zaktualizować wariantu'),
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, offer_id }: { id: string; offer_id: string }) => {
      const { error } = await supabase.from('offer_variants').delete().eq('id', id);
      if (error) throw error;
      return { offer_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', result.offer_id] });
      toast.success('Wariant usunięty');
    },
    onError: () => toast.error('Nie udało się usunąć wariantu'),
  });
};

export const useAddVariantItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { variant_id: string; dish_id: string; sort_order: number; offer_id: string }) => {
      const { offer_id, ...insertData } = data;

      // Fetch current dish price and freeze it as custom_price
      const { data: dish } = await supabase
        .from('dishes')
        .select('unit_type, price_per_person, price_per_piece, price_per_kg, price_per_set')
        .eq('id', data.dish_id)
        .single();

      let frozenPrice: number | null = null;
      if (dish) {
        switch (dish.unit_type) {
          case 'PERSON': frozenPrice = dish.price_per_person; break;
          case 'PIECE': frozenPrice = dish.price_per_piece; break;
          case 'KG': frozenPrice = dish.price_per_kg; break;
          case 'SET': frozenPrice = dish.price_per_set; break;
        }
      }

      const { data: result, error } = await supabase
        .from('variant_items')
        .insert({ ...insertData, quantity: 1, custom_price: frozenPrice })
        .select()
        .single();
      if (error) throw error;
      return { ...result, offer_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', result.offer_id] });
      toast.success('Danie dodane');
    },
    onError: () => toast.error('Nie udało się dodać dania'),
  });
};

export const useUpdateVariantItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, offer_id, ...data }: TablesUpdate<'variant_items'> & { id: string; offer_id: string }) => {
      const { error } = await supabase.from('variant_items').update(data).eq('id', id);
      if (error) throw error;
      return { offer_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', result.offer_id] });
    },
    onError: () => toast.error('Nie udało się zaktualizować pozycji'),
  });
};

export const useRemoveVariantItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, offer_id }: { id: string; offer_id: string }) => {
      const { error } = await supabase.from('variant_items').delete().eq('id', id);
      if (error) throw error;
      return { offer_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', result.offer_id] });
      toast.success('Pozycja usunięta');
    },
    onError: () => toast.error('Nie udało się usunąć pozycji'),
  });
};

export const useDuplicateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, offer_id, newName, newSortOrder }: { variantId: string; offer_id: string; newName: string; newSortOrder: number }) => {
      // Create new variant
      const { data: newVariant, error: vError } = await supabase
        .from('offer_variants')
        .insert({ offer_id, name: newName, sort_order: newSortOrder })
        .select()
        .single();
      if (vError) throw vError;

      // Copy items
      const { data: items, error: iError } = await supabase
        .from('variant_items')
        .select('*')
        .eq('variant_id', variantId);
      if (iError) throw iError;

      if (items && items.length > 0) {
        const newItems = items.map(({ id, variant_id, ...rest }) => ({
          ...rest,
          variant_id: newVariant.id,
        }));
        const { error: insertError } = await supabase.from('variant_items').insert(newItems as TablesInsert<'variant_items'>[]);
        if (insertError) throw insertError;
      }

      return { offer_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', result.offer_id] });
      toast.success('Wariant zduplikowany');
    },
    onError: () => toast.error('Nie udało się zduplikować wariantu'),
  });
};

export const useReorderVariantItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, offer_id }: { items: Array<{ id: string; sort_order: number }>; offer_id: string }) => {
      const { error } = await supabase.rpc('reorder_variant_items', {
        items: JSON.stringify(items),
      });
      if (error) throw error;
      return { offer_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', result.offer_id] });
    },
    onError: () => toast.error('Nie udało się zmienić kolejności'),
  });
};
