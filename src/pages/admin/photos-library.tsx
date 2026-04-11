import { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  usePhotoLibrary,
  useUploadLibraryPhoto,
  useUpdateLibraryPhoto,
  useDeleteLibraryPhoto,
  useEventPhotoStats,
  useBulkAddEventTag,
  type LibraryPhoto,
} from '@/hooks/use-photo-library';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { MIN_EVENT_PHOTOS, MAX_LIBRARY_PHOTOS } from '@/lib/app-limits';
import { Upload, Loader2, Trash2, Pencil, Star, ImagePlus, CheckSquare } from 'lucide-react';

const CONTENT_TAGS = [
  'bufet', 'tort', 'sala', 'dekoracje', 'plener', 'goście',
  'setup', 'detale', 'kuchnia', 'napoje', 'stoły', 'tematyczne',
];

const EVENT_TAG_COLORS: Record<string, string> = {
  KOM: 'bg-pink-100 text-pink-800',
  WES: 'bg-rose-100 text-rose-800',
  FIR: 'bg-blue-100 text-blue-800',
  KON: 'bg-indigo-100 text-indigo-800',
  PRY: 'bg-purple-100 text-purple-800',
  GAL: 'bg-amber-100 text-amber-800',
  STY: 'bg-slate-100 text-slate-800',
  GRI: 'bg-green-100 text-green-800',
  B2B: 'bg-cyan-100 text-cyan-800',
  BOX: 'bg-orange-100 text-orange-800',
  KAW: 'bg-yellow-100 text-yellow-800',
  SPE: 'bg-emerald-100 text-emerald-800',
  SZK: 'bg-teal-100 text-teal-800',
  SWI: 'bg-red-100 text-red-800',
};

const getEventTagColor = (tag: string) => EVENT_TAG_COLORS[tag] ?? 'bg-muted text-muted-foreground';

