import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ClipboardList, Plus, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ClientRequirement {
  text: string;
  category: string;
  priority: string;
  is_met: boolean | null;
  note?: string;
}

interface RequirementsSidebarProps {
  requirements: ClientRequirement[];
  onUpdate: (reqs: ClientRequirement[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  menu: 'Menu',
  budget: 'Budżet',
  service: 'Usługi',
  logistics: 'Logistyka',
  dietary: 'Dieta',
  special: 'Specjalne',
};

const CATEGORY_COLORS: Record<string, string> = {
  menu: 'bg-blue-100 text-blue-800',
  budget: 'bg-green-100 text-green-800',
  service: 'bg-purple-100 text-purple-800',
  logistics: 'bg-orange-100 text-orange-800',
  dietary: 'bg-emerald-100 text-emerald-800',
  special: 'bg-pink-100 text-pink-800',
};

export const RequirementsSidebar = ({ requirements, onUpdate }: RequirementsSidebarProps) => {
  const isMobile = useIsMobile();
  const [newReqText, setNewReqText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const metCount = requirements.filter((r) => r.is_met === true).length;
  const progress = requirements.length > 0 ? (metCount / requirements.length) * 100 : 0;

  const handleToggle = (index: number, checked: boolean) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], is_met: checked };
    onUpdate(updated);
  };

  const handleNoteChange = (index: number, note: string) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], note: note || undefined };
    onUpdate(updated);
  };

  const handleRemove = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const handleAdd = () => {
    if (!newReqText.trim()) return;
    onUpdate([
      ...requirements,
      { text: newReqText.trim(), category: 'special', priority: 'nice_to_have', is_met: null },
    ]);
    setNewReqText('');
    setShowAddForm(false);
  };

  const content = (
    <div className="space-y-3">
      <div className="space-y-2">
        {requirements.map((req, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border p-2.5">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={req.is_met === true}
                onCheckedChange={(checked) => handleToggle(i, !!checked)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{req.text}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[req.category] ?? 'bg-muted text-muted-foreground'}`}>
                    {CATEGORY_LABELS[req.category] ?? req.category}
                  </span>
                  {req.priority === 'must' ? (
                    <span className="text-[10px]">🔴</span>
                  ) : (
                    <span className="text-[10px]">🟡</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => handleRemove(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            {req.is_met === true && (
              <Input
                placeholder="Jak spełnione?"
                value={req.note ?? ''}
                onChange={(e) => handleNoteChange(i, e.target.value)}
                className="h-7 text-xs ml-6"
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{metCount} z {requirements.length} spełnionych</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {showAddForm ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Treść wymagania..."
            value={newReqText}
            onChange={(e) => setNewReqText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" className="h-8" onClick={handleAdd} disabled={!newReqText.trim()}>
            Dodaj
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowAddForm(false); setNewReqText(''); }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddForm(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Dodaj wymaganie
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="sm"
            className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg gap-1.5"
          >
            <ClipboardList className="h-4 w-4" />
            Wymagania ({requirements.length})
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Wymagania klienta
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="sticky top-24 w-[280px] max-h-[calc(100vh-200px)] overflow-y-auto shrink-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Wymagania klienta
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
