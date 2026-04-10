import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { useOfferTemplates, type TemplateData } from '@/hooks/use-offer-templates';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import type { EventType } from '@/types';

interface UseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (templateData: TemplateData, eventType: string, pricingMode: string) => void;
}

export const UseTemplateDialog = ({ open, onOpenChange, onSelect }: UseTemplateDialogProps) => {
  const [filterType, setFilterType] = useState('all');
  const { data: templates, isLoading } = useOfferTemplates(filterType);

  const activeTemplates = (templates ?? []).filter((t) => t.is_active);

  const handleSelect = (template: typeof activeTemplates[0]) => {
    const raw = template.template_data;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('variants' in raw)) return;
    const td = raw as unknown as TemplateData;
    onSelect?.(td, template.event_type, template.pricing_mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Użyj szablonu</DialogTitle>
        </DialogHeader>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtruj po typie eventu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            {Object.entries(EVENT_TYPE_LABELS).map(([code, label]) => (
              <SelectItem key={code} value={code}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <LoadingSpinner />
        ) : activeTemplates.length === 0 ? (
          <EmptyState title="Brak szablonów" description="Nie znaleziono aktywnych szablonów." />
        ) : (
          <div className="space-y-2">
            {activeTemplates.map((tpl) => {
              const td = tpl.template_data as unknown as TemplateData;
              return (
                <Card key={tpl.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSelect(tpl)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{tpl.name}</span>
                        </div>
                        {tpl.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 ml-6">{tpl.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {EVENT_TYPE_LABELS[tpl.event_type as EventType] ?? tpl.event_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {td.variants?.length ?? 0} wariant{(td.variants?.length ?? 0) === 1 ? '' : (td.variants?.length ?? 0) < 5 ? 'y' : 'ów'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
