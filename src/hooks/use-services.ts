import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

interface UseServicesOptions {
  filterType?: string | null;
}

export const useServices = ({ filterType }: UseServicesOptions = {}) => {
  return useQuery({
    queryKey: ['services', filterType],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

      if (filterType) {
        query = query.eq('type', filterType as Tables<'services'>['type']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<'services'>) => {
      const { data, error } = await supabase.from('services').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Usługa została dodana');
    },
    onError: () => {
      toast.error('Nie udało się dodać usługi');
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: TablesUpdate<'services'> & { id: string }) => {
      const { data, error } = await supabase.from('services').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Usługa została zaktualizowana');
    },
    onError: () => {
      toast.error('Nie udało się zaktualizować usługi');
    },
  });
};

export const useToggleServiceActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('services').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: () => {
      toast.error('Nie udało się zmienić statusu usługi');
    },
  });
};
