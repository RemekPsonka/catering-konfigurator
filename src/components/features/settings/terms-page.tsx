import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Plus, Trash2, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useOfferTermsAdmin, useAddTerm, useUpdateTerm, useDeleteTerm, useReorderTerms } from '@/hooks/use-offer-terms';

export const TermsPage = () => {
  const { data: terms, isLoading } = useOfferTermsAdmin();
  const addTerm = useAddTerm();
  const updateTerm = useUpdateTerm();
  const deleteTerm = useDeleteTerm();
  const reorderTerms = useReorderTerms();

  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editingField, setEditingField] = useState<{ id: string; field: 'label' | 'value' } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAdd = async () => {
    if (!newKey.trim() || !newLabel.trim() || !newValue.trim()) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }
    try {
      await addTerm.mutateAsync({ key: newKey.trim(), label: newLabel.trim(), value: newValue.trim() });
      toast.success('Warunek dodany');
      setAddOpen(false);
      setNewKey('');
      setNewLabel('');
      setNewValue('');
    } catch {
      toast.error('Nie udało się dodać warunku');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTerm.mutateAsync(deleteId);
      toast.success('Warunek usunięty');
    } catch {
      toast.error('Nie udało się usunąć warunku');
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateTerm.mutateAsync({ id, is_active: isActive });
    } catch {
      toast.error('Nie udało się zmienić statusu');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!terms) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= terms.length) return;

    const updates = [
      { id: terms[index].id, display_order: terms[swapIndex].display_order ?? swapIndex },
      { id: terms[swapIndex].id, display_order: terms[index].display_order ?? index },
    ];
    try {
      await reorderTerms.mutateAsync(updates);
    } catch {
      toast.error('Nie udało się zmienić kolejności');
    }
  };

  const startEdit = (id: string, field: 'label' | 'value', currentValue: string) => {
    setEditingField({ id, field });
    setEditingValue(currentValue);
  };

  const commitEdit = async () => {
    if (!editingField) return;
    try {
      await updateTerm.mutateAsync({ id: editingField.id, [editingField.field]: editingValue });
      toast.success('Zapisano');
    } catch {
      toast.error('Nie udało się zapisać');
    }
    setEditingField(null);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Zarządzaj globalnymi warunkami wyświetlanymi w każdej ofercie</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Dodaj warunek
        </Button>
      </div>

      {(!terms || terms.length === 0) ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Brak warunków. Dodaj pierwszy warunek oferty.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {terms.map((term, index) => (
            <Card key={term.id} className={term.is_active ? '' : 'opacity-50'}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-0.5 pt-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMove(index, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === terms.length - 1} onClick={() => handleMove(index, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{term.key}</span>
                      {editingField?.id === term.id && editingField.field === 'label' ? (
                        <Input
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                          className="h-7 text-sm font-medium"
                        />
                      ) : (
                        <span
                          className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                          onClick={() => startEdit(term.id, 'label', term.label)}
                        >
                          {term.label}
                        </span>
                      )}
                    </div>
                    {editingField?.id === term.id && editingField.field === 'value' ? (
                      <Textarea
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={commitEdit}
                        rows={3}
                        className="text-sm"
                      />
                    ) : (
                      <p
                        className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors whitespace-pre-line"
                        onClick={() => startEdit(term.id, 'value', term.value)}
                      >
                        {term.value}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch checked={term.is_active ?? true} onCheckedChange={(v) => handleToggleActive(term.id, v)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(term.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj warunek</DialogTitle>
            <DialogDescription>Nowy globalny warunek wyświetlany w ofertach</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Klucz (identyfikator)</Label>
              <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="np. delivery, insurance" />
            </div>
            <div>
              <Label className="text-sm">Etykieta</Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="np. Warunki dostawy" />
            </div>
            <div>
              <Label className="text-sm">Treść</Label>
              <Textarea value={newValue} onChange={(e) => setNewValue(e.target.value)} rows={3} placeholder="Treść warunku..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Anuluj</Button>
            <Button onClick={handleAdd} disabled={addTerm.isPending}>Dodaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Usuń warunek"
        description="Czy na pewno chcesz usunąć ten warunek? Operacja jest nieodwracalna."
        confirmText="Usuń"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
};
