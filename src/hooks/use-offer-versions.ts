import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfferVersion {
  id: string;
  version_number: number;
  change_summary: string | null;
  changed_by: string;
  created_at: string | null;
}

export const useOfferVersions = (offerId: string | null | undefined) => {
  return useQuery({
    queryKey: ['offer-versions', offerId],
    queryFn: async (): Promise<OfferVersion[]> => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_versions')
        .select('id, version_number, change_summary, changed_by, created_at')
        .eq('offer_id', offerId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
};
