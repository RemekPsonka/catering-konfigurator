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

// Historical: fetch from snapshot
export const useOfferPrintDataFromSnapshot = (
  offerId: string | undefined,
  versionNumber: number | undefined,
) => {
  const companyInfoQuery = useCompanyInfo();

  const snapshotQuery = useQuery({
    queryKey: ['offer-version-snapshot', offerId, versionNumber],
    queryFn: async () => {
      if (!offerId || !versionNumber) return null;
      const { data, error } = await supabase
        .from('offer_versions')
        .select('snapshot')
        .eq('offer_id', offerId)
        .eq('version_number', versionNumber)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const snap = data.snapshot as Record<string, unknown>;
      const offerData = snap.offer as Record<string, unknown>;
      const variants = (snap.variants as unknown[]) ?? [];
      const items = (snap.items as unknown[]) ?? [];
      const services = (snap.services as unknown[]) ?? [];
      const client = snap.client as Record<string, unknown> | null;
      const terms = (snap.terms as unknown[]) ?? [];

      // Reconstruct offer with nested relations
      const variantsWithItems = variants.map((v: unknown) => {
        const variant = v as Record<string, unknown>;
        const variantItems = items
          .filter((i: unknown) => (i as Record<string, unknown>).variant_id === variant.id)
          .map((i: unknown) => ({ ...(i as Record<string, unknown>), dishes: null }));
        return { ...variant, variant_items: variantItems };
      });

      const servicesWithDetails = services.map((s: unknown) => ({
        ...(s as Record<string, unknown>),
        services: null,
      }));

      const reconstructed = {
        ...offerData,
        current_version: versionNumber,
        clients: client,
        offer_themes: null,
        offer_variants: variantsWithItems,
        offer_services: servicesWithDetails,
      };

      return { offer: reconstructed as unknown as PublicOffer, terms };
    },
    enabled: !!offerId && !!versionNumber,
  });

  return {
    offer: snapshotQuery.data?.offer ?? null,
    companyInfo: companyInfoQuery.data as PrintCompanyInfo | null,
    offerTerms: (snapshotQuery.data?.terms ?? []) as Array<{ id: string; label: string; value: string }>,
    upsellSelections: [],
    isLoading: snapshotQuery.isLoading || companyInfoQuery.isLoading,
    error: snapshotQuery.error || companyInfoQuery.error,
  };
};
