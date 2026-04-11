import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HotOffer {
  id: string;
  offer_number: string | null;
  event_type: string;
  conversion_score: number | null;
  last_client_activity_at: string | null;
  total_value: number | null;
  clients: { name: string } | null;
}

export const useHotOffers = () =>
  useQuery({
    queryKey: ['hot-offers'],
    queryFn: async (): Promise<HotOffer[]> => {
      const { data, error } = await supabase
        .from('offers')
        .select('id, offer_number, event_type, conversion_score, last_client_activity_at, total_value, clients(name)')
        .in('status', ['sent', 'viewed', 'revision'])
        .gt('conversion_score', 0)
        .order('conversion_score', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as HotOffer[];
    },
    refetchInterval: 60_000,
  });
