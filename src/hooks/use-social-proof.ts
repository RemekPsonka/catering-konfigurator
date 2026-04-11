import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type CompanyStat = Tables<'company_stats'>['Row'];
type Testimonial = Tables<'testimonials'>['Row'];

export const useCompanyStats = () =>
  useQuery({
    queryKey: ['company-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_stats')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as CompanyStat[];
    },
  });

export const useAllCompanyStats = () =>
  useQuery({
    queryKey: ['company-stats-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_stats')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as CompanyStat[];
    },
  });

export const useUpdateStat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stat: Partial<CompanyStat> & { id: string }) => {
      const { id, ...rest } = stat;
      const { error } = await supabase.from('company_stats').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-stats'] });
      qc.invalidateQueries({ queryKey: ['company-stats-all'] });
      toast.success('Statystyka zaktualizowana');
    },
    onError: () => toast.error('Nie udało się zaktualizować statystyki'),
  });
};

export const useTestimonials = (eventType?: string) =>
  useQuery({
    queryKey: ['testimonials', eventType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      const all = data as Testimonial[];
      if (!eventType) return all.slice(0, 3);

      const matched = all.filter((t) => t.event_type === eventType);
      const global = all.filter((t) => !t.event_type || t.event_type !== eventType);
      const result = [...matched];
      for (const t of global) {
        if (result.length >= 3) break;
        result.push(t);
      }
      return result.slice(0, 3);
    },
  });

export const useAllTestimonials = () =>
  useQuery({
    queryKey: ['testimonials-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Testimonial[];
    },
  });

export const useCreateTestimonial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<Testimonial, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('testimonials').insert(t);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      qc.invalidateQueries({ queryKey: ['testimonials-all'] });
      toast.success('Opinia dodana');
    },
    onError: () => toast.error('Nie udało się dodać opinii'),
  });
};

export const useUpdateTestimonial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<Testimonial> & { id: string }) => {
      const { id, ...rest } = t;
      const { error } = await supabase.from('testimonials').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      qc.invalidateQueries({ queryKey: ['testimonials-all'] });
      toast.success('Opinia zaktualizowana');
    },
    onError: () => toast.error('Nie udało się zaktualizować opinii'),
  });
};

export const useDeleteTestimonial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials'] });
      qc.invalidateQueries({ queryKey: ['testimonials-all'] });
      toast.success('Opinia usunięta');
    },
    onError: () => toast.error('Nie udało się usunąć opinii'),
  });
};
