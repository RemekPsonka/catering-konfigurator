import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Tables, TablesInsert, Json } from '@/integrations/supabase/types';

export interface TemplateData {
  variants: Array<{
    name: string;
    description: string | null;
    is_recommended: boolean;
    sort_order: number;
    items: Array<{
      dish_id: string;
      quantity: number;
      custom_price: number | null;
      custom_name: string | null;
      sort_order: number;
      is_client_editable: boolean;
      allowed_modifications: unknown;
      selected_variant_option: string | null;
    }>;
  }>;
  services: Array<{
    service_id: string;
    quantity: number;
    custom_price: number | null;
    notes: string | null;
  }>;
  settings: {
    price_display_mode: string;
    is_people_count_editable: boolean;
    min_offer_price: number | null;
    theme_id: string | null;
    greeting_text: string | null;
    notes_client: string | null;
    discount_percent: number;
    discount_value: number;
    delivery_cost: number;
  };
  pricing_mode: string;
}

export const useOfferTemplates = (filterEventType?: string) => {
  return useQuery({
    queryKey: ['offer-templates', filterEventType],
    queryFn: async () => {
      let query = supabase
        .from('offer_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterEventType && filterEventType !== 'all') {
        query = query.eq('event_type', filterEventType as Tables<'offer_templates'>['event_type']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useSaveAsTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ offerId, name, description }: { offerId: string; name: string; description: string }) => {
      if (!user) throw new Error('Nie jesteś zalogowany');

      // Fetch offer
      const { data: offer, error: offerErr } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();
      if (offerErr) throw offerErr;

      // Fetch variants with items
      const { data: variants, error: varErr } = await supabase
        .from('offer_variants')
        .select('*, variant_items(*)')
        .eq('offer_id', offerId)
        .order('sort_order');
      if (varErr) throw varErr;

      // Fetch services
      const { data: services, error: svcErr } = await supabase
        .from('offer_services')
        .select('*')
        .eq('offer_id', offerId);
      if (svcErr) throw svcErr;

      const templateData: TemplateData = {
        variants: (variants ?? []).map((v) => ({
          name: v.name,
          description: v.description,
          is_recommended: v.is_recommended ?? false,
          sort_order: v.sort_order ?? 0,
          items: ((v as { variant_items: Tables<'variant_items'>[] }).variant_items ?? []).map((item) => ({
            dish_id: item.dish_id,
            quantity: item.quantity ?? 1,
            custom_price: item.custom_price ? Number(item.custom_price) : null,
            custom_name: item.custom_name,
            sort_order: item.sort_order ?? 0,
            is_client_editable: item.is_client_editable ?? false,
            allowed_modifications: item.allowed_modifications,
            selected_variant_option: item.selected_variant_option,
          })),
        })),
        services: (services ?? []).map((s) => ({
          service_id: s.service_id,
          quantity: s.quantity ?? 1,
          custom_price: s.custom_price ? Number(s.custom_price) : null,
          notes: s.notes,
        })),
        settings: {
          price_display_mode: offer.price_display_mode,
          is_people_count_editable: offer.is_people_count_editable ?? false,
          min_offer_price: offer.min_offer_price ? Number(offer.min_offer_price) : null,
          theme_id: offer.theme_id,
          greeting_text: offer.greeting_text,
          notes_client: offer.notes_client,
          discount_percent: Number(offer.discount_percent ?? 0),
          discount_value: Number(offer.discount_value ?? 0),
          delivery_cost: Number(offer.delivery_cost ?? 0),
        },
        pricing_mode: offer.pricing_mode,
      };

      const { data, error } = await supabase
        .from('offer_templates')
        .insert({
          name,
          description: description || null,
          event_type: offer.event_type,
          pricing_mode: offer.pricing_mode,
          template_data: templateData as Json,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      toast.success('Szablon zapisany pomyślnie');
    },
    onError: () => toast.error('Nie udało się zapisać szablonu'),
  });
};

export const useCreateFromTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('Nie jesteś zalogowany');

      const { data: template, error: tplErr } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (tplErr) throw tplErr;

      const td = template.template_data as TemplateData;

      // We need a client_id — create a placeholder by picking first client
      // Actually, template creates offer without client — user must fill in step 1
      // But client_id is NOT NULL... we need to handle this in the wizard
      // For now, we'll return the template data and let the wizard handle it
      // Instead, insert offer with a dummy approach — but client_id is required
      // Solution: return template data for the wizard to use
      return { template, templateData: td };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
    onError: () => toast.error('Nie udało się utworzyć oferty z szablonu'),
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      const { error } = await supabase
        .from('offer_templates')
        .update({ name, description: description || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      toast.success('Szablon zaktualizowany');
    },
    onError: () => toast.error('Nie udało się zaktualizować szablonu'),
  });
};

export const useToggleTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('offer_templates')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      toast.success('Status szablonu zmieniony');
    },
    onError: () => toast.error('Nie udało się zmienić statusu szablonu'),
  });
};
