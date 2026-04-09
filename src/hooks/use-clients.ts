import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

interface UseClientsOptions {
  search?: string;
}

export const useClients = ({ search }: UseClientsOptions = {}) => {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      let query = supabase.from('clients').select('*').order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useClientOfferCounts = () => {
  return useQuery({
    queryKey: ['client-offer-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offers').select('client_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data) {
        counts[row.client_id] = (counts[row.client_id] || 0) + 1;
      }
      return counts;
    },
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesInsert<'clients'>) => {
      const { data, error } = await supabase.from('clients').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-offer-counts'] });
      toast.success('Klient został dodany');
    },
    onError: () => {
      toast.error('Nie udało się dodać klienta');
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: TablesUpdate<'clients'> & { id: string }) => {
      const { data, error } = await supabase.from('clients').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Klient został zaktualizowany');
    },
    onError: () => {
      toast.error('Nie udało się zaktualizować klienta');
    },
  });
};
