import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { recalculateOfferTotals } from '@/lib/calculations';

export type OfferServiceWithService = Tables<'offer_services'> & {
  services: Tables<'services'>;
};

export const useOfferServices = (offerId: string | null) => {
  return useQuery({
    queryKey: ['offer-services', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_services')
        .select('*, services(*)')
        .eq('offer_id', offerId);
      if (error) throw error;
      return data as OfferServiceWithService[];
    },
    enabled: !!offerId,
  });
};

export const useAddOfferService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, serviceId, quantity }: { offerId: string; serviceId: string; quantity?: number }) => {
      const { data, error } = await supabase
        .from('offer_services')
        .insert({ offer_id: offerId, service_id: serviceId, quantity: quantity ?? 1 })
        .select('*, services(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer-services', variables.offerId] });
      recalculateOfferTotals(variables.offerId);
    },
    onError: () => {
      toast.error('Nie udało się dodać usługi');
    },
  });
};

export const useUpdateOfferService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      offerId,
      quantity,
      customPrice,
      notes,
    }: {
      id: string;
      offerId: string;
      quantity?: number;
      customPrice?: number | null;
      notes?: string | null;
    }) => {
      const { error } = await supabase
        .from('offer_services')
        .update({
          ...(quantity !== undefined && { quantity }),
          ...(customPrice !== undefined && { custom_price: customPrice }),
          ...(notes !== undefined && { notes }),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer-services', variables.offerId] });
      recalculateOfferTotals(variables.offerId);
    },
    onError: () => {
      toast.error('Nie udało się zaktualizować usługi');
    },
  });
};

export const useRemoveOfferService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, offerId }: { id: string; offerId: string }) => {
      const { error } = await supabase
        .from('offer_services')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer-services', variables.offerId] });
      recalculateOfferTotals(variables.offerId);
    },
    onError: () => {
      toast.error('Nie udało się usunąć usługi');
    },
  });
};
