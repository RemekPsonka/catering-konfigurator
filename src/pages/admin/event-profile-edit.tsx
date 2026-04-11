import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  useEventProfile,
  useUpdateEventProfile,
  useEventPhotos,
  useUploadEventPhoto,
  useDeleteEventPhoto,
  useSetHeroPhoto,
  useUpdateEventPhoto,
  useReorderEventPhotos,
  useUpdateEventPhotoTags,
} from '@/hooks/use-event-profiles';
import { useOfferTheme, useUpdateOfferTheme } from '@/hooks/use-offer-theme';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { ArrowLeft, Plus, Trash2, Star, Upload, GripVertical, Eye, Loader2, X, Tag, Camera, Palette } from 'lucide-react';
import { usePhotoLibrary, useHeroPhoto, useEventPhotoStats } from '@/hooks/use-photo-library';
import { MIN_EVENT_PHOTOS, MAX_LIBRARY_PHOTOS } from '@/lib/app-limits';
import type { Tables } from '@/integrations/supabase/types';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

const PREDEFINED_TAGS = [
  { emoji: '🎨', label: 'dekoracje' },
  { emoji: '🍽️', label: 'stoły' },
  { emoji: '🥗', label: 'bufet' },
  { emoji: '🎂', label: 'tort' },
  { emoji: '🏛️', label: 'sala' },
  { emoji: '🌳', label: 'plener' },
  { emoji: '👥', label: 'goście' },
  { emoji: '🔧', label: 'setup' },
  { emoji: '✨', label: 'detale' },
  { emoji: '👨‍🍳', label: 'kuchnia' },
  { emoji: '🍸', label: 'napoje' },
  { emoji: '🎭', label: 'tematyczne' },
];

const TAG_COLORS: Record<string, string> = {
  dekoracje: 'bg-pink-100 text-pink-800',
  stoły: 'bg-blue-100 text-blue-800',
  bufet: 'bg-green-100 text-green-800',
  tort: 'bg-yellow-100 text-yellow-800',
  sala: 'bg-purple-100 text-purple-800',
  plener: 'bg-emerald-100 text-emerald-800',
  goście: 'bg-orange-100 text-orange-800',
  setup: 'bg-slate-100 text-slate-800',
  detale: 'bg-amber-100 text-amber-800',
  kuchnia: 'bg-red-100 text-red-800',
  napoje: 'bg-cyan-100 text-cyan-800',
  tematyczne: 'bg-indigo-100 text-indigo-800',
};

const getTagColor = (tag: string) => TAG_COLORS[tag] ?? 'bg-muted text-muted-foreground';

