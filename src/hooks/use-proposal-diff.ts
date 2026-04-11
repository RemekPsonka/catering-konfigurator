import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import type { Json } from '@/integrations/supabase/types';

export type ProposalItemWithDishes = Tables<'proposal_items'> & {
  dishes: Tables<'dishes'>;
  proposed_dish: Tables<'dishes'> | null;
  variant_item?: {
    id: string;
    selected_variant_option: string | null;
    allowed_modifications: Json | null;
    dish: {
      modifiable_items: Json | null;
      display_name: string;
    } | null;
  } | null;
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
            proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(*),
            variant_item:variant_items!proposal_items_variant_item_id_fkey(
              id,
              selected_variant_option,
              allowed_modifications,
              dish:dishes(modifiable_items, display_name)
            )
          ),
          offers(*, clients(*))
        `)
        .eq('id', proposalId)
        .single();

      if (error) throw error;
      return data as ProposalDetail;
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

      // 2. Fetch the proposal to get offer_id
      const { data: proposalData } = await supabase
        .from('change_proposals')
        .select('offer_id')
        .eq('id', proposalId)
        .single();

      // 3. If accepted/partially_accepted, update offer status to revision if currently sent/viewed
      if (proposalData && (status === 'accepted' || status === 'partially_accepted')) {
        await supabase
          .from('offers')
          .update({ status: 'revision' as const })
          .eq('id', proposalData.offer_id)
          .in('status', ['sent', 'viewed']);
      }

      // 4. Fetch accepted proposal items to apply to variant_items
      const { data: acceptedItems, error: fetchError } = await supabase
        .from('proposal_items')
        .select(`*, 
          proposed_dish:dishes!proposal_items_proposed_dish_id_fkey(id, display_name),
          variant_item:variant_items!proposal_items_variant_item_id_fkey(
            id, dish:dishes(modifiable_items)
          )
        `)
        .eq('proposal_id', proposalId)
        .eq('status', 'accepted');

      if (fetchError) throw fetchError;
      if (!acceptedItems || acceptedItems.length === 0) return;

      // 5. Apply each accepted change to variant_items
      const errors: string[] = [];

      for (const item of acceptedItems) {
        if (!item.variant_item_id) continue;

        const updateData: TablesUpdate<'variant_items'> = {};

        if (item.change_type === 'SWAP' && item.proposed_dish_id) {
          updateData.dish_id = item.proposed_dish_id;
          updateData.custom_price = item.proposed_price;
          if (item.proposed_dish && typeof item.proposed_dish === 'object' && 'display_name' in item.proposed_dish) {
            updateData.custom_name = (item.proposed_dish as { display_name: string }).display_name;
          }
      } else if (item.change_type === 'VARIANT_CHANGE') {
          // Resolve variant index to label before saving
          let resolvedOption = item.proposed_variant_option;
          const vi = item.variant_item as { id: string; dish: { modifiable_items: Json | null } | null } | null;
          const modItems = vi?.dish?.modifiable_items as Record<string, unknown> | null;
          if (resolvedOption && modItems?.type === 'variant') {
            const options = modItems.options as Array<{ label: string; price_modifier: number }> | undefined;
            if (options) {
              const idx = parseInt(resolvedOption, 10);
              if (!isNaN(idx) && idx >= 0 && idx < options.length) {
                resolvedOption = options[idx].label;
              }
            }
          }
          updateData.selected_variant_option = resolvedOption ?? undefined;
          // Store modifier separately — don't overwrite frozen base price
          updateData.variant_price_modifier = (item.proposed_price ?? 0) - (item.original_price ?? 0);
        } else if (item.change_type === 'QUANTITY_CHANGE') {
          updateData.quantity = item.proposed_quantity ?? undefined;
          updateData.custom_price = item.proposed_price;
        } else if (item.change_type === 'SPLIT') {
          const splitData = item.split_details as { percent: number; splitDishId: string; splitDishName: string } | null;
          if (splitData && item.variant_item_id) {
            // 1. Set split_percent on original item
            updateData.split_percent = splitData.percent;

            // 2. Fetch split dish price
            const { data: splitDish } = await supabase
              .from('dishes')
              .select('price_per_person, price_per_piece, price_per_kg, price_per_set, unit_type')
              .eq('id', splitData.splitDishId)
              .single();

            let splitPrice: number | null = null;
            if (splitDish) {
              switch (splitDish.unit_type) {
                case 'PERSON': splitPrice = splitDish.price_per_person; break;
                case 'PIECE': splitPrice = splitDish.price_per_piece; break;
                case 'KG': splitPrice = splitDish.price_per_kg; break;
                case 'SET': splitPrice = splitDish.price_per_set; break;
              }
            }

            // 3. Fetch original item data for variant_id, sort_order, quantity
            const { data: originalItem } = await supabase
              .from('variant_items')
              .select('variant_id, sort_order, quantity')
              .eq('id', item.variant_item_id)
              .single();

            if (originalItem) {
              const { error: insertError } = await supabase.from('variant_items').insert({
                variant_id: originalItem.variant_id,
                dish_id: splitData.splitDishId,
                custom_name: splitData.splitDishName,
                custom_price: splitPrice ?? item.proposed_price,
                split_parent_id: item.variant_item_id,
                split_percent: 100 - splitData.percent,
                sort_order: (originalItem.sort_order ?? 0) + 1,
                quantity: originalItem.quantity,
              });
              if (insertError) {
                errors.push(item.variant_item_id);
              }
            }
          }
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
      queryClient.invalidateQueries({ queryKey: ['admin-pending-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['offer-variants'] });
      queryClient.invalidateQueries({ queryKey: ['public-offer'] });
      queryClient.invalidateQueries({ queryKey: ['offer'] });
    },
  });
};
