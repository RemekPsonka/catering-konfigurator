import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type PublicOffer = Tables<'offers'> & {
  clients: Tables<'clients'>;
  offer_themes: Tables<'offer_themes'> | null;
  offer_variants: (Tables<'offer_variants'> & {
    variant_items: (Tables<'variant_items'> & {
      dishes: Tables<'dishes'> & {
        dish_categories: Tables<'dish_categories'>;
      };
    })[];
  })[];
  offer_services: (Tables<'offer_services'> & {
    services: Tables<'services'>;
  })[];
};

export const usePublicOffer = (publicToken: string | undefined) => {
  const query = useQuery({
    queryKey: ['public-offer', publicToken],
    queryFn: async (): Promise<PublicOffer | null> => {
      if (!publicToken) return null;

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          clients(*),
          offer_themes(*),
          offer_variants(
            *,
            variant_items(
              *,
              dishes(*, dish_categories(*))
            )
          ),
          offer_services(
            *,
            services(*)
          )
        `)
        .eq('public_token', publicToken)
        .in('status', ['sent', 'viewed', 'revision', 'accepted'])
        .maybeSingle();

      if (error) throw error;
      return data as PublicOffer | null;
    },
    enabled: !!publicToken,
  });

  return query;
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
