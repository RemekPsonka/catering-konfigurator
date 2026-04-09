import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Eye } from 'lucide-react';
import { DishAutocomplete, type DishOption } from './dish-autocomplete';

type ModType = 'swap' | 'variant' | 'split';

interface SwapData {
  type: 'swap';
  alternatives: DishOption[];
}

interface VariantOption {
  label: string;
  price_modifier: number;
}

interface VariantData {
  type: 'variant';
  options: VariantOption[];
}

interface SplitData {
  type: 'split';
  can_split_with: DishOption[];
  min_split_percent: number;
}

type ModifiableData = SwapData | VariantData | SplitData;

interface ModifiableItemsSectionProps {
  value: Record<string, unknown> | null;
  onChange: (val: Record<string, unknown> | null) => void;
  currentDishId?: string;
}

const parseValue = (value: Record<string, unknown> | null): ModifiableData | null => {
  if (!value || !value.type) return null;
  return value as unknown as ModifiableData;
};

export const ModifiableItemsSection = ({ value, onChange, currentDishId }: ModifiableItemsSectionProps) => {
  const parsed = parseValue(value);
  const [modType, setModType] = useState<ModType>(parsed?.type ?? 'swap');

  // Local state for variant form
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('0');

  const currentData = parsed?.type === modType ? parsed : null;

  const emitChange = (data: ModifiableData) => {
    onChange(data as unknown as Record<string, unknown>);
  };

  const handleTypeChange = (type: ModType) => {
    setModType(type);
    if (type === 'swap') {
      emitChange({ type: 'swap', alternatives: [] });
    } else if (type === 'variant') {
      emitChange({ type: 'variant', options: [] });
    } else {
      emitChange({ type: 'split', can_split_with: [], min_split_percent: 25 });
    }
  };

  // SWAP handlers
  const swapAlternatives = (currentData as SwapData)?.alternatives ?? [];
  const handleAddSwap = (dish: DishOption) => {
    emitChange({ type: 'swap', alternatives: [...swapAlternatives, dish] });
  };
  const handleRemoveSwap = (dishId: string) => {
    emitChange({ type: 'swap', alternatives: swapAlternatives.filter((a) => a.dish_id !== dishId) });
  };

  // VARIANT handlers
  const variantOptions = (currentData as VariantData)?.options ?? [];
  const handleAddVariant = () => {
    if (!newVariantLabel.trim()) return;
    emitChange({
      type: 'variant',
      options: [...variantOptions, { label: newVariantLabel.trim(), price_modifier: Number(newVariantPrice) || 0 }],
    });
    setNewVariantLabel('');
    setNewVariantPrice('0');
  };
  const handleRemoveVariant = (index: number) => {
    emitChange({ type: 'variant', options: variantOptions.filter((_, i) => i !== index) });
  };

  // SPLIT handlers
  const splitDishes = (currentData as SplitData)?.can_split_with ?? [];
  const splitMin = (currentData as SplitData)?.min_split_percent ?? 25;
  const handleAddSplit = (dish: DishOption) => {
    emitChange({ type: 'split', can_split_with: [...splitDishes, dish], min_split_percent: splitMin });
  };
  const handleRemoveSplit = (dishId: string) => {
    emitChange({ type: 'split', can_split_with: splitDishes.filter((d) => d.dish_id !== dishId), min_split_percent: splitMin });
  };
  const handleSplitMinChange = (val: number) => {
    emitChange({ type: 'split', can_split_with: splitDishes, min_split_percent: val });
  };

  const formatPrice = (mod: number) => {
    if (mod === 0) return 'bez zmian ceny';
    return mod > 0 ? `+${mod.toFixed(2)} zł` : `${mod.toFixed(2)} zł`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modyfikacje dostępne</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type selector */}
        <div>
          <Label className="mb-2 block text-sm font-medium">Typ modyfikacji</Label>
          <RadioGroup value={modType} onValueChange={(v) => handleTypeChange(v as ModType)} className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="swap" id="mod-swap" />
              <Label htmlFor="mod-swap">Zamień na inne danie</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="variant" id="mod-variant" />
              <Label htmlFor="mod-variant">Warianty w ramach dania</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="split" id="mod-split" />
              <Label htmlFor="mod-split">Podział ilości</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* SWAP panel */}
        {modType === 'swap' && (
          <div className="space-y-3">
            <Label>Na jakie dania klient może zamienić?</Label>
            <DishAutocomplete
              excludeId={currentDishId}
              excludeIds={swapAlternatives.map((a) => a.dish_id)}
              onSelect={handleAddSwap}
              placeholder="Szukaj dania do zamiany..."
            />
            {swapAlternatives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {swapAlternatives.map((alt) => (
                  <Badge key={alt.dish_id} variant="secondary" className="gap-1 pr-1">
                    {alt.label}
                    <button type="button" onClick={() => handleRemoveSwap(alt.dish_id)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VARIANT panel */}
        {modType === 'variant' && (
          <div className="space-y-3">
            <Label>Jakie warianty dostępne?</Label>
            {variantOptions.length > 0 && (
              <div className="space-y-2">
                {variantOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                    <span className="flex-1 text-sm">{opt.label}</span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{formatPrice(opt.price_modifier)}</span>
                    <button type="button" onClick={() => handleRemoveVariant(i)} className="rounded-full hover:bg-muted p-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Nazwa wariantu</Label>
                <Input
                  value={newVariantLabel}
                  onChange={(e) => setNewVariantLabel(e.target.value)}
                  placeholder="np. z mięsem"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVariant(); } }}
                />
              </div>
              <div className="w-32">
                <Label className="text-xs">Modyfikator ceny (zł)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={newVariantPrice}
                  onChange={(e) => setNewVariantPrice(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVariant(); } }}
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={handleAddVariant} disabled={!newVariantLabel.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* SPLIT panel */}
        {modType === 'split' && (
          <div className="space-y-3">
            <Label>Na jakie dania klient może podzielić ilość?</Label>
            <DishAutocomplete
              excludeId={currentDishId}
              excludeIds={splitDishes.map((d) => d.dish_id)}
              onSelect={handleAddSplit}
              placeholder="Szukaj dania do podziału..."
            />
            {splitDishes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {splitDishes.map((d) => (
                  <Badge key={d.dish_id} variant="secondary" className="gap-1 pr-1">
                    {d.label}
                    <button type="button" onClick={() => handleRemoveSplit(d.dish_id)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="max-w-xs">
              <Label className="text-xs">Minimalny % podziału</Label>
              <Input
                type="number"
                min={5}
                max={50}
                step={5}
                value={splitMin}
                onChange={(e) => handleSplitMinChange(Number(e.target.value) || 25)}
              />
            </div>
          </div>
        )}

        {/* Client preview */}
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" />
            Podgląd — jak zobaczy to klient:
          </div>
          <div className="rounded-md border bg-muted/30 p-4">
            {modType === 'swap' && swapAlternatives.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Zamień na:</Label>
                <Select>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Wybierz zamiennik" />
                  </SelectTrigger>
                  <SelectContent>
                    {swapAlternatives.map((alt) => (
                      <SelectItem key={alt.dish_id} value={alt.dish_id}>
                        {alt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {modType === 'swap' && swapAlternatives.length === 0 && (
              <p className="text-sm text-muted-foreground">Dodaj co najmniej jeden zamiennik</p>
            )}

            {modType === 'variant' && variantOptions.length > 0 && (
              <RadioGroup className="space-y-2">
                {variantOptions.map((opt, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(i)} id={`preview-var-${i}`} />
                    <Label htmlFor={`preview-var-${i}`} className="flex items-center gap-2">
                      {opt.label}
                      {opt.price_modifier !== 0 && (
                        <span className={opt.price_modifier > 0 ? 'text-destructive text-xs' : 'text-green-600 text-xs'}>
                          {formatPrice(opt.price_modifier)}
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {modType === 'variant' && variantOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">Dodaj co najmniej jeden wariant</p>
            )}

            {modType === 'split' && splitDishes.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>To danie</span>
                  <span>{splitDishes[0]?.label}</span>
                </div>
                <Slider defaultValue={[75]} min={splitMin} max={100 - splitMin} step={5} />
                <div className="flex justify-between text-xs">
                  <span>{splitMin}%</span>
                  <span>{100 - splitMin}%</span>
                </div>
              </div>
            )}
            {modType === 'split' && splitDishes.length === 0 && (
              <p className="text-sm text-muted-foreground">Dodaj co najmniej jedno danie do podziału</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
