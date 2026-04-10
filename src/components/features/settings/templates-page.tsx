import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { useOfferTemplates, useUpdateTemplate, useToggleTemplate, type TemplateData } from '@/hooks/use-offer-templates';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import type { EventType } from '@/types';

export const TemplatesPage = () => {
  const { data: templates, isLoading } = useOfferTemplates();
  const updateMutation = useUpdateTemplate();
  const toggleMutation = useToggleTemplate();

  const [editDialog, setEditDialog] = useState<{ id: string; name: string; description: string } | null>(null);

  const handleToggle = (id: string, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive });
  };

  const handleEdit = (tpl: NonNullable<typeof templates>[0]) => {
    setEditDialog({ id: tpl.id, name: tpl.name, description: tpl.description ?? '' });
  };

  const handleSaveEdit = () => {
    if (!editDialog) return;
    updateMutation.mutate({ id: editDialog.id, name: editDialog.name, description: editDialog.description }, {
      onSuccess: () => setEditDialog(null),
    });
  };

  if (isLoading) return <LoadingSpinner />;

  if (!templates?.length) {
    return <EmptyState title="Brak szablonów" description="Zapisz ofertę jako szablon, aby pojawiła się tutaj." />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Typ eventu</TableHead>
            <TableHead>Tryb</TableHead>
            <TableHead>Warianty</TableHead>
            <TableHead>Aktywny</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((tpl) => {
            const td = tpl.template_data as TemplateData;
            return (
              <TableRow key={tpl.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{tpl.name}</span>
                    {tpl.description && <p className="text-xs text-muted-foreground line-clamp-1">{tpl.description}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{EVENT_TYPE_LABELS[tpl.event_type as EventType] ?? tpl.event_type}</Badge>
                </TableCell>
                <TableCell className="text-sm">{tpl.pricing_mode === 'PER_PERSON' ? 'Na osobę' : 'Stała ilość'}</TableCell>
                <TableCell className="text-sm">{td?.variants?.length ?? 0}</TableCell>
                <TableCell>
                  <Switch
                    checked={tpl.is_active ?? true}
                    onCheckedChange={(checked) => handleToggle(tpl.id, checked)}
                    disabled={toggleMutation.isPending}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tpl)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj szablon</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div>
                <Label>Nazwa</Label>
                <Input value={editDialog.name} onChange={(e) => setEditDialog({ ...editDialog, name: e.target.value })} />
              </div>
              <div>
                <Label>Opis</Label>
                <Textarea value={editDialog.description} onChange={(e) => setEditDialog({ ...editDialog, description: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Anuluj</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
