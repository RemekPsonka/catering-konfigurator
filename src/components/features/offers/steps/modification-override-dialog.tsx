import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DishAutocomplete } from '@/components/features/dishes/dish-autocomplete';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface ModificationOverrideDialogProps {
  open: boolean;
  onClose: () => void;
  baseModifications: Json | null;
  currentOverride: Json | null;
  currentDishId: string;
  onSave: (override: Json) => void;
}

type ModType = 'swap' | 'variant' | 'split';

interface SwapItem { dish_id: string; label: string }
interface VariantOption { label: string; price_modifier: number }

export const ModificationOverrideDialog = ({
  open,
  onClose,
  baseModifications,
  currentOverride,
  currentDishId,
  onSave,
}: ModificationOverrideDialogProps) => {
  const [modType, setModType] = useState<ModType>('swap');
  const [swapItems, setSwapItems] = useState<SwapItem[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [splitItems, setSplitItems] = useState<SwapItem[]>([]);
  const [minSplitPercent, setMinSplitPercent] = useState(25);
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  useEffect(() => {
    const source = (currentOverride ?? baseModifications) as Record<string, unknown> | null;
    if (!source || !source.type) return;

    const type = source.type as ModType;
    setModType(type);

    if (type === 'swap') {
      setSwapItems((source.alternatives as SwapItem[]) ?? []);
    } else if (type === 'variant') {
      setVariants((source.options as VariantOption[]) ?? []);
    } else if (type === 'split') {
      setSplitItems((source.can_split_with as SwapItem[]) ?? []);
      setMinSplitPercent((source.min_split_percent as number) ?? 25);
    }
  }, [baseModifications, currentOverride, open]);

  const handleSave = () => {
    let data: Record<string, unknown>;
    if (modType === 'swap') {
      data = { type: 'swap', alternatives: swapItems };
    } else if (modType === 'variant') {
      data = { type: 'variant', options: variants };
    } else {
      data = { type: 'split', can_split_with: splitItems, min_split_percent: minSplitPercent };
    }
    onSave(data as unknown as Json);
    onClose();
  };

  const addVariant = () => {
    if (!newVariantLabel.trim()) return;
    setVariants(prev => [...prev, { label: newVariantLabel.trim(), price_modifier: parseFloat(newVariantPrice) || 0 }]);
    setNewVariantLabel('');
    setNewVariantPrice('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edytuj zamienniki dla oferty</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={modType} onValueChange={(v) => setModType(v as ModType)} className="flex gap-4">
            <div className="flex items-center gap-2"><RadioGroupItem value="swap" id="ov-swap" /><Label htmlFor="ov-swap">Zamiana</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="variant" id="ov-variant" /><Label htmlFor="ov-variant">Warianty</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="split" id="ov-split" /><Label htmlFor="ov-split">Podział</Label></div>
          </RadioGroup>

          {modType === 'swap' && (
            <div className="space-y-2">
              <Label>Dania zamienne</Label>
              <DishAutocomplete
                excludeId={currentDishId}
                excludeIds={swapItems.map(s => s.dish_id)}
                onSelect={(dish) => setSwapItems(prev => [...prev, { dish_id: dish.dish_id, label: dish.label }])}
                placeholder="Szukaj dania..."
              />
              <div className="flex flex-wrap gap-1">
                {swapItems.map(item => (
                  <Badge key={item.dish_id} variant="secondary" className="gap-1">
                    {item.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSwapItems(prev => prev.filter(s => s.dish_id !== item.dish_id))} />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {modType === 'variant' && (
            <div className="space-y-2">
              <Label>Opcje wariantów</Label>
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm flex-1">{v.label} ({v.price_modifier >= 0 ? '+' : ''}{v.price_modifier} zł)</span>
                  <Button variant="ghost" size="sm" onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Nazwa" value={newVariantLabel} onChange={(e) => setNewVariantLabel(e.target.value)} className="flex-1" />
                <Input placeholder="±zł" value={newVariantPrice} onChange={(e) => setNewVariantPrice(e.target.value)} className="w-20" type="number" />
                <Button variant="outline" size="sm" onClick={addVariant}>Dodaj</Button>
              </div>
            </div>
          )}

          {modType === 'split' && (
            <div className="space-y-2">
              <Label>Dania do podziału</Label>
              <DishAutocomplete
                excludeId={currentDishId}
                excludeIds={splitItems.map(s => s.dish_id)}
                onSelect={(dish) => setSplitItems(prev => [...prev, { dish_id: dish.dish_id, label: dish.label }])}
                placeholder="Szukaj dania..."
              />
              <div className="flex flex-wrap gap-1">
                {splitItems.map(item => (
                  <Badge key={item.dish_id} variant="secondary" className="gap-1">
                    {item.label}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSplitItems(prev => prev.filter(s => s.dish_id !== item.dish_id))} />
                  </Badge>
                ))}
              </div>
              <div>
                <Label>Min. % podziału</Label>
                <Input type="number" value={minSplitPercent} onChange={(e) => setMinSplitPercent(parseInt(e.target.value) || 0)} className="w-24" min={1} max={50} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleSave}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
