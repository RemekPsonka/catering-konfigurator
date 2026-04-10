import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type OfferCorrection = Tables<'offer_corrections'>;

// ── Public: fetch corrections for a given offer (no auth) ──
export const usePublicCorrections = (offerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-corrections', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_corrections')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
};

// ── Public: fetch resolved change proposals with items ──
export const usePublicResolvedProposals = (offerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-resolved-proposals', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('change_proposals')
        .select(`
          *,
          proposal_items(
            *,
            dishes:original_dish_id(id, display_name),
            proposed_dishes:proposed_dish_id(id, display_name)
          )
        `)
        .eq('offer_id', offerId)
        .in('status', ['accepted', 'partially_accepted', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
};

// ── Admin: fetch corrections for an offer ──
export const useAdminCorrections = (offerId: string | undefined) => {
  return useQuery({
    queryKey: ['admin-corrections', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_corrections')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
};

// ── Admin: respond to a correction ──
export const useRespondCorrection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      correctionId,
      managerResponse,
    }: {
      correctionId: string;
      managerResponse: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('offer_corrections')
        .update({
          manager_response: managerResponse,
          responded_at: new Date().toISOString(),
          responded_by: user?.id ?? null,
          status: 'resolved',
        })
        .eq('id', correctionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-corrections'] });
      queryClient.invalidateQueries({ queryKey: ['public-corrections'] });
    },
  });
};

// ── Admin: fetch proposals for an offer (all statuses) ──
export const useAdminProposals = (offerId: string | undefined) => {
  return useQuery({
    queryKey: ['admin-proposals', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('change_proposals')
        .select(`
          *,
          proposal_items(
            *,
            dishes!proposal_items_original_dish_id_fkey(id, display_name, modifiable_items),
            proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(id, display_name)
          )
        `)
        .eq('offer_id', offerId)
        .not('status', 'eq', 'draft_client')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
};

// ── Public: submit question or correction ──
export const useSubmitMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      message,
      clientName,
      type,
    }: {
      offerId: string;
      message: string;
      clientName?: string;
      type: 'question' | 'correction';
    }) => {
      const { error } = await supabase
        .from('offer_corrections')
        .insert({
          offer_id: offerId,
          message,
          client_name: clientName || null,
          type,
        });

      if (error) throw error;

      // If correction, update offer status to revision
      if (type === 'correction') {
        await supabase
          .from('offers')
          .update({ status: 'revision' as const })
          .eq('id', offerId)
          .in('status', ['sent', 'viewed']);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-corrections'] });
      queryClient.invalidateQueries({ queryKey: ['public-offer'] });
    },
  });
};
