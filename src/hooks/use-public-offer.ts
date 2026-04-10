import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { DishModification } from '@/components/public/dish-edit-panel';

export type PublicOffer = Tables<'offers'> & {
  clients: Tables<'clients'>;
  offer_themes: Tables<'offer_themes'> | null;
  offer_variants: (Tables<'offer_variants'> & {
    variant_items: (Tables<'variant_items'> & {
      dishes: Tables<'dishes'> & {
        dish_categories: Tables<'dish_categories'>;
        dish_photos: Tables<'dish_photos'>[];
      };
    })[];
  })[];
  offer_services: (Tables<'offer_services'> & {
    services: Tables<'services'>;
  })[];
};

export const usePublicOffer = (publicToken: string | undefined) => {
  return useQuery({
    queryKey: ['public-offer', publicToken],
    queryFn: async (): Promise<PublicOffer | null> => {
      if (!publicToken) return null;

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          clients(*),
          offer_themes(*),
          offer_variants!offer_variants_offer_id_fkey(
            *,
            variant_items(
              *,
              dishes(*, dish_categories(*), dish_photos(*))
            )
          ),
          offer_services(
            *,
            services(*)
          )
        `)
        .eq('public_token', publicToken)
        .maybeSingle();

      if (error) throw error;
      return data as PublicOffer | null;
    },
    enabled: !!publicToken,
  });
};

export const useMarkOfferViewed = () => {
  return useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('offers')
        .update({ viewed_at: new Date().toISOString(), status: 'viewed' as const })
        .eq('id', offerId)
        .is('viewed_at', null);

      if (error) throw error;
    },
  });
};

export const usePublicOfferProposals = (offerId: string | undefined) => {
  return useQuery({
    queryKey: ['public-proposals', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('change_proposals')
        .select('*')
        .eq('offer_id', offerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
};

interface SubmitProposalParams {
  offerId: string;
  modifications: Map<string, DishModification>;
  clientMessage?: string;
  clientName?: string;
  originalTotal: number;
  proposedTotal: number;
  variantItems: { id: string; dishes: { id: string; display_name: string }; custom_price: number | null; quantity: number | null }[];
}

export const useSubmitProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, modifications, clientMessage, clientName, originalTotal, proposedTotal, variantItems }: SubmitProposalParams) => {
      // Insert change_proposals
      const { data: proposal, error: proposalError } = await supabase
        .from('change_proposals')
        .insert({
          offer_id: offerId,
          client_message: clientMessage || null,
          client_name: clientName || null,
          original_total: originalTotal,
          proposed_total: proposedTotal,
          price_diff: proposedTotal - originalTotal,
          status: 'pending',
        })
        .select('id')
        .single();

      if (proposalError) throw proposalError;

      // Insert proposal_items — rollback proposal on failure
      const items = Array.from(modifications.entries()).map(([itemId, mod]) => {
        const variantItem = variantItems.find((vi) => vi.id === itemId);
        const originalPrice = variantItem?.custom_price ?? 0;
        const originalQty = variantItem?.quantity ?? 1;

        let changeType: 'SWAP' | 'VARIANT_CHANGE' | 'SPLIT' | 'QUANTITY_CHANGE' = 'SWAP';
        let proposedDishId: string | null = null;
        let proposedPrice = Number(originalPrice);
        let proposedVariantOption: string | null = null;

        if (mod.type === 'swap') {
          changeType = 'SWAP';
          proposedDishId = mod.swapDishId ?? null;
          proposedPrice = Number(originalPrice) + (mod.swapPriceDiff ?? 0);
        } else if (mod.type === 'variant') {
          changeType = 'VARIANT_CHANGE';
          proposedPrice = Number(originalPrice) + (mod.variantPriceModifier ?? 0);
          proposedVariantOption = mod.variantOptionLabel ?? mod.variantOptionIndex?.toString() ?? null;
        } else if (mod.type === 'split') {
          changeType = 'SPLIT';
        }

        return {
          proposal_id: proposal.id,
          variant_item_id: itemId,
          original_dish_id: variantItem?.dishes?.id ?? null,
          proposed_dish_id: proposedDishId,
          change_type: changeType,
          original_price: Number(originalPrice),
          proposed_price: proposedPrice,
          original_quantity: originalQty,
          proposed_quantity: originalQty,
          proposed_variant_option: proposedVariantOption,
          split_details: mod.type === 'split' ? { percent: mod.splitPercent, splitDishId: mod.splitDishId, splitDishName: mod.splitDishName } : null,
          status: 'pending' as const,
        };
      });

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('proposal_items')
          .insert(items);

        if (itemsError) {
          // Cleanup orphaned proposal record
          await supabase
            .from('change_proposals')
            .delete()
            .eq('id', proposal.id);
          throw itemsError;
        }
      }

      // Update offer status to revision
      const { error: updateError } = await supabase
        .from('offers')
        .update({ status: 'revision' as const })
        .eq('id', offerId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['public-offer'] });
    },
  });
};

export const useAcceptOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, variantId, peopleCount }: { offerId: string; variantId: string | null; peopleCount?: number }) => {
      const { error } = await supabase
        .from('offers')
        .update({
          accepted_at: new Date().toISOString(),
          status: 'accepted' as const,
          accepted_variant_id: variantId,
          ...(peopleCount != null && peopleCount >= 1 ? { people_count: peopleCount } : {}),
        })
        .eq('id', offerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-offer'] });
    },
  });
};

export const useSubmitCorrection = () => {
  return useMutation({
    mutationFn: async ({ offerId, message, clientName }: { offerId: string; message: string; clientName?: string }) => {
      const { error } = await supabase
        .from('offer_corrections')
        .insert({
          offer_id: offerId,
          message,
          client_name: clientName || null,
        });

      if (error) throw error;
    },
  });
};

export const useOfferTerms = () => {
  return useQuery({
    queryKey: ['offer-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_terms')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useSaveDraftProposal = () => {
  return useMutation({
    mutationFn: async ({ offerId, modifications, clientMessage }: { offerId: string; modifications: Map<string, DishModification>; clientMessage?: string }) => {
      if (modifications.size === 0) return;

      // Check if draft exists
      const { data: existing } = await supabase
        .from('change_proposals')
        .select('id')
        .eq('offer_id', offerId)
        .eq('status', 'draft_client')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('change_proposals')
          .update({ client_message: clientMessage || null })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('change_proposals')
          .insert({
            offer_id: offerId,
            client_message: clientMessage || null,
            status: 'draft_client',
          });
      }
    },
  });
};
