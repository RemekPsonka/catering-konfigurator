import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type PublicEventProfile = Tables<'event_type_profiles'>;
export type PublicEventPhoto = Tables<'event_type_photos'>;

export const usePublicEventProfile = (eventType: string | undefined) =>
  useQuery({
    queryKey: ['public-event-profile', eventType],
    queryFn: async () => {
      if (!eventType) return null;
      const { data, error } = await supabase
        .from('event_type_profiles')
        .select('*')
        .eq('id', eventType)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as PublicEventProfile | null;
    },
    enabled: !!eventType,
  });

export const usePublicEventPhotos = (eventType: string | undefined) =>
  useQuery({
    queryKey: ['public-event-photos', eventType],
    queryFn: async () => {
      if (!eventType) return [];
      const { data, error } = await supabase
        .from('event_type_photos')
        .select('*')
        .eq('event_type_id', eventType)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PublicEventPhoto[];
    },
    enabled: !!eventType,
  });
