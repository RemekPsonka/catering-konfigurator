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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Truck, Receipt, MessageSquare, FileText, Lock, Loader2 } from 'lucide-react';
import { RequirementHints } from '../requirement-hints';
import type { ClientRequirement } from '../requirements-sidebar';
import { useOfferVariants, getItemPrice } from '@/hooks/use-offer-variants';
import { useOfferServices } from '@/hooks/use-offer-services';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

interface StepCalculationProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
  inquiryText?: string;
  eventType?: string;
  eventDate?: string | null;
  clientName?: string;
  requirements?: ClientRequirement[];
}

type DiscountType = 'percent' | 'value';

export const StepCalculation = ({
  offerId,
  pricingMode,
  peopleCount,
  inquiryText,
  eventType,
  eventDate,
  clientName,
  requirements = [],
}: StepCalculationProps) => {
  const queryClient = useQueryClient();
  const { data: variants = [] } = useOfferVariants(offerId);
  const { data: offerServices = [] } = useOfferServices(offerId);

  const offerQuery = useQuery({
    queryKey: ['offer-calc', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('discount_percent, discount_value, delivery_cost, greeting_text, ai_summary, notes_client, notes_internal')
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
  const [aiSummary, setAiSummary] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

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
      setAiSummary(d.ai_summary ?? '');
      setNotesClient(d.notes_client ?? '');
      setNotesInternal(d.notes_internal ?? '');
      setLoaded(true);
    }
  }, [offerQuery.data, loaded]);

  // Use shared calculation function
  const totals = useMemo(() => {
    const dp = discountType === 'percent' ? discountPercent : 0;
    const dv = discountType === 'value' ? discountValue : 0;
    return calculateOfferTotals(pricingMode, peopleCount, variants, offerServices, dp, dv, deliveryCost);
  }, [variants, offerServices, pricingMode, peopleCount, discountType, discountPercent, discountValue, deliveryCost]);

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<{ discount_percent: number; discount_value: number; delivery_cost: number; greeting_text: string | null; ai_summary: string | null; notes_client: string | null; notes_internal: string | null; total_dishes_value: number; total_services_value: number; total_value: number; price_per_person: number }>) => {
      if (!offerId) return;
      const { error } = await supabase.from('offers').update(payload).eq('id', offerId);
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
  const debouncedAiSummary = useDebounce(aiSummary, 800);
  const debouncedNotesClient = useDebounce(notesClient, 800);
  const debouncedNotesInternal = useDebounce(notesInternal, 800);

  useEffect(() => {
    if (!loaded || !offerId) return;
    saveMutation.mutate({ greeting_text: debouncedGreeting || null });
  }, [debouncedGreeting]);

  useEffect(() => {
    if (!loaded || !offerId) return;
    saveMutation.mutate({ ai_summary: debouncedAiSummary || null });
  }, [debouncedAiSummary]);

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
      total_dishes_value: totals.maxDishesTotal,
      total_services_value: totals.servicesTotalCalc,
      total_value: totals.grandTotal,
      price_per_person: totals.pricePerPerson,
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

  useEffect(() => {
    if (!loaded) return;
    saveFinancials();
  }, [discountPercent, discountValue, discountType, deliveryCost, totals.maxDishesTotal, totals.servicesTotalCalc]);

  // AI greeting generation
  const handleGenerateGreeting = async () => {
    setIsGenerating(true);
    try {
      const eventTypeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label ?? eventType;

      const { data, error } = await supabase.functions.invoke('generate-greeting', {
        body: {
          event_type_label: eventTypeLabel,
          event_date: eventDate,
          inquiry_text: inquiryText,
          client_name: clientName,
          people_count: peopleCount,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.greeting) {
        setGreetingText(data.greeting);
        toast.success('Tekst wygenerowany');
      }
    } catch (e) {
      toast.error('Nie udało się wygenerować tekstu');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI summary generation
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const eventTypeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label ?? eventType;
      const pricingModeLabel = pricingMode === 'PER_PERSON' ? 'per person' : 'ilości stałe';

      const variantsSummary = variants
        .map((v) => {
          const dishes = v.variant_items
            .map((item) => {
              const name = item.custom_name || item.dishes?.display_name || item.dishes?.name || '?';
              const price = getItemPrice(item);
              return `${name} (${price} zł)`;
            })
            .join(', ');
          return `${v.name}: ${dishes || 'brak dań'}`;
        })
        .join(' | ');

      const servicesSummary = offerServices
        .map((os) => {
          const price = os.custom_price ?? os.services.price;
          const qty = os.quantity ?? 1;
          return `${os.services.name} (${price} zł × ${qty})`;
        })
        .join(', ');

      const discountInfo = discountPercent > 0
        ? `Rabat: ${discountPercent}%`
        : discountValue > 0
          ? `Rabat: ${discountValue} zł`
          : null;

      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: {
          inquiry_text: inquiryText,
          event_type_label: eventTypeLabel,
          variants_summary: variantsSummary,
          total_value: totals.grandTotal,
          services_summary: servicesSummary,
          people_count: peopleCount,
          event_date: eventDate,
          client_name: clientName,
          discount_info: discountInfo,
          delivery_cost: deliveryCost > 0 ? deliveryCost : null,
          pricing_mode_label: pricingModeLabel,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      if (data?.summary) {
        setAiSummary(data.summary);
        toast.success('Podsumowanie wygenerowane');
      }
    } catch (e) {
      toast.error('Nie udało się wygenerować podsumowania');
    } finally {
      setIsGeneratingSummary(false);
    }
  };


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
      {requirements.length > 0 && (
        <RequirementHints
          requirements={requirements}
          category="budget"
          currentPricePerPerson={totals.pricePerPerson}
        />
      )}
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
                  <TableCell className="text-right font-bold">{formatCurrency(totals.servicesTotalCalc)}</TableCell>
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
                  Rabat {discountPercent}% = <strong>{formatCurrency(totals.discountAmount)}</strong>
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
          {totals.discountAmount > 0 && (
            <p className="text-sm font-medium">
              Dania po rabacie: {formatCurrency(totals.dishesAfterDiscount)}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateGreeting}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Generowanie...' : '🤖 Generuj z AI'}
          </Button>
          {!inquiryText && (
            <p className="text-xs text-muted-foreground">
              Podpowiedź: uzupełnij „Treść zapytania" w kroku 1, aby AI wygenerował bardziej spersonalizowany tekst.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sekcja 6b — Podsumowanie AI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Podsumowanie oferty (AI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={aiSummary}
            onChange={(e) => setAiSummary(e.target.value)}
            placeholder="Podsumowanie oferty widoczne dla klienta..."
            rows={4}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
          >
            {isGeneratingSummary ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGeneratingSummary ? 'Generowanie...' : '🤖 Generuj podsumowanie AI'}
          </Button>
          {!inquiryText && (
            <p className="text-xs text-muted-foreground">
              Podpowiedź: uzupełnij „Treść zapytania" w kroku 1, aby podsumowanie było bardziej trafne.
            </p>
          )}
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
            <Label className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Notatki wewnętrzne
            </Label>
            <Textarea
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              placeholder="Widoczne tylko w panelu admina..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">🔒 Nie będą widoczne na ofercie klienta.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
