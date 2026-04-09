import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Info, Truck, Receipt, MessageSquare, FileText } from 'lucide-react';
import { useOfferVariants, getItemPrice, type VariantWithItems } from '@/hooks/use-offer-variants';
import { useOfferServices } from '@/hooks/use-offer-services';
import { formatCurrency } from '@/lib/calculations';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

interface StepCalculationProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
}

type DiscountType = 'percent' | 'value';

export const StepCalculation = ({ offerId, pricingMode, peopleCount }: StepCalculationProps) => {
  const queryClient = useQueryClient();
  const { data: variants = [] } = useOfferVariants(offerId);
  const { data: offerServices = [] } = useOfferServices(offerId);

  const offerQuery = useQuery({
    queryKey: ['offer-calc', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('discount_percent, discount_value, delivery_cost, greeting_text, notes_client, notes_internal')
        .eq('id', offerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [greetingText, setGreetingText] = useState('');
  const [notesClient, setNotesClient] = useState('');
  const [notesInternal, setNotesInternal] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (offerQuery.data && !loaded) {
      const d = offerQuery.data;
      const pct = Number(d.discount_percent ?? 0);
      const val = Number(d.discount_value ?? 0);
      setDiscountPercent(pct);
      setDiscountValue(val);
      setDiscountType(pct > 0 ? 'percent' : 'value');
      setDeliveryCost(Number(d.delivery_cost ?? 0));
      setGreetingText(d.greeting_text ?? '');
      setNotesClient(d.notes_client ?? '');
      setNotesInternal(d.notes_internal ?? '');
      setLoaded(true);
    }
  }, [offerQuery.data, loaded]);

  // Calculations
  const calculateVariantTotal = (variant: VariantWithItems): number => {
    return variant.variant_items.reduce((sum, item) => {
      const price = getItemPrice(item);
      const qty = item.quantity ?? 1;
      return sum + price * qty;
    }, 0);
  };

  const variantTotals = useMemo(() => {
    return variants.map(v => ({
      id: v.id,
      name: v.name,
      perPerson: calculateVariantTotal(v),
      total: pricingMode === 'PER_PERSON'
        ? calculateVariantTotal(v) * peopleCount
        : calculateVariantTotal(v),
    }));
  }, [variants, pricingMode, peopleCount]);

  const maxDishesTotal = useMemo(() => {
    if (variantTotals.length === 0) return 0;
    return Math.max(...variantTotals.map(v => v.total));
  }, [variantTotals]);

  const servicesTotalCalc = useMemo(() => {
    return offerServices.reduce((sum, os) => {
      const price = os.custom_price != null ? Number(os.custom_price) : os.services.price;
      return sum + price * (os.quantity ?? 1);
    }, 0);
  }, [offerServices]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent' && discountPercent > 0) {
      return Math.round(maxDishesTotal * discountPercent / 100 * 100) / 100;
    }
    return discountValue;
  }, [discountType, discountPercent, discountValue, maxDishesTotal]);

  const dishesAfterDiscount = maxDishesTotal - discountAmount;
  const grandTotal = dishesAfterDiscount + servicesTotalCalc + deliveryCost;
  const pricePerPerson = peopleCount > 0 ? Math.round(grandTotal / peopleCount * 100) / 100 : 0;

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof supabase.from<'offers'>>[0] extends infer _ ? Record<string, unknown> : never) => {
      if (!offerId) return;
      const { error } = await supabase.from('offers').update(payload as any).eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
    onError: () => {
      toast.error('Nie udało się zapisać zmian');
    },
  });

  const debouncedGreeting = useDebounce(greetingText, 800);
  const debouncedNotesClient = useDebounce(notesClient, 800);
  const debouncedNotesInternal = useDebounce(notesInternal, 800);

  // Auto-save texts
  useEffect(() => {
    if (!loaded || !offerId) return;
    saveMutation.mutate({ greeting_text: debouncedGreeting || null });
  }, [debouncedGreeting]);

  useEffect(() => {
    if (!loaded || !offerId) return;
    saveMutation.mutate({ notes_client: debouncedNotesClient || null });
  }, [debouncedNotesClient]);

  useEffect(() => {
    if (!loaded || !offerId) return;
    saveMutation.mutate({ notes_internal: debouncedNotesInternal || null });
  }, [debouncedNotesInternal]);

  // Save financial data
  const saveFinancials = () => {
    if (!offerId) return;
    const dp = discountType === 'percent' ? discountPercent : 0;
    const dv = discountType === 'value' ? discountValue : 0;
    saveMutation.mutate({
      discount_percent: dp,
      discount_value: dv,
      delivery_cost: deliveryCost,
      total_dishes_value: maxDishesTotal,
      total_services_value: servicesTotalCalc,
      total_value: grandTotal,
      price_per_person: pricePerPerson,
    });
  };

  const handleDiscountTypeChange = (value: string) => {
    setDiscountType(value as DiscountType);
    if (value === 'percent') setDiscountValue(0);
    else setDiscountPercent(0);
    setTimeout(saveFinancials, 100);
  };

  const handleDiscountChange = (val: number) => {
    if (discountType === 'percent') setDiscountPercent(val);
    else setDiscountValue(val);
  };

  // Save financials on blur
  useEffect(() => {
    if (!loaded) return;
    saveFinancials();
  }, [discountPercent, discountValue, discountType, deliveryCost, maxDishesTotal, servicesTotalCalc]);

  if (!offerId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Zapisz ofertę w kroku 1, aby zobaczyć kalkulację.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sekcja 1 — Warianty */}
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
                const vTotal = variantTotals.find(vt => vt.id === variant.id);
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
                                <TableCell>{item.custom_name || item.dishes.display_name}</TableCell>
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

      {/* Sekcja 2 — Usługi */}
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
                  const qty = os.quantity ?? 1;
                  return (
                    <TableRow key={os.id}>
                      <TableCell>{os.services.name}</TableCell>
                      <TableCell className="text-right">{qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(price * qty)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">Usługi łącznie:</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(servicesTotalCalc)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sekcja 3 — Rabat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rabat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={discountType} onValueChange={handleDiscountTypeChange} className="flex gap-6">
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
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
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
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  placeholder="0,00"
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

      {/* Sekcja 4 — Dostawa */}
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
                onChange={(e) => setDeliveryCost(Number(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <span className="text-sm text-muted-foreground">zł</span>
          </div>
        </CardContent>
      </Card>

      {/* Sekcja 5 — Podsumowanie */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">Podsumowanie końcowe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Dania (najdroższy wariant):</span>
            <span>{formatCurrency(maxDishesTotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Rabat:</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Usługi:</span>
            <span>{formatCurrency(servicesTotalCalc)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Dostawa:</span>
            <span>{formatCurrency(deliveryCost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>ŁĄCZNIE:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          {peopleCount > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Cena za osobę:</span>
              <span>{formatCurrency(pricePerPerson)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sekcja 6 — Tekst powitalny */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Tekst powitalny
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={greetingText}
            onChange={(e) => setGreetingText(e.target.value)}
            placeholder="Tekst powitalny dla klienta..."
            rows={4}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" disabled>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Wygeneruj z AI
                </Button>
              </TooltipTrigger>
              <TooltipContent>Wkrótce</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Sekcja 7 — Notatki */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Notatki
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notatki dla klienta</Label>
            <Textarea
              value={notesClient}
              onChange={(e) => setNotesClient(e.target.value)}
              placeholder="Widoczne dla klienta na ofercie..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Notatki wewnętrzne</Label>
            <Textarea
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              placeholder="Widoczne tylko w panelu admina..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Nie będą widoczne na ofercie klienta.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
