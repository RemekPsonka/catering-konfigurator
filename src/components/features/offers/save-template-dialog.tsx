import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSaveAsTemplate } from '@/hooks/use-offer-templates';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import type { EventType } from '@/types';

interface SaveTemplateDialogProps {
  offerId: string;
  eventType: string;
  pricingMode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SaveTemplateDialog = ({ offerId, eventType, pricingMode, open, onOpenChange }: SaveTemplateDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const saveMutation = useSaveAsTemplate();

  const handleSave = () => {
    if (!name.trim()) return;
    saveMutation.mutate({ offerId, name: name.trim(), description: description.trim() }, {
      onSuccess: () => {
        setName('');
        setDescription('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zapisz jako szablon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tpl-name">Nazwa szablonu *</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Komunia Classic 2024" />
          </div>
          <div>
            <Label htmlFor="tpl-desc">Opis</Label>
            <Textarea id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Opcjonalny opis szablonu..." />
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{EVENT_TYPE_LABELS[eventType as EventType] ?? eventType}</Badge>
            <Badge variant="outline">{pricingMode === 'PER_PERSON' ? 'Na osobę' : 'Stała ilość'}</Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saveMutation.isPending}>
            {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz szablon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
