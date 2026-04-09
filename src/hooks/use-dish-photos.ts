import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const useDishPhotos = (dishId: string | undefined) => {
  return useQuery({
    queryKey: ['dish-photos', dishId],
    queryFn: async () => {
      if (!dishId) return [];
      const { data, error } = await supabase
        .from('dish_photos')
        .select('*')
        .eq('dish_id', dishId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Tables<'dish_photos'>[];
    },
    enabled: !!dishId,
  });
};

const syncPrimaryUrl = async (dishId: string, photoUrl: string | null) => {
  const { error } = await supabase
    .from('dishes')
    .update({ photo_url: photoUrl })
    .eq('id', dishId);
  if (error) throw error;
};

const getStoragePath = (photoUrl: string): string => {
  const url = new URL(photoUrl);
  const match = url.pathname.match(/\/object\/public\/dish-photos\/(.+)$/);
  return match ? match[1] : '';
};

export const useUploadDishPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dishId, file }: { dishId: string; file: File }) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Dozwolone formaty: JPEG, PNG, WebP');
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Maksymalny rozmiar pliku: 5MB');
      }

      const existing = await supabase
        .from('dish_photos')
        .select('id', { count: 'exact' })
        .eq('dish_id', dishId);
      if ((existing.count ?? 0) >= MAX_PHOTOS) {
        throw new Error(`Maksymalnie ${MAX_PHOTOS} zdjęć na danie`);
      }

      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${dishId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('dish-photos')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('dish-photos')
        .getPublicUrl(path);

      const isFirst = (existing.count ?? 0) === 0;
      const { data: photo, error: insertError } = await supabase
        .from('dish_photos')
        .insert({
          dish_id: dishId,
          photo_url: urlData.publicUrl,
          sort_order: (existing.count ?? 0),
          is_primary: isFirst,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      if (isFirst) {
        await syncPrimaryUrl(dishId, urlData.publicUrl);
        queryClient.invalidateQueries({ queryKey: ['dish'] });
      }

      return photo;
    },
    onSuccess: (_, { dishId }) => {
      queryClient.invalidateQueries({ queryKey: ['dish-photos', dishId] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Nie udało się przesłać zdjęcia');
    },
  });
};

export const useDeleteDishPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ photo, dishId }: { photo: Tables<'dish_photos'>; dishId: string }) => {
      const storagePath = getStoragePath(photo.photo_url);
      if (storagePath) {
        await supabase.storage.from('dish-photos').remove([storagePath]);
      }

      const { error } = await supabase
        .from('dish_photos')
        .delete()
        .eq('id', photo.id);
      if (error) throw error;

      if (photo.is_primary) {
        const { data: remaining } = await supabase
          .from('dish_photos')
          .select('*')
          .eq('dish_id', dishId)
          .order('sort_order', { ascending: true })
          .limit(1);

        if (remaining && remaining.length > 0) {
          await supabase
            .from('dish_photos')
            .update({ is_primary: true })
            .eq('id', remaining[0].id);
          await syncPrimaryUrl(dishId, remaining[0].photo_url);
        } else {
          await syncPrimaryUrl(dishId, null);
        }
      }
    },
    onSuccess: (_, { dishId }) => {
      queryClient.invalidateQueries({ queryKey: ['dish-photos', dishId] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dish'] });
      toast.success('Zdjęcie usunięte');
    },
    onError: () => {
      toast.error('Nie udało się usunąć zdjęcia');
    },
  });
};

export const useSetPrimaryPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ photoId, dishId, photoUrl }: { photoId: string; dishId: string; photoUrl: string }) => {
      await supabase
        .from('dish_photos')
        .update({ is_primary: false })
        .eq('dish_id', dishId);

      const { error } = await supabase
        .from('dish_photos')
        .update({ is_primary: true })
        .eq('id', photoId);
      if (error) throw error;

      await syncPrimaryUrl(dishId, photoUrl);
    },
    onSuccess: (_, { dishId }) => {
      queryClient.invalidateQueries({ queryKey: ['dish-photos', dishId] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dish'] });
      toast.success('Zdjęcie główne ustawione');
    },
    onError: () => {
      toast.error('Nie udało się ustawić zdjęcia głównego');
    },
  });
};

export const useReorderPhotos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ photos, dishId }: { photos: { id: string; sort_order: number }[]; dishId: string }) => {
      const updates = photos.map((p) =>
        supabase
          .from('dish_photos')
          .update({ sort_order: p.sort_order })
          .eq('id', p.id)
      );
      await Promise.all(updates);
      return dishId;
    },
    onSuccess: (dishId) => {
      queryClient.invalidateQueries({ queryKey: ['dish-photos', dishId] });
    },
  });
};
