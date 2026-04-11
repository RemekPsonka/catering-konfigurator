import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface PendingProposalItem {
  id: string;
  proposalId: string;
  variantItemId: string | null;
  changeType: string;
  originalDishId: string;
  proposedDishId: string | null;
  proposedDishName: string | null;
  proposedVariantOption: string | null;
  resolvedProposedLabel: string | null;
  proposedQuantity: number | null;
  proposedPrice: number;
  originalPrice: number;
  status: string;
  splitDetails: { percent: number; splitDishId: string; splitDishName: string } | null;
}

export interface ProposalSummary {
  id: string;
  status: string;
  itemCount: number;
  clientName: string | null;
  createdAt: string | null;
}

const resolveVariantLabel = (
  modifiableItems: Json | null,
  optionValue: string | null,
): string | null => {
  if (!optionValue || !modifiableItems) return optionValue;
  const mods = modifiableItems as Record<string, unknown>;
  if (mods.type !== 'variant') return optionValue;
  const options = mods.options as Array<{ label: string; price_modifier: number }> | undefined;
  if (!options) return optionValue;

  // If it's a numeric index, resolve to label
  const idx = parseInt(optionValue, 10);
  if (!isNaN(idx) && idx >= 0 && idx < options.length) {
    return options[idx].label;
  }
  // Already a label string — check if it matches
  const match = options.find(o => o.label === optionValue);
  if (match) return match.label;
  return optionValue;
};

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
            original_price, proposed_quantity, status, split_details,
            proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(display_name),
            variant_item:variant_items!proposal_items_variant_item_id_fkey(
              id,
              dish:dishes(modifiable_items)
            )
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

          // Resolve variant label from modifiable_items
          let resolvedLabel: string | null = null;
          if (item.change_type === 'VARIANT_CHANGE' && item.proposed_variant_option) {
            const variantItem = item.variant_item as { id: string; dish: { modifiable_items: Json | null } | null } | null;
            const modItems = variantItem?.dish?.modifiable_items ?? null;
            resolvedLabel = resolveVariantLabel(modItems, item.proposed_variant_option);
          }

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
            resolvedProposedLabel: resolvedLabel,
            proposedQuantity: item.proposed_quantity,
            proposedPrice: item.proposed_price,
            originalPrice: item.original_price,
            status: item.status,
            splitDetails: item.split_details as { percent: number; splitDishId: string; splitDishName: string } | null,
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
