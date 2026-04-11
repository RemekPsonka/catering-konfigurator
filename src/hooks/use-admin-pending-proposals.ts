import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PendingProposalItem {
  id: string;
  proposalId: string;
  variantItemId: string | null;
  changeType: string;
  originalDishId: string;
  proposedDishId: string | null;
  proposedDishName: string | null;
  proposedVariantOption: string | null;
  proposedPrice: number;
  originalPrice: number;
  status: string;
}

export interface ProposalSummary {
  id: string;
  status: string;
  itemCount: number;
  clientName: string | null;
  createdAt: string | null;
}

export const useAdminPendingProposals = (offerId: string | null) => {
  return useQuery({
    queryKey: ['admin-pending-proposals', offerId],
    queryFn: async () => {
      if (!offerId) return { proposals: [] as ProposalSummary[], itemsByVariantItem: new Map<string, PendingProposalItem[]>() };

      const { data, error } = await supabase
        .from('change_proposals')
        .select(`
          id, status, client_name, created_at,
          proposal_items(
            id, variant_item_id, change_type, original_dish_id,
            proposed_dish_id, proposed_variant_option, proposed_price,
            original_price, status,
            proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(display_name)
          )
        `)
        .eq('offer_id', offerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const proposals: ProposalSummary[] = (data ?? []).map(p => ({
        id: p.id,
        status: p.status,
        itemCount: p.proposal_items?.length ?? 0,
        clientName: p.client_name,
        createdAt: p.created_at,
      }));

      const itemsByVariantItem = new Map<string, PendingProposalItem[]>();

      for (const proposal of (data ?? [])) {
        for (const item of (proposal.proposal_items ?? [])) {
          if (item.status !== 'pending' || !item.variant_item_id) continue;

          const mapped: PendingProposalItem = {
            id: item.id,
            proposalId: proposal.id,
            variantItemId: item.variant_item_id,
            changeType: item.change_type,
            originalDishId: item.original_dish_id,
            proposedDishId: item.proposed_dish_id,
            proposedDishName: item.proposed_dish && typeof item.proposed_dish === 'object' && 'display_name' in item.proposed_dish
              ? (item.proposed_dish as { display_name: string }).display_name
              : null,
            proposedVariantOption: item.proposed_variant_option,
            proposedPrice: item.proposed_price,
            originalPrice: item.original_price,
            status: item.status,
          };

          const existing = itemsByVariantItem.get(item.variant_item_id) ?? [];
          existing.push(mapped);
          itemsByVariantItem.set(item.variant_item_id, existing);
        }
      }

      return { proposals, itemsByVariantItem };
    },
    enabled: !!offerId,
  });
};
