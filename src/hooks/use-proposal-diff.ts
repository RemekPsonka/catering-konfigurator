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
      // 1. Update proposal status
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

      // 2. Fetch accepted proposal items to apply to variant_items
      const { data: acceptedItems, error: fetchError } = await supabase
        .from('proposal_items')
        .select('*, proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(id, display_name)')
        .eq('proposal_id', proposalId)
        .eq('status', 'accepted');

      if (fetchError) throw fetchError;
      if (!acceptedItems || acceptedItems.length === 0) return;

      // 3. Apply each accepted change to variant_items
      const errors: string[] = [];

      for (const item of acceptedItems) {
        if (!item.variant_item_id) continue;

        const updateData: Record<string, unknown> = {};

        if (item.change_type === 'SWAP' && item.proposed_dish_id) {
          updateData.dish_id = item.proposed_dish_id;
          updateData.custom_price = item.proposed_price;
          if (item.proposed_dish && typeof item.proposed_dish === 'object' && 'display_name' in item.proposed_dish) {
            updateData.custom_name = (item.proposed_dish as { display_name: string }).display_name;
          }
        } else if (item.change_type === 'VARIANT_CHANGE') {
          updateData.selected_variant_option = item.proposed_variant_option;
          updateData.custom_price = item.proposed_price;
        } else if (item.change_type === 'QUANTITY_CHANGE') {
          updateData.quantity = item.proposed_quantity;
          updateData.custom_price = item.proposed_price;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('variant_items')
            .update(updateData)
            .eq('id', item.variant_item_id);

          if (updateError) {
            errors.push(item.variant_item_id);
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(`Nie udało się zaktualizować ${errors.length} pozycji oferty`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['public-offer'] });
      queryClient.invalidateQueries({ queryKey: ['offer'] });
    },
  });
};
