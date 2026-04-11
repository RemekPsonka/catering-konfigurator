import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/calculations';
import type { DiscountType } from '@/hooks/use-calculation-state';

interface DiscountPanelProps {
  discountType: DiscountType;
  discountPercent: number;
  discountValue: number;
  discountAmount: number;
  dishesAfterDiscount: number;
  maxDishesTotal: number;
  onTypeChange: (value: string) => void;
  onValueChange: (val: number) => void;
}

export const DiscountPanel = ({
  discountType,
  discountPercent,
  discountValue,
  discountAmount,
  dishesAfterDiscount,
  maxDishesTotal,
  onTypeChange,
  onValueChange,
}: DiscountPanelProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Rabat</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <RadioGroup value={discountType} onValueChange={onTypeChange} className="flex gap-6">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="percent" id="disc-pct" />
          <Label htmlFor="disc-pct">Rabat procentowy</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="value" id="disc-val" />
          <Label htmlFor="disc-val">Rabat kwotowy</Label>
        </div>
      </RadioGroup>

      {discountType === 'percent' ? (
        <div className="flex items-center gap-4">
          <div className="w-32">
            <Input
              type="number"
              min={0}
              max={100}
              value={discountPercent || ''}
              onChange={(e) => onValueChange(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <span className="text-sm text-muted-foreground">%</span>
          {discountPercent > 0 && (
            <span className="text-sm">
              Rabat {discountPercent}% = <strong>{formatCurrency(discountAmount)}</strong>
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-40">
            <Input
              type="number"
              min={0}
              value={discountValue || ''}
              onChange={(e) => onValueChange(Number(e.target.value))}
              placeholder="0,00"
              className={discountValue > 0 && maxDishesTotal > 0 && discountValue > maxDishesTotal ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
          </div>
          <span className="text-sm text-muted-foreground">zł</span>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Rabat dotyczy tylko dań (nie usług i dostawy).
      </p>
      {discountAmount > 0 && (
        <p className="text-sm font-medium">
          Dania po rabacie: {formatCurrency(dishesAfterDiscount)}
        </p>
      )}
    </CardContent>
  </Card>
);
