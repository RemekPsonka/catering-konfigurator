import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/calculations';
import type { OfferTotals } from '@/lib/calculations';

interface SummaryCardProps {
  totals: OfferTotals;
  deliveryCost: number;
  peopleCount: number;
}

export const SummaryCard = ({ totals, deliveryCost, peopleCount }: SummaryCardProps) => (
  <Card className="border-primary/30">
    <CardHeader>
      <CardTitle className="text-base">Podsumowanie końcowe</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Dania (najdroższy wariant):</span>
        <span>{formatCurrency(totals.maxDishesTotal)}</span>
      </div>
      {totals.discountAmount > 0 && (
        <>
          <div className="flex justify-between text-sm text-destructive">
            <span>Rabat:</span>
            <span>-{formatCurrency(totals.discountAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Dania po rabacie:</span>
            <span>{formatCurrency(totals.dishesAfterDiscount)}</span>
          </div>
        </>
      )}
      <div className="flex justify-between text-sm">
        <span>Usługi:</span>
        <span>{formatCurrency(totals.servicesTotalCalc)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Dostawa:</span>
        <span>{formatCurrency(deliveryCost)}</span>
      </div>
      <Separator />
      <div className="flex justify-between text-lg font-bold">
        <span>ŁĄCZNIE:</span>
        <span>{formatCurrency(totals.grandTotal)}</span>
      </div>
      {peopleCount > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Cena za osobę:</span>
          <span>{formatCurrency(totals.pricePerPerson)}</span>
        </div>
      )}
    </CardContent>
  </Card>
);
