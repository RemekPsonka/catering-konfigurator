import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type OfferTheme = Tables<'offer_themes'>;

export const useOfferTheme = (themeId: string | undefined) =>
  useQuery({
    queryKey: ['offer-theme', themeId],
    queryFn: async () => {
      if (!themeId) return null;
      const { data, error } = await supabase
        .from('offer_themes')
        .select('*')
        .eq('id', themeId)
        .single();
      if (error) throw error;
      return data as OfferTheme;
    },
    enabled: !!themeId,
  });

export const useUpdateOfferTheme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'offer_themes'> }) => {
      const { error } = await supabase
        .from('offer_themes')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['offer-theme', id] });
    },
    onError: () => toast.error('Nie udało się zapisać wyglądu'),
  });
};
