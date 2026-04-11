import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Truck } from 'lucide-react';

interface DeliveryPanelProps {
  deliveryCost: number;
  onDeliveryCostChange: (val: number) => void;
}

export const DeliveryPanel = ({ deliveryCost, onDeliveryCostChange }: DeliveryPanelProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <Truck className="h-4 w-4" />
        Dostawa
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-4">
        <div className="w-40">
          <Input
            type="number"
            min={0}
            value={deliveryCost || ''}
            onChange={(e) => onDeliveryCostChange(Number(e.target.value))}
            placeholder="0,00"
          />
        </div>
        <span className="text-sm text-muted-foreground">zł</span>
      </div>
    </CardContent>
  </Card>
);
