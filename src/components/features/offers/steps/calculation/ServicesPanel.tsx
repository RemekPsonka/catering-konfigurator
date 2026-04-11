import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getServiceEffectiveQty, getServiceLineTotal } from '@/lib/calculations';
import type { OfferServiceWithService } from '@/hooks/use-offer-services';

interface ServicesPanelProps {
  offerServices: OfferServiceWithService[];
  servicesTotal: number;
  peopleCount: number;
}

export const ServicesPanel = ({ offerServices, servicesTotal, peopleCount }: ServicesPanelProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Usługi dodatkowe</CardTitle>
    </CardHeader>
    <CardContent>
      {offerServices.length === 0 ? (
        <p className="text-muted-foreground text-sm">Brak usług. Dodaj w kroku 3.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usługa</TableHead>
              <TableHead className="w-20 text-right">Ilość</TableHead>
              <TableHead className="w-28 text-right">Cena</TableHead>
              <TableHead className="w-28 text-right">Suma</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offerServices.map((os) => {
              const price = os.custom_price != null ? Number(os.custom_price) : os.services.price;
              const priceType = os.services.price_type;
              const qty = getServiceEffectiveQty(priceType, os.quantity, peopleCount);
              const isBlock = priceType === 'PER_BLOCK';
              const extraBlock = os.services.extra_block_price != null ? Number(os.services.extra_block_price) : null;
              const lineTotal = getServiceLineTotal(price, priceType, os.quantity, peopleCount, extraBlock);
              return (
                <TableRow key={os.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{os.services.name}</span>
                      {os.services.price_type === 'PER_PERSON' && (
                        <Badge variant="outline" className="text-xs">na osobę</Badge>
                      )}
                      {isBlock && os.services.block_duration_hours && (
                        <Badge variant="outline" className="text-xs">blok {os.services.block_duration_hours}h</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isBlock && os.services.block_unit_label
                      ? `${qty} × ${os.services.block_unit_label}`
                      : qty}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(lineTotal)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">Usługi łącznie:</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(servicesTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </CardContent>
  </Card>
);