export const PhotosLibraryPage = () => {
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterContent, setFilterContent] = useState<string>('all');
  const { data: photos = [], isLoading } = usePhotoLibrary(filterEvent === 'all' ? undefined : filterEvent);
  const { data: stats = {} } = useEventPhotoStats();
  const uploadPhoto = useUploadLibraryPhoto();
  const updatePhoto = useUpdateLibraryPhoto();
  const deletePhoto = useDeleteLibraryPhoto();
  const bulkAddTag = useBulkAddEventTag();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editPhoto, setEditPhoto] = useState<LibraryPhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryPhoto | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState<string>('');
  const [bulkMode, setBulkMode] = useState(false);

  // Edit dialog state
  const [editCaption, setEditCaption] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editEventTags, setEditEventTags] = useState<string[]>([]);
  const [editContentTags, setEditContentTags] = useState<string[]>([]);
  const [editHeroFor, setEditHeroFor] = useState<string[]>([]);

  const filteredPhotos = useMemo(() => {
    if (filterContent === 'all') return photos;
    return photos.filter((p) => p.content_tags.includes(filterContent));
  }, [photos, filterContent]);

  const openEdit = (photo: LibraryPhoto) => {
    setEditPhoto(photo);
    setEditCaption(photo.caption ?? '');
    setEditAltText(photo.alt_text ?? '');
    setEditEventTags([...(photo.event_tags ?? [])]);
    setEditContentTags([...(photo.content_tags ?? [])]);
    setEditHeroFor([...(photo.hero_for_events ?? [])]);
  };

  const saveEdit = () => {
    if (!editPhoto) return;
    updatePhoto.mutate({
      id: editPhoto.id,
      updates: {
        caption: editCaption || null,
        alt_text: editAltText || null,
        event_tags: editEventTags,
        content_tags: editContentTags,
        hero_for_events: editHeroFor,
      },
    });
    setEditPhoto(null);
  };

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const eventTags = filterEvent !== 'all' ? [filterEvent] : [];
    for (const file of Array.from(files)) {
      await uploadPhoto.mutateAsync({ file, eventTags });
    }
  }, [filterEvent, uploadPhoto]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkAdd = () => {
    if (!bulkTag || selectedIds.size === 0) return;
    bulkAddTag.mutate({ photoIds: Array.from(selectedIds), eventTag: bulkTag });
    setSelectedIds(new Set());
    setBulkTag('');
    setBulkMode(false);
  };

  const toggleEventTag = (tag: string) => {
    setEditEventTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const toggleContentTag = (tag: string) => {
    setEditContentTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const toggleHeroFor = (tag: string) => {
    setEditHeroFor((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📸 Biblioteka zdjęć</h1>
        <div className="flex items-center gap-2">
          {bulkMode ? (
            <>
              <Select value={bulkTag} onValueChange={setBulkTag}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Wybierz tag" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.emoji} {e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={selectedIds.size === 0 || !bulkTag} onClick={handleBulkAdd}>
                Dodaj tag ({selectedIds.size})
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setBulkMode(false); setSelectedIds(new Set()); }}>
                Anuluj
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setBulkMode(true)}>
                <CheckSquare className="h-4 w-4 mr-1" /> Zaznacz wiele
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-1" /> Dodaj zdjęcie
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats dashboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pokrycie zdjęciami per typ wydarzenia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPE_OPTIONS.map((e) => {
              const count = stats[e.value] ?? 0;
              const status = count >= MIN_EVENT_PHOTOS ? 'ok' : count > 0 ? 'warn' : 'error';
              const colors = status === 'ok' ? 'bg-green-100 text-green-800' : status === 'warn' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
              const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
              return (
                <button
                  key={e.value}
                  onClick={() => setFilterEvent(filterEvent === e.value ? 'all' : e.value)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${colors} ${filterEvent === e.value ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                >
                  {e.emoji} {e.value}: {count} {icon}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Typ wydarzenia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            {EVENT_TYPE_OPTIONS.map((e) => (
              <SelectItem key={e.value} value={e.value}>{e.emoji} {e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterContent} onValueChange={setFilterContent}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Kategoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {CONTENT_TAGS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filteredPhotos.length} zdjęć</span>
      </div>

      {/* Upload drop zone */}
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadPhoto.isPending ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        ) : (
          <>
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Przeciągnij zdjęcia lub kliknij</p>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP — max 10MB</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Brak zdjęć{filterEvent !== 'all' ? ` dla tego typu wydarzenia` : ''}.</p>
          <p className="text-sm text-muted-foreground">Dodaj pierwsze zdjęcie przeciągając je powyżej.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="group relative rounded-lg overflow-hidden border bg-background">
              {bulkMode && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedIds.has(photo.id)}
                    onCheckedChange={() => toggleSelect(photo.id)}
                    className="bg-background/80 backdrop-blur-sm"
                  />
                </div>
              )}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={photo.photo_url}
                  alt={photo.alt_text ?? photo.caption ?? ''}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEdit(photo)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setDeleteTarget(photo)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* Info */}
              <div className="p-2 space-y-1">
                {photo.caption && <p className="text-xs font-medium truncate">{photo.caption}</p>}
                <div className="flex flex-wrap gap-1">
                  {photo.event_tags.map((tag) => (
                    <span key={tag} className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getEventTagColor(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                {photo.hero_for_events.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    <Star className="h-3 w-3 mr-0.5 fill-current" /> Hero
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editPhoto} onOpenChange={(open) => !open && setEditPhoto(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edytuj zdjęcie</DialogTitle>
            <DialogDescription>Ustaw tagi, podpis i oznacz jako hero.</DialogDescription>
          </DialogHeader>
          {editPhoto && (
            <div className="space-y-4">
              <img src={editPhoto.photo_url} alt="" className="w-full h-40 object-cover rounded-lg" />
              <div>
                <Label>Podpis</Label>
                <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="Opis zdjęcia" />
              </div>
              <div>
                <Label>Alt text (dostępność)</Label>
                <Input value={editAltText} onChange={(e) => setEditAltText(e.target.value)} placeholder="Tekst alternatywny" />
              </div>
              <div>
                <Label className="mb-2 block">Typy wydarzeń</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPE_OPTIONS.map((e) => (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => toggleEventTag(e.value)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${editEventTags.includes(e.value) ? getEventTagColor(e.value) + ' ring-2 ring-primary ring-offset-1' : 'bg-muted text-muted-foreground'}`}
                    >
                      {e.emoji} {e.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Kategorie treści</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleContentTag(tag)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${editContentTags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Hero dla typów</Label>
                <div className="flex flex-wrap gap-2">
                  {editEventTags.map((tag) => {
                    const opt = EVENT_TYPE_OPTIONS.find((e) => e.value === tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleHeroFor(tag)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${editHeroFor.includes(tag) ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' : 'bg-muted text-muted-foreground'}`}
                      >
                        <Star className="h-3 w-3" /> {opt?.emoji} {tag}
                      </button>
                    );
                  })}
                  {editEventTags.length === 0 && <p className="text-xs text-muted-foreground">Najpierw dodaj typy wydarzeń</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPhoto(null)}>Anuluj</Button>
            <Button onClick={saveEdit}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Usuń zdjęcie"
        description="Czy na pewno usunąć to zdjęcie z biblioteki? Nie można cofnąć."
        confirmLabel="Usuń"
        onConfirm={() => {
          if (deleteTarget) {
            deletePhoto.mutate(deleteTarget);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
