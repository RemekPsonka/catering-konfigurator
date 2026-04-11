import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Plus, Pencil, Trash2, Star, Save } from 'lucide-react';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import {
  useAllCompanyStats, useUpdateStat,
  useAllTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial,
} from '@/hooks/use-social-proof';
import type { Tables } from '@/integrations/supabase/types';

type Testimonial = Tables<'testimonials'>;

const EMPTY_TESTIMONIAL = {
  client_name: '',
  event_type: null as string | null,
  event_description: null as string | null,
  quote: '',
  rating: 5 as number | null,
  photo_url: null as string | null,
  is_active: true,
  sort_order: 0,
};

export const SocialProofPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Social Proof</h1>
      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Statystyki firmy</TabsTrigger>
          <TabsTrigger value="testimonials">Opinie klientów</TabsTrigger>
        </TabsList>
        <TabsContent value="stats"><StatsTab /></TabsContent>
        <TabsContent value="testimonials"><TestimonialsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

const StatsTab = () => {
  const { data: stats, isLoading } = useAllCompanyStats();
  const updateStat = useUpdateStat();

  if (isLoading) return <LoadingSpinner />;
  if (!stats || stats.length === 0) return <p className="text-muted-foreground text-sm py-4">Brak statystyk. Dodaj je bezpośrednio w bazie danych.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} onSave={(s) => updateStat.mutate(s)} />
      ))}
    </div>
  );
};

const StatCard = ({ stat, onSave }: { stat: Tables<'company_stats'>['Row']; onSave: (s: Partial<Tables<'company_stats'>['Row']> & { id: string }) => void }) => {
  const [icon, setIcon] = useState(stat.stat_icon ?? '');
  const [value, setValue] = useState(stat.stat_value);
  const [label, setLabel] = useState(stat.stat_label);
  const [active, setActive] = useState(stat.is_active);

  const dirty = icon !== (stat.stat_icon ?? '') || value !== stat.stat_value || label !== stat.stat_label || active !== stat.is_active;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{stat.stat_key}</span>
          <Switch checked={active} onCheckedChange={setActive} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[60px_1fr] gap-2">
          <div>
            <Label className="text-xs">Emoji</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="text-center text-lg" maxLength={4} />
          </div>
          <div>
            <Label className="text-xs">Wartość</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="450+" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Etykieta</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="zrealizowanych wydarzeń" />
        </div>
        {dirty && (
          <Button size="sm" onClick={() => onSave({ id: stat.id, stat_icon: icon || null, stat_value: value, stat_label: label, is_active: active })}>
            <Save className="h-4 w-4 mr-1" /> Zapisz
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const TestimonialsTab = () => {
  const { data: testimonials, isLoading } = useAllTestimonials();
  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial();
  const deleteTestimonial = useDeleteTestimonial();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(EMPTY_TESTIMONIAL);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_TESTIMONIAL);
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      client_name: t.client_name,
      event_type: t.event_type,
      event_description: t.event_description,
      quote: t.quote,
      rating: t.rating,
      photo_url: t.photo_url,
      is_active: t.is_active,
      sort_order: t.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.client_name || !form.quote) return;
    if (editing) {
      await updateTestimonial.mutateAsync({ id: editing.id, ...form });
    } else {
      await createTestimonial.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Dodaj opinię</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klient</TableHead>
            <TableHead>Wydarzenie</TableHead>
            <TableHead>Ocena</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testimonials?.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.client_name}</TableCell>
              <TableCell>
                {t.event_type && (
                  <span className="text-sm">{EVENT_TYPE_OPTIONS.find((o) => o.value === t.event_type)?.emoji} {EVENT_TYPE_OPTIONS.find((o) => o.value === t.event_type)?.label ?? t.event_type}</span>
                )}
              </TableCell>
              <TableCell>
                {t.rating && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell><Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Aktywna' : 'Ukryta'}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(!testimonials || testimonials.length === 0) && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Brak opinii. Dodaj pierwszą opinię klienta.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edytuj opinię' : 'Nowa opinia'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Imię klienta *</Label>
              <Input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} />
            </div>
            <div>
              <Label>Typ wydarzenia</Label>
              <Select value={form.event_type ?? ''} onValueChange={(v) => setForm((f) => ({ ...f, event_type: v || null }))}>
                <SelectTrigger><SelectValue placeholder="Wybierz (opcjonalnie)" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.emoji} {o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Opis wydarzenia</Label>
              <Input value={form.event_description ?? ''} onChange={(e) => setForm((f) => ({ ...f, event_description: e.target.value || null }))} placeholder="np. Wesele, 150 gości" />
            </div>
            <div>
              <Label>Treść opinii *</Label>
              <Textarea value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Ocena (1-5)</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))} className="p-1">
                    <Star className={`h-5 w-5 ${(form.rating ?? 0) >= n ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Aktywna</Label>
            </div>
            <div>
              <Label>Kolejność</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={!form.client_name || !form.quote}>
              {editing ? 'Zapisz' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Usuń opinię"
        description="Czy na pewno chcesz usunąć tę opinię? Tej operacji nie można cofnąć."
        onConfirm={() => { if (deleteId) deleteTestimonial.mutate(deleteId); setDeleteId(null); }}
      />
    </div>
  );
};
