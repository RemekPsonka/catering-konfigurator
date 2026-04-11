import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

interface KpiCounts {
  draft: number;
  sent: number;
  viewed: number;
  revision: number;
  accepted: number;
  won: number;
}

interface ExpiringOffer {
  id: string;
  offer_number: string | null;
  valid_until: string | null;
  clients: { name: string } | null;
}

export const useDashboardKpi = () =>
  useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: async (): Promise<KpiCounts> => {
      const { data, error } = await supabase
        .from('offers')
        .select('status')
        .in('status', ['draft', 'sent', 'viewed', 'revision', 'accepted', 'won']);
      if (error) throw error;
      const counts: KpiCounts = { draft: 0, sent: 0, viewed: 0, revision: 0, accepted: 0, won: 0 };
      data?.forEach((r) => {
        const s = r.status as keyof KpiCounts;
        if (s in counts) counts[s]++;
      });
      return counts;
    },
  });

export const useNewCorrectionsCount = () =>
  useQuery({
    queryKey: ['dashboard-corrections-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('offer_corrections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new');
      if (error) throw error;
      return count ?? 0;
    },
  });

export const useExpiringOffers = () =>
  useQuery({
    queryKey: ['dashboard-expiring'],
    queryFn: async (): Promise<ExpiringOffer[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('offers')
        .select('id, offer_number, valid_until, clients(name)')
        .gte('valid_until', today)
        .lte('valid_until', in7)
        .in('status', ['sent', 'viewed', 'revision'])
        .order('valid_until', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExpiringOffer[];
    },
  });

export const useDashboardActivity = () =>
  useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('event_type', [
          'offer_viewed',
          'proposal_submitted',
          'correction_submitted',
          'question_submitted',
          'offer_accepted',
        ])
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Tables<'notifications'>[];
    },
  });

export const useManagerName = () =>
  useQuery({
    queryKey: ['dashboard-manager-name'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_setting', { p_key: 'manager_name' });
      if (error) throw error;
      return (data as string) ?? '';
    },
    staleTime: 5 * 60 * 1000,
  });

// ── Follow-ups ──

interface FollowUpRow {
  id: string;
  offer_id: string;
  step_name: string;
  sequence_step: number;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  offers: { offer_number: string | null } | null;
}

export const useFollowUps = () =>
  useQuery({
    queryKey: ['dashboard-follow-ups'],
    queryFn: async (): Promise<FollowUpRow[]> => {
      const { data, error } = await supabase
        .from('offer_follow_ups')
        .select('id, offer_id, step_name, sequence_step, status, scheduled_at, sent_at, offers(offer_number)')
        .in('status', ['scheduled', 'sent'])
        .order('scheduled_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as FollowUpRow[];
    },
  });

export const useCancelFollowUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('offer_follow_ups')
        .update({ status: 'cancelled' as never })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-follow-ups'] });
    },
  });
};