// --- Sortable Photo Card ---
const SortablePhotoCard = ({
  photo,
  onDelete,
  onSetHero,
  onUpdateMeta,
  onUpdateTags,
}: {
  photo: Tables<'event_type_photos'>;
  onDelete: () => void;
  onSetHero: () => void;
  onUpdateMeta: (caption: string | null, altText: string | null) => void;
  onUpdateTags: (tags: string[]) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [customTag, setCustomTag] = useState('');
  const tags = photo.tags ?? [];

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    onUpdateTags([...tags, t]);
  };

  const removeTag = (tag: string) => {
    onUpdateTags(tags.filter((t) => t !== tag));
  };

  const handleCustomTagSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(customTag);
      setCustomTag('');
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-2 bg-background space-y-2">
      <div className="flex items-start gap-2">
        <button type="button" {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="w-20 h-16 rounded overflow-hidden flex-shrink-0">
          <img src={photo.photo_url} alt={photo.alt_text ?? ''} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <Input
            placeholder="Podpis (opcjonalny)"
            defaultValue={photo.caption ?? ''}
            className="h-7 text-xs"
            onBlur={(e) => onUpdateMeta(e.target.value || null, photo.alt_text)}
          />
          <Input
            placeholder="Alt text (dostępność)"
            defaultValue={photo.alt_text ?? ''}
            className="h-7 text-xs"
            onBlur={(e) => onUpdateMeta(photo.caption, e.target.value || null)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant={photo.is_hero ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={onSetHero}
            title="Ustaw jako hero"
          >
            <Star className={`h-3.5 w-3.5 ${photo.is_hero ? 'fill-current' : ''}`} />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-1 flex-wrap pl-6">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${getTagColor(tag)}`}
            onClick={() => removeTag(tag)}
            title="Kliknij aby usunąć"
          >
            {PREDEFINED_TAGS.find((p) => p.label === tag)?.emoji ?? '🏷️'} {tag}
            <X className="h-3 w-3 ml-0.5" />
          </span>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Tag className="h-3 w-3 mr-1" /> +Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {PREDEFINED_TAGS.filter((pt) => !tags.includes(pt.label)).map((pt) => (
                <button
                  key={pt.label}
                  type="button"
                  className="w-full text-left px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
                  onClick={() => addTag(pt.label)}
                >
                  {pt.emoji} {pt.label}
                </button>
              ))}
              <div className="border-t pt-1 mt-1">
                <Input
                  placeholder="Własny tag + Enter"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={handleCustomTagSubmit}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {photo.is_hero && <Badge variant="secondary" className="text-xs ml-6">⭐ Hero</Badge>}
    </div>
  );
};

// --- Sortable Feature Row ---
const SortableFeatureRow = ({
  feature,
  index,
  onChange,
  onRemove,
}: {
  feature: Feature;
  index: number;
  onChange: (i: number, f: Feature) => void;
  onRemove: (i: number) => void;
}) => {
  const id = `feature-${index}`;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border rounded-lg p-2 bg-background">
      <button type="button" {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        className="w-14 h-8 text-center text-lg"
        maxLength={4}
        value={feature.icon}
        onChange={(e) => onChange(index, { ...feature, icon: e.target.value })}
        placeholder="🎂"
      />
      <Input
        className="flex-1 h-8 text-sm"
        maxLength={30}
        value={feature.title}
        onChange={(e) => onChange(index, { ...feature, title: e.target.value })}
        placeholder="Tytuł (max 30)"
      />
      <Input
        className="flex-[2] h-8 text-sm"
        maxLength={80}
        value={feature.text}
        onChange={(e) => onChange(index, { ...feature, text: e.target.value })}
        placeholder="Opis (max 80)"
      />
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(index)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

// --- Photo Library Preview for Event Profile ---
const EVENT_TAG_COLORS: Record<string, string> = {
  KOM: 'bg-pink-100 text-pink-800', WES: 'bg-rose-100 text-rose-800', FIR: 'bg-blue-100 text-blue-800',
  KON: 'bg-indigo-100 text-indigo-800', PRY: 'bg-purple-100 text-purple-800', GAL: 'bg-amber-100 text-amber-800',
};

const PhotoLibraryPreview = ({ eventTypeId }: { eventTypeId: string }) => {
  const { data: libraryPhotos = [] } = usePhotoLibrary(eventTypeId);
  const { data: heroPhoto } = useHeroPhoto(eventTypeId);
  const count = libraryPhotos.length;
  const status = count >= MIN_EVENT_PHOTOS ? 'ok' : count > 0 ? 'warn' : 'error';
  const statusIcon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  const statusColor = status === 'ok' ? 'text-green-700' : status === 'warn' ? 'text-yellow-700' : 'text-red-700';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Galeria zdjęć atmosfery</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${statusColor}`}>
              {statusIcon} {count}/{MAX_LIBRARY_PHOTOS} zdjęć
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/photos?event=${eventTypeId}`}>
                <Camera className="h-4 w-4 mr-1" /> Zarządzaj zdjęciami
              </Link>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status !== 'ok' && (
          <p className={`text-sm ${statusColor}`}>
            {count === 0
              ? `Brak zdjęć dla tego typu wydarzenia. Dodaj minimum ${MIN_EVENT_PHOTOS} zdjęcia w bibliotece.`
              : `Dodaj jeszcze ${MIN_EVENT_PHOTOS - count} zdjęcia (minimum ${MIN_EVENT_PHOTOS}).`}
          </p>
        )}
        {heroPhoto && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <img src={heroPhoto.photo_url} alt="" className="w-16 h-12 rounded object-cover" />
            <div>
              <Badge variant="secondary" className="text-xs"><Star className="h-3 w-3 mr-0.5 fill-current" /> Hero</Badge>
              <p className="text-xs text-muted-foreground mt-0.5">{heroPhoto.caption ?? 'Zdjęcie hero'}</p>
            </div>
          </div>
        )}
        {libraryPhotos.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {libraryPhotos.slice(0, 12).map((p) => (
              <div key={p.id} className="aspect-square rounded-lg overflow-hidden border">
                <img src={p.photo_url} alt={p.alt_text ?? ''} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
            {libraryPhotos.length > 12 && (
              <div className="aspect-square rounded-lg border flex items-center justify-center bg-muted">
                <span className="text-sm text-muted-foreground">+{libraryPhotos.length - 12}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Camera className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Brak zdjęć. Przejdź do biblioteki, aby dodać.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Main Page ---
export const EventProfileEditPage = () => {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useEventProfile(eventTypeId);
  const { data: photos = [] } = useEventPhotos(eventTypeId);
  const updateProfile = useUpdateEventProfile();
  const uploadPhoto = useUploadEventPhoto();
  const deletePhoto = useDeleteEventPhoto();
  const setHero = useSetHeroPhoto();
  const updatePhotoMeta = useUpdateEventPhoto();
  const updatePhotoTags = useUpdateEventPhotoTags();
  const reorderPhotos = useReorderEventPhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tables<'event_type_photos'> | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const [headline, setHeadline] = useState('');
  const [descShort, setDescShort] = useState('');
  const [descLong, setDescLong] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialAuthor, setTestimonialAuthor] = useState('');
  const [testimonialEvent, setTestimonialEvent] = useState('');

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline ?? '');
      setDescShort(profile.description_short ?? '');
      setDescLong(profile.description_long ?? '');
      setCtaText(profile.cta_text ?? '');
      setIsActive(profile.is_active ?? true);
      setFeatures(Array.isArray(profile.features) ? (profile.features as unknown as Feature[]) : []);
      setTestimonialText(profile.testimonial_text ?? '');
      setTestimonialAuthor(profile.testimonial_author ?? '');
      setTestimonialEvent(profile.testimonial_event ?? '');
    }
  }, [profile]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const opt = EVENT_TYPE_OPTIONS.find((o) => o.value === eventTypeId);

  // Collect all unique tags from photos
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    photos.forEach((p) => (p.tags ?? []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [photos]);

  // Filter photos by active tag
  const filteredPhotos = useMemo(() => {
    if (!activeTagFilter) return photos;
    return photos.filter((p) => (p.tags ?? []).includes(activeTagFilter));
  }, [photos, activeTagFilter]);

  const testimonialMissingAuthor = !!testimonialText && !testimonialAuthor.trim();

  const handleSave = useCallback(() => {
    if (!eventTypeId) return;
    updateProfile.mutate({
      id: eventTypeId,
      updates: {
        headline,
        description_short: descShort,
        description_long: descLong || null,
        cta_text: ctaText || null,
        is_active: isActive,
        features: JSON.parse(JSON.stringify(features)) as Tables<'event_type_profiles'>['features'],
        testimonial_text: testimonialText || null,
        testimonial_author: testimonialAuthor || null,
        testimonial_event: testimonialEvent || null,
      },
    });
  }, [eventTypeId, headline, descShort, descLong, ctaText, isActive, features, testimonialText, testimonialAuthor, testimonialEvent, updateProfile]);

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !eventTypeId) return;
      for (const file of Array.from(files)) {
        await uploadPhoto.mutateAsync({ eventTypeId, file });
      }
    },
    [eventTypeId, uploadPhoto],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const handlePhotoDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !eventTypeId) return;
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(photos, oldIndex, newIndex);
      reorderPhotos.mutate({
        eventTypeId,
        photos: reordered.map((p, i) => ({ id: p.id, sort_order: i })),
      });
    },
    [photos, eventTypeId, reorderPhotos],
  );

  const handleFeatureChange = (i: number, f: Feature) => {
    setFeatures((prev) => prev.map((old, idx) => (idx === i ? f : old)));
  };
  const handleFeatureRemove = (i: number) => setFeatures((prev) => prev.filter((_, idx) => idx !== i));
  const handleFeatureAdd = () => {
    if (features.length >= 4) return;
    setFeatures((prev) => [...prev, { icon: '✨', title: '', text: '' }]);
  };

  const handleFeatureDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = features.findIndex((_, i) => `feature-${i}` === active.id);
    const newIdx = features.findIndex((_, i) => `feature-${i}` === over.id);
    setFeatures(arrayMove(features, oldIdx, newIdx));
  };

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <div className="p-8 text-muted-foreground">Profil nie znaleziony.</div>;

  const heroPhoto = photos.find((p) => p.is_hero);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/settings/event-profiles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{opt?.emoji} {opt?.label ?? eventTypeId}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" /> Podgląd
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Zapisz
          </Button>
        </div>
      </div>

      {/* Section 1 — Tekst */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tekst</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nagłówek (headline)</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Catering na Komunię Świętą" />
          </div>
          <div>
            <Label>Opis krótki (max 200 znaków)</Label>
            <Textarea value={descShort} onChange={(e) => setDescShort(e.target.value.slice(0, 200))} maxLength={200} rows={2} />
            <p className="text-xs text-muted-foreground mt-1">{descShort.length}/200</p>
          </div>
          <div>
            <Label>Opis długi (marketing)</Label>
            <Textarea value={descLong} onChange={(e) => setDescLong(e.target.value)} rows={4} />
            <p className="text-xs text-muted-foreground mt-1">Ten tekst pojawia się na stronie klienta w sekcji &quot;O naszym cateringu&quot;</p>
          </div>
          <div>
            <Label>Tekst CTA</Label>
            <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Zaplanuj idealny catering na Komunię" />
            <p className="text-xs text-muted-foreground mt-1">Przycisk akcji na dole strony klienta</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <div>
              <Label>Aktywny</Label>
              <p className="text-xs text-muted-foreground">Wyłączenie ukrywa profil na stronie klienta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Wyróżniki */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Wyróżniki ({features.length}/4)
            <Button type="button" variant="outline" size="sm" onClick={handleFeatureAdd} disabled={features.length >= 4}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Dodaj
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {features.length === 0 && <p className="text-sm text-muted-foreground">Brak wyróżników. Kliknij &quot;Dodaj&quot; aby dodać.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFeatureDragEnd}>
            <SortableContext items={features.map((_, i) => `feature-${i}`)} strategy={rectSortingStrategy}>
              {features.map((f, i) => (
                <SortableFeatureRow key={`feature-${i}`} feature={f} index={i} onChange={handleFeatureChange} onRemove={handleFeatureRemove} />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Section 3 — Opinia */}
      <Card>
        <CardHeader><CardTitle className="text-base">Opinia klienta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tekst opinii</Label>
            <Textarea value={testimonialText} onChange={(e) => setTestimonialText(e.target.value)} rows={3} placeholder="Catering był wspaniały..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Autor</Label>
              <Input
                value={testimonialAuthor}
                onChange={(e) => setTestimonialAuthor(e.target.value)}
                placeholder="Katarzyna i Marek N."
                className={testimonialMissingAuthor ? 'border-destructive' : ''}
              />
              {testimonialMissingAuthor && (
                <p className="text-xs text-destructive mt-1">Autor jest wymagany gdy tekst opinii jest wypełniony</p>
              )}
            </div>
            <div>
              <Label>Wydarzenie</Label>
              <Input value={testimonialEvent} onChange={(e) => setTestimonialEvent(e.target.value)} placeholder="Komunia, Katowice 2025" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Jeśli puste, sekcja opinii nie wyświetli się na stronie klienta.</p>
        </CardContent>
      </Card>

      {/* Section 4 — Galeria (photo_library) */}
      <PhotoLibraryPreview eventTypeId={eventTypeId!} />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Usuń zdjęcie"
        description="Czy na pewno usunąć to zdjęcie? Nie można cofnąć."
        confirmLabel="Usuń"
        onConfirm={() => {
          if (deleteTarget) {
            deletePhoto.mutate({ photo: deleteTarget });
            setDeleteTarget(null);
          }
        }}
      />

      {/* Section 5 — Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Podgląd profilu — {opt?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Hero */}
            <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-primary/5">
              {heroPhoto ? (
                <img src={heroPhoto.photo_url} alt={headline} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">{opt?.emoji}</div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-end p-6">
                <h2 className="text-2xl font-bold text-white">{headline || 'Nagłówek...'}</h2>
              </div>
            </div>

            {/* Description */}
            {descLong && <p className="text-sm text-muted-foreground whitespace-pre-line">{descLong}</p>}

            {/* Features */}
            {features.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <div className="font-semibold text-sm">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Testimonial */}
            {testimonialText && (
              <blockquote className="border-l-4 border-primary pl-4 italic text-sm text-muted-foreground">
                <p>&quot;{testimonialText}&quot;</p>
                {testimonialAuthor && (
                  <footer className="mt-2 not-italic font-medium text-foreground">
                    — {testimonialAuthor}
                    {testimonialEvent && <span className="text-muted-foreground font-normal">, {testimonialEvent}</span>}
                  </footer>
                )}
              </blockquote>
            )}

            {/* CTA */}
            {ctaText && (
              <div className="text-center">
                <Button size="lg">{ctaText}</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
