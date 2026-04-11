import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyInfo } from './use-company-info';
import { useOfferTerms, usePublicOffer } from './use-public-offer';
import type { PublicOffer } from './use-public-offer';
import type { PrintCompanyInfo } from '@/components/print/OfferPrintDocument';

// Authenticated: fetch by offer ID
export const useOfferPrintData = (offerId: string | undefined) => {
  const offerQuery = useQuery({
    queryKey: ['offer-print', offerId],
    queryFn: async (): Promise<PublicOffer | null> => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          clients(*),
          offer_themes(*),
          offer_variants!offer_variants_offer_id_fkey(
            *,
            variant_items!variant_items_variant_id_fkey(
              *,
              dishes(*, dish_categories(*), dish_photos(*))
            )
          ),
          offer_services(
            *,
            services(*)
          )
        `)
        .eq('id', offerId)
        .maybeSingle();
      if (error) throw error;
      return data as PublicOffer | null;
    },
    enabled: !!offerId,
  });

  const companyInfoQuery = useCompanyInfo();
  const termsQuery = useOfferTerms();

  const upsellQuery = useQuery({
    queryKey: ['offer-upsells', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_upsell_selections')
        .select('*')
        .eq('offer_id', offerId)
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });

  return {
    offer: offerQuery.data ?? null,
    companyInfo: companyInfoQuery.data as PrintCompanyInfo | null,
    offerTerms: termsQuery.data ?? [],
    upsellSelections: upsellQuery.data ?? [],
    isLoading: offerQuery.isLoading || companyInfoQuery.isLoading || termsQuery.isLoading,
    error: offerQuery.error || companyInfoQuery.error || termsQuery.error,
  };
};

// Public: fetch by token
export const useOfferPrintDataByToken = (publicToken: string | undefined) => {
  const offerQuery = usePublicOffer(publicToken);
  const companyInfoQuery = useCompanyInfo();
  const termsQuery = useOfferTerms();

  const upsellQuery = useQuery({
    queryKey: ['offer-upsells-public', offerQuery.data?.id],
    queryFn: async () => {
      if (!offerQuery.data?.id) return [];
      const { data, error } = await supabase
        .from('offer_upsell_selections')
        .select('*')
        .eq('offer_id', offerQuery.data.id)
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerQuery.data?.id,
  });

  return {
    offer: offerQuery.data ?? null,
    companyInfo: companyInfoQuery.data as PrintCompanyInfo | null,
    offerTerms: termsQuery.data ?? [],
    upsellSelections: upsellQuery.data ?? [],
    isLoading: offerQuery.isLoading || companyInfoQuery.isLoading || termsQuery.isLoading,
    error: offerQuery.error || companyInfoQuery.error || termsQuery.error,
  };
};
