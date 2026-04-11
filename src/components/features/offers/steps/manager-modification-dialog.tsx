import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/calculations';
import type { VariantItemWithDish } from '@/hooks/use-offer-variants';
import type { Json } from '@/integrations/supabase/types';

interface ManagerModificationDialogProps {
  open: boolean;
  onClose: () => void;
  item: VariantItemWithDish;
  offerId: string;
}

interface SwapAlternative {
  dish_id: string;
  label: string;
}

interface VariantOption {
  label: string;
  price_modifier: number;
}

export const ManagerModificationDialog = ({ open, onClose, item, offerId }: ManagerModificationDialogProps) => {
  const queryClient = useQueryClient();

  const mods = useMemo(() => {
    const source = (item.allowed_modifications ?? item.dishes?.modifiable_items) as Record<string, unknown> | null;
    if (!source || !source.type) return null;
    return source;
  }, [item]);

  const modType = mods?.type as string | undefined;
  const [selectedSwap, setSelectedSwap] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSwap(null);
    setSelectedVariant(item.selected_variant_option ?? null);
  }, [open, item]);

  const applyMutation = useMutation({
    mutationFn: async (updateData: Record<string, unknown>) => {
      const { error } = await supabase
        .from('variant_items')
        .update(updateData)
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-variants', offerId] });
      toast.success('Zmieniono danie w imieniu klienta');
      onClose();
    },
    onError: () => {
      toast.error('Nie udało się zapisać zmiany');
    },
  });

  const handleApply = () => {
    if (modType === 'swap' && selectedSwap) {
      const alt = (mods?.alternatives as SwapAlternative[])?.find(a => a.dish_id === selectedSwap);
      if (!alt) return;
      applyMutation.mutate({
        dish_id: alt.dish_id,
        custom_name: alt.label,
      });
    } else if (modType === 'variant' && selectedVariant) {
      const opt = (mods?.options as VariantOption[])?.find(o => o.label === selectedVariant);
      if (!opt) return;
      const basePrice = item.dishes?.price_per_person ?? item.dishes?.price_per_piece ?? item.dishes?.price_per_kg ?? item.dishes?.price_per_set ?? 0;
      applyMutation.mutate({
        selected_variant_option: opt.label,
        custom_price: basePrice + opt.price_modifier,
      });
    }
  };

  if (!mods) return null;

  const alternatives = (mods.alternatives as SwapAlternative[]) ?? [];
  const options = (mods.options as VariantOption[]) ?? [];
  const basePrice = item.dishes?.price_per_person ?? item.dishes?.price_per_piece ?? item.dishes?.price_per_kg ?? item.dishes?.price_per_set ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zmień danie za klienta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Aktualne:</span>
            <Badge variant="secondary">{item.custom_name ?? item.dishes.display_name}</Badge>
          </div>

          {modType === 'swap' && alternatives.length > 0 && (
            <div className="space-y-2">
              <Label>Wybierz zamiennik</Label>
              <RadioGroup value={selectedSwap ?? ''} onValueChange={setSelectedSwap}>
                {alternatives.map(alt => (
                  <div key={alt.dish_id} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50">
                    <RadioGroupItem value={alt.dish_id} id={`swap-${alt.dish_id}`} />
                    <Label htmlFor={`swap-${alt.dish_id}`} className="flex-1 cursor-pointer text-sm">
                      {alt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {modType === 'variant' && options.length > 0 && (
            <div className="space-y-2">
              <Label>Wybierz wariant</Label>
              <RadioGroup value={selectedVariant ?? ''} onValueChange={setSelectedVariant}>
                {options.map(opt => (
                  <div key={opt.label} className="flex items-center justify-between gap-2 p-2 rounded border hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={opt.label} id={`var-${opt.label}`} />
                      <Label htmlFor={`var-${opt.label}`} className="cursor-pointer text-sm">{opt.label}</Label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(basePrice + opt.price_modifier)}
                      {opt.price_modifier !== 0 && (
                        <span className={opt.price_modifier > 0 ? 'text-red-600 ml-1' : 'text-green-600 ml-1'}>
                          ({opt.price_modifier > 0 ? '+' : ''}{opt.price_modifier} zł)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {modType === 'split' && (
            <p className="text-sm text-muted-foreground">
              Podział dań nie jest obsługiwany w trybie manualnym. Użyj widoku propozycji klienta.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button
            onClick={handleApply}
            disabled={
              applyMutation.isPending ||
              (modType === 'swap' && !selectedSwap) ||
              (modType === 'variant' && !selectedVariant) ||
              modType === 'split'
            }
          >
            {applyMutation.isPending ? 'Zapisywanie...' : 'Zastosuj zmianę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
