import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { toast } from 'sonner';

export interface OfferWithClient extends Tables<'offers'> {
  clients: { name: string } | null;
  offer_variants: { id: string; name: string }[] | null;
}

export interface OfferFilters {
  status?: string;
  eventType?: string;
  search?: string;
  page: number;
}

export const useOffers = (filters: OfferFilters) => {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: async () => {
      const from = (filters.page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('offers')
        .select('*, clients(name), offer_variants!offer_variants_offer_id_fkey(id, name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as Tables<'offers'>['status']);
      }

      if (filters.eventType && filters.eventType !== 'all') {
        query = query.eq('event_type', filters.eventType as Tables<'offers'>['event_type']);
      }

      if (filters.search) {
        query = query.ilike('offer_number', `%${filters.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const results = data as unknown as OfferWithClient[];

      // If searching and no results by offer_number, also try client name filter in JS
      if (filters.search && results.length === 0) {
        let fallbackQuery = supabase
          .from('offers')
          .select('*, clients(name), offer_variants!offer_variants_offer_id_fkey(id, name)')
          .order('created_at', { ascending: false });

        if (filters.status && filters.status !== 'all') {
          fallbackQuery = fallbackQuery.eq('status', filters.status as Tables<'offers'>['status']);
        }
        if (filters.eventType && filters.eventType !== 'all') {
          fallbackQuery = fallbackQuery.eq('event_type', filters.eventType as Tables<'offers'>['event_type']);
        }

        const { data: allData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;

        const searchLower = filters.search.toLowerCase();
        const filtered = (allData as unknown as OfferWithClient[]).filter(
          (o) => o.clients?.name?.toLowerCase().includes(searchLower)
        );
        return { offers: filtered.slice(from, to + 1), total: filtered.length };
      }

      return { offers: results, total: count ?? 0 };
    },
  });
};

export const useDuplicateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      // 1. Fetch original offer
      const { data: original, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();
      if (offerError) throw offerError;

      // 2. Fetch variants
      const { data: variants, error: varError } = await supabase
        .from('offer_variants')
        .select('*')
        .eq('offer_id', offerId);
      if (varError) throw varError;

      // 3. Fetch variant items
      const variantIds = (variants ?? []).map((v) => v.id);
      let variantItems: Tables<'variant_items'>[] = [];
      if (variantIds.length > 0) {
        const { data, error } = await supabase
          .from('variant_items')
          .select('*')
          .in('variant_id', variantIds);
        if (error) throw error;
        variantItems = data ?? [];
      }

      // 4. Fetch offer services
      const { data: services, error: svcError } = await supabase
        .from('offer_services')
        .select('*')
        .eq('offer_id', offerId);
      if (svcError) throw svcError;

      // 5. Create new offer (draft, cleared dates)
      const { data: newOffer, error: insertError } = await supabase
        .from('offers')
        .insert({
          client_id: original.client_id,
          event_type: original.event_type,
          delivery_type: original.delivery_type,
          people_count: original.people_count,
          pricing_mode: original.pricing_mode,
          price_display_mode: original.price_display_mode,
          created_by: original.created_by,
          status: 'draft',
          greeting_text: original.greeting_text,
          notes_client: original.notes_client,
          theme_id: original.theme_id,
          validity_days: original.validity_days,
          discount_percent: original.discount_percent,
          discount_value: original.discount_value,
          delivery_cost: original.delivery_cost,
          min_offer_price: original.min_offer_price,
          is_people_count_editable: original.is_people_count_editable,
          event_location: original.event_location,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // 6. Duplicate variants + items
      const variantIdMap = new Map<string, string>();
      for (const v of variants ?? []) {
        const { data: newVar, error: nvErr } = await supabase
          .from('offer_variants')
          .insert({
            offer_id: newOffer.id,
            name: v.name,
            description: v.description,
            is_recommended: v.is_recommended,
            sort_order: v.sort_order,
            total_value: v.total_value,
            price_per_person: v.price_per_person,
          })
          .select()
          .single();
        if (nvErr) throw nvErr;
        variantIdMap.set(v.id, newVar.id);
      }

      // 7. Duplicate variant items
      const itemInserts = variantItems.map((item) => ({
        variant_id: variantIdMap.get(item.variant_id) ?? item.variant_id,
        dish_id: item.dish_id,
        quantity: item.quantity,
        custom_price: item.custom_price,
        custom_name: item.custom_name,
        notes: item.notes,
        sort_order: item.sort_order,
        is_client_editable: item.is_client_editable,
        selected_variant_option: item.selected_variant_option,
        allowed_modifications: item.allowed_modifications,
      }));
      if (itemInserts.length > 0) {
        const { error: itemErr } = await supabase
          .from('variant_items')
          .insert(itemInserts);
        if (itemErr) throw itemErr;
      }

      // 8. Duplicate services
      const svcInserts = (services ?? []).map((s) => ({
        offer_id: newOffer.id,
        service_id: s.service_id,
        quantity: s.quantity,
        custom_price: s.custom_price,
        notes: s.notes,
      }));
      if (svcInserts.length > 0) {
        const { error: svcInsertErr } = await supabase
          .from('offer_services')
          .insert(svcInserts);
        if (svcInsertErr) throw svcInsertErr;
      }

      return newOffer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Oferta zduplikowana! Uzupełnij klienta i daty.');
    },
    onError: () => {
      toast.error('Nie udało się zduplikować oferty');
    },
  });
};
