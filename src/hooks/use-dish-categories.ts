import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface DishCategoryWithCount extends Tables<'dish_categories'> {
  dish_count: number;
}

const QUERY_KEY = ['dish-categories'];

export const useDishCategories = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<DishCategoryWithCount[]> => {
      // Fetch categories
      const { data: categories, error: catError } = await supabase
        .from('dish_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      // Fetch dish counts per category
      const { data: dishes, error: dishError } = await supabase
        .from('dishes')
        .select('category_id')
        .eq('is_active', true);

      if (dishError) throw dishError;

      const countMap = new Map<string, number>();
      for (const dish of dishes ?? []) {
        countMap.set(dish.category_id, (countMap.get(dish.category_id) ?? 0) + 1);
      }

      return (categories ?? []).map((cat) => ({
        ...cat,
        dish_count: countMap.get(cat.id) ?? 0,
      }));
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<'dish_categories'>) => {
      const { data: result, error } = await supabase
        .from('dish_categories')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Kategoria została dodana');
    },
    onError: (error: Error) => {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Kategoria o takim kodzie już istnieje');
      } else {
        toast.error('Nie udało się dodać kategorii. Spróbuj ponownie.');
      }
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: TablesUpdate<'dish_categories'> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('dish_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Kategoria została zaktualizowana');
    },
    onError: (error: Error) => {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Kategoria o takim kodzie już istnieje');
      } else {
        toast.error('Nie udało się zaktualizować kategorii. Spróbuj ponownie.');
      }
    },
  });
};

export const useUpdateCategoryOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: Array<{ id: string; sort_order: number }>) => {
      const promises = items.map((item) =>
        supabase
          .from('dish_categories')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      const results = await Promise.all(promises);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      toast.error('Nie udało się zmienić kolejności. Spróbuj ponownie.');
    },
  });
};

export const useToggleCategoryActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('dish_categories')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(variables.is_active ? 'Kategoria aktywowana' : 'Kategoria dezaktywowana');
    },
    onError: () => {
      toast.error('Nie udało się zmienić statusu kategorii.');
    },
  });
};
