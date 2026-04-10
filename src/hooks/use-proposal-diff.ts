import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type ProposalItemWithDishes = Tables<'proposal_items'> & {
  dishes: Tables<'dishes'>;
  proposed_dish: Tables<'dishes'> | null;
};

export type ProposalDetail = Tables<'change_proposals'> & {
  proposal_items: ProposalItemWithDishes[];
  offers: Tables<'offers'> & {
    clients: Tables<'clients'> | null;
  };
};

export const useProposalDetail = (proposalId: string | undefined) => {
  return useQuery({
    queryKey: ['proposal-detail', proposalId],
    queryFn: async () => {
      if (!proposalId) throw new Error('Missing proposalId');

      const { data, error } = await supabase
        .from('change_proposals')
        .select(`
          *,
          proposal_items(
            *,
            dishes!proposal_items_original_dish_id_fkey(*),
            proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(*)
          ),
          offers(*, clients(*))
        `)
        .eq('id', proposalId)
        .single();

      if (error) throw error;
      return data as unknown as ProposalDetail;
    },
    enabled: !!proposalId,
  });
};

export const useUpdateProposalItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      status,
      managerNote,
      decidedBy,
    }: {
      itemId: string;
      status: 'accepted' | 'rejected';
      managerNote?: string;
      decidedBy: string;
    }) => {
      const { error } = await supabase
        .from('proposal_items')
        .update({
          status,
          manager_note: managerNote ?? null,
          decided_at: new Date().toISOString(),
          decided_by: decidedBy,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-proposals'] });
    },
  });
};

export const useResolveProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proposalId,
      status,
      managerNotes,
      resolvedBy,
    }: {
      proposalId: string;
      status: 'accepted' | 'partially_accepted' | 'rejected';
      managerNotes?: string;
      resolvedBy: string;
    }) => {
      const { error } = await supabase
        .from('change_proposals')
        .update({
          status,
          manager_notes: managerNotes ?? null,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
        })
        .eq('id', proposalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-proposals'] });
    },
  });
};
