import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// ── Admin CRUD on global offer_terms ──

export const useOfferTermsAdmin = () => {
  return useQuery({
    queryKey: ['offer-terms-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_terms')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useAddTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (term: { key: string; label: string; value: string }) => {
      const { data: maxOrder } = await supabase
        .from('offer_terms')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = (maxOrder?.display_order ?? 0) + 1;

      const { error } = await supabase
        .from('offer_terms')
        .insert({ ...term, display_order: nextOrder, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offer-terms-admin'] }),
  });
};

export const useUpdateTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Tables<'offer_terms'>, 'label' | 'value' | 'is_active' | 'display_order'>>) => {
      const { error } = await supabase
        .from('offer_terms')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offer-terms-admin'] }),
  });
};

export const useDeleteTerm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('offer_terms')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offer-terms-admin'] }),
  });
};

export const useReorderTerms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; display_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase
          .from('offer_terms')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offer-terms-admin'] }),
  });
};

// ── Per-offer overrides ──

export const useOfferTermOverrides = (offerId: string | undefined) => {
  return useQuery({
    queryKey: ['offer-term-overrides', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_term_overrides')
        .select('*')
        .eq('offer_id', offerId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
};

export const useSaveTermOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, termId, value, isHidden }: { offerId: string; termId: string; value: string; isHidden: boolean }) => {
      const { error } = await supabase
        .from('offer_term_overrides')
        .upsert(
          { offer_id: offerId, term_id: termId, value, is_hidden: isHidden },
          { onConflict: 'offer_id,term_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['offer-term-overrides', vars.offerId] });
      qc.invalidateQueries({ queryKey: ['offer-terms'] });
    },
  });
};

export const useDeleteTermOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ offerId, termId }: { offerId: string; termId: string }) => {
      const { error } = await supabase
        .from('offer_term_overrides')
        .delete()
        .eq('offer_id', offerId)
        .eq('term_id', termId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['offer-term-overrides', vars.offerId] });
      qc.invalidateQueries({ queryKey: ['offer-terms'] });
    },
  });
};
