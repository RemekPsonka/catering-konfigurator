import { useCallback, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Star, Trash2, Loader2, ImagePlus } from 'lucide-react';
import {
  useDishPhotos,
  useUploadDishPhoto,
  useDeleteDishPhoto,
  useSetPrimaryPhoto,
  useReorderPhotos,
} from '@/hooks/use-dish-photos';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tables } from '@/integrations/supabase/types';

interface DishPhotosSectionProps {
  dishId: string;
}

const SortablePhoto = ({
  photo,
  dishId,
  onDelete,
  onSetPrimary,
}: {
  photo: Tables<'dish_photos'>;
  dishId: string;
  onDelete: (photo: Tables<'dish_photos'>) => void;
  onSetPrimary: (photo: Tables<'dish_photos'>) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${
        photo.is_primary ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-border'
      }`}
    >
      <img
        src={photo.photo_url}
        alt="Zdjęcie dania"
        className="h-full w-full object-cover"
        draggable={false}
      />
      {photo.is_primary && (
        <span className="absolute top-1.5 left-1.5 rounded bg-yellow-400 px-1.5 py-0.5 text-xs font-semibold text-yellow-900">
          Główne
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        {!photo.is_primary && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary(photo);
            }}
            title="Ustaw jako główne"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo);
          }}
          title="Usuń"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const DishPhotosSection = ({ dishId }: DishPhotosSectionProps) => {
  const { data: photos = [], isLoading } = useDishPhotos(dishId);
  const uploadMutation = useUploadDishPhoto();
  const deleteMutation = useDeleteDishPhoto();
  const setPrimaryMutation = useSetPrimaryPhoto();
  const reorderMutation = useReorderPhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = 5 - photos.length;
      const toUpload = fileArray.slice(0, remaining);
      toUpload.forEach((file) => {
        uploadMutation.mutate({ dishId, file });
      });
    },
    [dishId, photos.length, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updates = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
    reorderMutation.mutate({ photos: updates, dishId });
  };

  const canUpload = photos.length < 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Zdjęcia</span>
          <span className="text-sm font-normal text-muted-foreground">
            {photos.length} / 5 zdjęć
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        {canUpload && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Camera className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Przeciągnij zdjęcia tutaj lub kliknij, aby wybrać
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, WebP • max 5MB
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {/* Photos grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : photos.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    dishId={dishId}
                    onDelete={(p) => deleteMutation.mutate({ photo: p, dishId })}
                    onSetPrimary={(p) =>
                      setPrimaryMutation.mutate({
                        photoId: p.id,
                        dishId,
                        photoUrl: p.photo_url,
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : !canUpload ? null : (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
            <p className="text-sm">Brak zdjęć</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
