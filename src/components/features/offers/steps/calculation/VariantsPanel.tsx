import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';
import { formatCurrency, getItemPrice } from '@/lib/calculations';
import type { OfferTotals, VariantWithItems } from '@/lib/calculations';

interface VariantsPanelProps {
  variants: VariantWithItems[];
  totals: OfferTotals;
  pricingMode: string;
  peopleCount: number;
}

export const VariantsPanel = ({ variants, totals, pricingMode, peopleCount }: VariantsPanelProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Receipt className="h-5 w-5" />
        Kalkulacja dań per wariant
      </CardTitle>
    </CardHeader>
    <CardContent>
      {variants.length === 0 ? (
        <p className="text-muted-foreground text-sm">Brak wariantów. Dodaj dania w kroku 2.</p>
      ) : (
        <Accordion type="multiple" defaultValue={variants.map(v => v.id)}>
          {variants.map((variant) => {
            const vTotal = totals.variantTotals.find(vt => vt.id === variant.id);
            return (
              <AccordionItem key={variant.id} value={variant.id}>
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    {variant.name}
                    {variant.is_recommended && <Badge variant="secondary" className="text-xs">Polecany</Badge>}
                    <span className="text-muted-foreground ml-2">
                      {formatCurrency(vTotal?.total ?? 0)}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Danie</TableHead>
                        <TableHead className="w-20 text-right">Ilość</TableHead>
                        <TableHead className="w-28 text-right">Cena jedn.</TableHead>
                        <TableHead className="w-28 text-right">Suma</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variant.variant_items.map((item) => {
                        const price = getItemPrice(item);
                        const qty = item.quantity ?? 1;
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span>{item.custom_name || item.dishes.display_name}</span>
                                  {item.selected_variant_option && (
                                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                      ✓ {item.selected_variant_option}
                                    </Badge>
                                  )}
                                </div>
                                {item.custom_name && item.custom_name !== item.dishes.display_name && (
                                  <span className="text-xs text-blue-600">zamiana z: {item.dishes.display_name}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{qty}</TableCell>
                            <TableCell className="text-right">{formatCurrency(price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(price * qty)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          {pricingMode === 'PER_PERSON'
                            ? `${formatCurrency(vTotal?.perPerson ?? 0)}/os × ${peopleCount} os =`
                            : 'Razem:'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(vTotal?.total ?? 0)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </CardContent>
  </Card>
);
