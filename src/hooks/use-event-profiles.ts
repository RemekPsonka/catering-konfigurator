import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

const MAX_PHOTOS = 15;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type EventProfile = Tables<'event_type_profiles'> & { photo_count: number };

export const useEventProfiles = () =>
  useQuery({
    queryKey: ['event-profiles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('event_type_profiles')
        .select('*')
        .order('id');
      if (error) throw error;

      const { data: counts, error: cErr } = await supabase
        .from('event_type_photos')
        .select('event_type_id');
      if (cErr) throw cErr;

      const countMap: Record<string, number> = {};
      counts?.forEach((r) => {
        countMap[r.event_type_id] = (countMap[r.event_type_id] ?? 0) + 1;
      });

      return (profiles ?? []).map((p) => ({
        ...p,
        photo_count: countMap[p.id] ?? 0,
      })) as EventProfile[];
    },
  });

export const useEventProfile = (id: string | undefined) =>
  useQuery({
    queryKey: ['event-profile', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('event_type_profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useUpdateEventProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'event_type_profiles'> }) => {
      const { error } = await supabase
        .from('event_type_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['event-profile', id] });
      qc.invalidateQueries({ queryKey: ['event-profiles'] });
      toast.success('Profil zapisany');
    },
    onError: () => toast.error('Nie udało się zapisać profilu'),
  });
};

export const useToggleEventProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('event_type_profiles')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-profiles'] });
    },
  });
};

// --- Photos ---

export const useEventPhotos = (eventTypeId: string | undefined) =>
  useQuery({
    queryKey: ['event-photos', eventTypeId],
    queryFn: async () => {
      if (!eventTypeId) return [];
      const { data, error } = await supabase
        .from('event_type_photos')
        .select('*')
        .eq('event_type_id', eventTypeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Tables<'event_type_photos'>[];
    },
    enabled: !!eventTypeId,
  });

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });

const getStoragePath = (photoUrl: string): string => {
  const url = new URL(photoUrl);
  const match = url.pathname.match(/\/object\/public\/event-photos\/(.+)$/);
  return match ? match[1] : '';
};

export const useUploadEventPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventTypeId, file }: { eventTypeId: string; file: File }) => {
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Dozwolone formaty: JPEG, PNG, WebP');
      if (file.size > MAX_FILE_SIZE) throw new Error('Maksymalny rozmiar pliku: 10MB');

      const existing = await supabase
        .from('event_type_photos')
        .select('id', { count: 'exact' })
        .eq('event_type_id', eventTypeId);
      if ((existing.count ?? 0) >= MAX_PHOTOS) throw new Error(`Maksymalnie ${MAX_PHOTOS} zdjęć`);

      const { width, height } = await getImageDimensions(file);
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${eventTypeId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from('event-photos').upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('event-photos').getPublicUrl(path);

      const { data: photo, error: insErr } = await supabase
        .from('event_type_photos')
        .insert({
          event_type_id: eventTypeId,
          photo_url: urlData.publicUrl,
          width,
          height,
          sort_order: existing.count ?? 0,
        })
        .select()
        .single();
      if (insErr) throw insErr;
      return photo;
    },
    onSuccess: (_, { eventTypeId }) => {
      qc.invalidateQueries({ queryKey: ['event-photos', eventTypeId] });
      qc.invalidateQueries({ queryKey: ['event-profiles'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Nie udało się przesłać zdjęcia'),
  });
};

export const useDeleteEventPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photo }: { photo: Tables<'event_type_photos'> }) => {
      const storagePath = getStoragePath(photo.photo_url);
      if (storagePath) await supabase.storage.from('event-photos').remove([storagePath]);
      const { error } = await supabase.from('event_type_photos').delete().eq('id', photo.id);
      if (error) throw error;

      if (photo.is_hero) {
        await supabase
          .from('event_type_profiles')
          .update({ hero_image_url: null })
          .eq('id', photo.event_type_id);
      }
    },
    onSuccess: (_, { photo }) => {
      qc.invalidateQueries({ queryKey: ['event-photos', photo.event_type_id] });
      qc.invalidateQueries({ queryKey: ['event-profiles'] });
      qc.invalidateQueries({ queryKey: ['event-profile', photo.event_type_id] });
      toast.success('Zdjęcie usunięte');
    },
    onError: () => toast.error('Nie udało się usunąć zdjęcia'),
  });
};

export const useSetHeroPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, eventTypeId, photoUrl }: { photoId: string; eventTypeId: string; photoUrl: string }) => {
      await supabase.from('event_type_photos').update({ is_hero: false }).eq('event_type_id', eventTypeId);
      const { error } = await supabase.from('event_type_photos').update({ is_hero: true }).eq('id', photoId);
      if (error) throw error;
      await supabase.from('event_type_profiles').update({ hero_image_url: photoUrl }).eq('id', eventTypeId);
    },
    onSuccess: (_, { eventTypeId }) => {
      qc.invalidateQueries({ queryKey: ['event-photos', eventTypeId] });
      qc.invalidateQueries({ queryKey: ['event-profile', eventTypeId] });
      toast.success('Zdjęcie hero ustawione');
    },
    onError: () => toast.error('Nie udało się ustawić zdjęcia hero'),
  });
};

export const useUpdateEventPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, caption, altText, eventTypeId }: { id: string; caption: string | null; altText: string | null; eventTypeId: string }) => {
      const { error } = await supabase
        .from('event_type_photos')
        .update({ caption, alt_text: altText })
        .eq('id', id);
      if (error) throw error;
      return eventTypeId;
    },
    onSuccess: (eventTypeId) => {
      qc.invalidateQueries({ queryKey: ['event-photos', eventTypeId] });
    },
  });
};

export const useUpdateEventPhotoTags = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tags, eventTypeId }: { id: string; tags: string[]; eventTypeId: string }) => {
      const { error } = await supabase
        .from('event_type_photos')
        .update({ tags })
        .eq('id', id);
      if (error) throw error;
      return eventTypeId;
    },
    onSuccess: (eventTypeId) => {
      qc.invalidateQueries({ queryKey: ['event-photos', eventTypeId] });
    },
  });
};

export const useReorderEventPhotos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photos, eventTypeId }: { photos: { id: string; sort_order: number }[]; eventTypeId: string }) => {
      await Promise.all(
        photos.map((p) =>
          supabase.from('event_type_photos').update({ sort_order: p.sort_order }).eq('id', p.id),
        ),
      );
      return eventTypeId;
    },
    onSuccess: (eventTypeId) => {
      qc.invalidateQueries({ queryKey: ['event-photos', eventTypeId] });
    },
  });
};
