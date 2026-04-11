import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { MAX_PHOTO_SIZE_MB } from '@/lib/app-limits';

export type LibraryPhoto = Tables<'photo_library'>;

export const usePhotoLibrary = (eventType?: string) =>
  useQuery({
    queryKey: ['photo-library', eventType ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('photo_library')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (eventType) {
        query = query.contains('event_tags', [eventType]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as LibraryPhoto[];
    },
  });

export const useHeroPhoto = (eventType: string | undefined) =>
  useQuery({
    queryKey: ['photo-library-hero', eventType],
    queryFn: async () => {
      if (!eventType) return null;
      const { data, error } = await supabase
        .from('photo_library')
        .select('*')
        .contains('hero_for_events', [eventType])
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as LibraryPhoto | null;
    },
    enabled: !!eventType,
  });

export const useEventPhotoStats = () =>
  useQuery({
    queryKey: ['photo-library-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_library')
        .select('event_tags')
        .eq('is_active', true);
      if (error) throw error;

      const counts: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        (row.event_tags ?? []).forEach((tag) => {
          counts[tag] = (counts[tag] ?? 0) + 1;
        });
      });
      return counts;
    },
  });

export const useUploadLibraryPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, eventTags, contentTags }: { file: File; eventTags?: string[]; contentTags?: string[] }) => {
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        throw new Error(`Plik przekracza ${MAX_PHOTO_SIZE_MB}MB`);
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;

      // Get dimensions
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 800, height: 600 });
        img.src = URL.createObjectURL(file);
      });

      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(path, file, { cacheControl: '31536000' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('event-photos').getPublicUrl(path);

      const { error: insertError } = await supabase.from('photo_library').insert({
        photo_url: urlData.publicUrl,
        width: dims.width,
        height: dims.height,
        event_tags: eventTags ?? [],
        content_tags: contentTags ?? [],
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-library'] });
      qc.invalidateQueries({ queryKey: ['photo-library-stats'] });
      toast.success('Zdjęcie dodane');
    },
    onError: (e) => toast.error(e.message ?? 'Nie udało się dodać zdjęcia'),
  });
};

export const useUpdateLibraryPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<LibraryPhoto, 'caption' | 'alt_text' | 'event_tags' | 'content_tags' | 'hero_for_events' | 'sort_order' | 'is_active'>>;
    }) => {
      const { error } = await supabase.from('photo_library').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-library'] });
      qc.invalidateQueries({ queryKey: ['photo-library-hero'] });
      qc.invalidateQueries({ queryKey: ['photo-library-stats'] });
    },
    onError: () => toast.error('Nie udało się zaktualizować zdjęcia'),
  });
};

export const useBulkAddEventTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoIds, eventTag }: { photoIds: string[]; eventTag: string }) => {
      for (const id of photoIds) {
        const { data: photo } = await supabase.from('photo_library').select('event_tags').eq('id', id).single();
        if (!photo) continue;
        const tags = photo.event_tags ?? [];
        if (!tags.includes(eventTag)) {
          await supabase.from('photo_library').update({ event_tags: [...tags, eventTag] }).eq('id', id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-library'] });
      qc.invalidateQueries({ queryKey: ['photo-library-stats'] });
      toast.success('Tagi zaktualizowane');
    },
    onError: () => toast.error('Nie udało się zaktualizować tagów'),
  });
};

export const useDeleteLibraryPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: LibraryPhoto) => {
      // Extract filename from URL for storage deletion
      const urlParts = photo.photo_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        await supabase.storage.from('event-photos').remove([fileName]);
      }
      const { error } = await supabase.from('photo_library').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['photo-library'] });
      qc.invalidateQueries({ queryKey: ['photo-library-hero'] });
      qc.invalidateQueries({ queryKey: ['photo-library-stats'] });
      toast.success('Zdjęcie usunięte');
    },
    onError: () => toast.error('Nie udało się usunąć zdjęcia'),
  });
};
