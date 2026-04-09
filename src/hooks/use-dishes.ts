import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { ITEMS_PER_PAGE } from '@/lib/dish-constants';

export interface DishWithCategory extends Tables<'dishes'> {
  category_name: string;
  category_icon: string | null;
}

export interface DishFilters {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  dietTags?: string[];
  page: number;
}

export const useDishes = (filters: DishFilters) => {
  return useQuery({
    queryKey: ['dishes', filters],
    queryFn: async () => {
      const from = (filters.page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('dishes')
        .select('*, dish_categories!inner(name, icon)', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .range(from, to);

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
      }

      if (filters.dietTags && filters.dietTags.length > 0) {
        query = query.overlaps('diet_tags', filters.dietTags);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const dishes: DishWithCategory[] = (data ?? []).map((d: Record<string, unknown>) => {
        const cat = d.dish_categories as { name: string; icon: string | null } | null;
        return {
          ...(d as Tables<'dishes'>),
          category_name: cat?.name ?? '',
          category_icon: cat?.icon ?? null,
        };
      });

      return { dishes, total: count ?? 0 };
    },
  });
};

export const useDish = (id: string | undefined) => {
  return useQuery({
    queryKey: ['dish', id],
    queryFn: async () => {
      if (!id) throw new Error('No dish id');
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateDish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TablesInsert<'dishes'>) => {
      const { data: dish, error } = await supabase
        .from('dishes')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return dish;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      toast.success('Danie zostało dodane');
    },
    onError: () => {
      toast.error('Nie udało się dodać dania. Spróbuj ponownie.');
    },
  });
};

export const useUpdateDish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: TablesUpdate<'dishes'> & { id: string }) => {
      const { data: dish, error } = await supabase
        .from('dishes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return dish;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dish'] });
      toast.success('Danie zostało zaktualizowane');
    },
    onError: () => {
      toast.error('Nie udało się zaktualizować dania. Spróbuj ponownie.');
    },
  });
};
