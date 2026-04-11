import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Wrench, Percent, ChevronDown, Save, Gift, User } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';
import { useOfferVariants } from '@/hooks/use-offer-variants';
import { useServices } from '@/hooks/use-services';
import {
  useOfferServices,
  useAddOfferService,
  useUpdateOfferService,
  useRemoveOfferService,
  type OfferServiceWithService,
} from '@/hooks/use-offer-services';
import { SERVICE_TYPE_LABELS, PRICE_TYPE_LABELS } from '@/lib/service-constants';
import { RequirementHints } from '../requirement-hints';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import type { ClientRequirement } from '../requirements-sidebar';
import type { Tables } from '@/integrations/supabase/types';

interface StepPricingProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
  requirements?: ClientRequirement[];
  inquiryText?: string;
}

type DiscountType = 'percent' | 'value';
const SERVICE_GROUPS = ['STAFF', 'EQUIPMENT', 'LOGISTICS'] as const;

export const StepPricing = ({ offerId, pricingMode, peopleCount, requirements = [] }: StepPricingProps) => {
  const queryClient = useQueryClient();
  const [servicesOpen, setServicesOpen] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(true);

  // ── Services logic ──
  const { data: allServices, isLoading: loadingServices } = useServices();
  const { data: offerServices, isLoading: loadingOfferServices } = useOfferServices(offerId);
  const addService = useAddOfferService();
  const updateService = useUpdateOfferService();
  const removeService = useRemoveOfferService();

  const activeServices = useMemo(() => (allServices ?? []).filter((s) => s.is_active), [allServices]);
  const offerServiceMap = useMemo(() => {
    const map = new Map<string, OfferServiceWithService>();
    (offerServices ?? []).forEach((os) => map.set(os.service_id, os));
    return map;
  }, [offerServices]);
  const grouped = useMemo(() => {
    const groups: Record<string, Tables<'services'>[]> = {};
    for (const type of SERVICE_GROUPS) groups[type] = activeServices.filter((s) => s.type === type);
    return groups;
  }, [activeServices]);

  useEffect(() => {
    if (!peopleCount || peopleCount < 1) return;
    (offerServices ?? []).forEach((os) => {
      if (os.services.price_type === 'PER_PERSON' && (os.quantity ?? 1) !== peopleCount) {
        handleServiceUpdate(os.services.id, 'quantity', peopleCount);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleCount, offerServices]);

  const handleServiceToggle = (service: Tables<'services'>, checked: boolean) => {
    if (!offerId) return;
    if (checked) {
      const qty = service.price_type === 'PER_PERSON' && peopleCount > 0 ? peopleCount : 1;
      addService.mutate({ offerId, serviceId: service.id, quantity: qty });
    } else {
      const os = offerServiceMap.get(service.id);
      if (os) removeService.mutate({ id: os.id, offerId });
    }
  };

  const handleServiceUpdate = (serviceId: string, field: 'quantity' | 'customPrice' | 'notes', value: number | string | null) => {
    if (!offerId) return;
    const os = offerServiceMap.get(serviceId);
    if (!os) return;
    updateService.mutate({ id: os.id, offerId, [field]: value });
  };

  // ── Variants + discount/delivery state ──
  const { data: variants = [] } = useOfferVariants(offerId);

  // ── Upsell selections (read-only) ──
  const upsellQuery = useQuery({
    queryKey: ['offer-upsell-selections', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_upsell_selections')
        .select('*, upsell_items(name, emoji)')
        .eq('offer_id', offerId!)
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!offerId,
  });
  const upsellSelections = upsellQuery.data ?? [];
  const upsellTotal = useMemo(
    () => upsellSelections.reduce((sum, s) => sum + Number(s.total_price), 0),
    [upsellSelections],
  );

  const offerCalcQuery = useQuery({
    queryKey: ['offer-calc', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase.from('offers').select('discount_percent, discount_value, delivery_cost, coordinator_name, coordinator_phone').eq('id', offerId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');

  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (offerCalcQuery.data && !loaded) {
      const d = offerCalcQuery.data;
      const pct = Number(d.discount_percent ?? 0);
      const val = Number(d.discount_value ?? 0);
      setDiscountPercent(pct);
      setDiscountValue(val);
      setDiscountType(pct > 0 ? 'percent' : 'value');
      setDeliveryCost(Number(d.delivery_cost ?? 0));
      setCoordinatorName(d.coordinator_name ?? '');
      setCoordinatorPhone(d.coordinator_phone ?? '');
      setLoaded(true);
    }
  }, [offerCalcQuery.data, loaded]);

  const totals = useMemo(() => {
    const dp = discountType === 'percent' ? Math.min(100, Math.max(0, discountPercent)) : 0;
    const dv = discountType === 'value' ? discountValue : 0;
    return calculateOfferTotals(pricingMode, peopleCount, variants, offerServices ?? [], dp, dv, deliveryCost, upsellTotal);
  }, [variants, offerServices, pricingMode, peopleCount, discountType, discountPercent, discountValue, deliveryCost, upsellTotal]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!offerId) return;
      const dp = discountType === 'percent' ? discountPercent : 0;
      const dv = discountType === 'value' ? discountValue : 0;
      if (dv > 0) {
        const maxTotal = Math.max(...totals.variantTotals.map(v => v.total), 0);
        if (dv > maxTotal) {
          toast.error(`Rabat (${dv} zł) nie może przekroczyć wartości dań (${maxTotal.toFixed(2)} zł)`);
          throw new Error('Discount exceeds total');
        }
      }
      const { error } = await supabase.from('offers').update({
        discount_percent: dp,
        discount_value: dv,
        delivery_cost: deliveryCost,
        total_dishes_value: totals.maxDishesTotal,
        total_services_value: totals.servicesTotalCalc,
        total_value: totals.grandTotal,
        price_per_person: totals.pricePerPerson,
        upsell_total: upsellTotal,
        coordinator_name: coordinatorName || null,
        coordinator_phone: coordinatorPhone || null,
      }).eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer-preview', offerId] });
      toast.success('Wycena zapisana');
    },
    onError: (err) => {
      if (err.message !== 'Discount exceeds total') toast.error('Nie udało się zapisać wyceny');
    },
  });

  const formatPrice = (price: number) =>
    price.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

  if (loadingServices || loadingOfferServices) return <LoadingSpinner />;
  if (!offerId) return <p className="text-muted-foreground text-center py-12">Najpierw zapisz szkic oferty.</p>;

  const selectedCount = offerServices?.length ?? 0;

  return (
    <div className="space-y-4">
      {requirements.length > 0 && <RequirementHints requirements={requirements} category="service" />}

      {/* Section 1: Services */}
      <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Usługi dodatkowe
                  {selectedCount > 0 && <Badge variant="secondary">{selectedCount}</Badge>}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {SERVICE_GROUPS.map((type) => {
                const services = grouped[type];
                if (!services || services.length === 0) return null;
                return (
                  <div key={type} className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">{SERVICE_TYPE_LABELS[type]}</h4>
                    {services.map((service) => {
                      const os = offerServiceMap.get(service.id);
                      const isSelected = !!os;
                      return (
                        <div key={service.id} className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isSelected} onCheckedChange={(checked) => handleServiceToggle(service, !!checked)} />
                            <div className="flex-1 flex items-center gap-2">
                              <span className="font-medium">{service.name}</span>
                              <Badge variant="outline" className="text-xs">{PRICE_TYPE_LABELS[service.price_type]}</Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">{formatPrice(service.price)}</span>
                          </div>
                          {service.description && <p className="text-sm text-muted-foreground ml-7">{service.description}</p>}
                          {isSelected && (
                            <div className="ml-7 grid grid-cols-3 gap-3">
                              <div>
                                {service.price_type === 'PER_PERSON' ? (
                                  <>
                                    <Label className="text-xs">Ilość (= liczba osób)</Label>
                                    <Input type="number" value={peopleCount ?? os.quantity ?? 1} disabled className="h-8 bg-muted" />
                                  </>
                                ) : (
                                  <>
                                    <Label className="text-xs">Ilość</Label>
                                    <Input type="number" min={1} value={os.quantity ?? 1} onChange={(e) => handleServiceUpdate(service.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} className="h-8" />
                                  </>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs">Cena (opcjonalnie)</Label>
                                <Input type="number" min={0} step={0.01} placeholder={service.price.toString()} value={os.custom_price ?? ''} onChange={(e) => handleServiceUpdate(service.id, 'customPrice', e.target.value === '' ? null : parseFloat(e.target.value))} className="h-8" />
                              </div>
                              <div>
                                <Label className="text-xs">Notatki</Label>
                                <Input placeholder="Opcjonalne" value={os.notes ?? ''} onChange={(e) => handleServiceUpdate(service.id, 'notes', e.target.value || null)} className="h-8" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 1b: Upsell (read-only) */}
      {upsellSelections.length > 0 && (
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Dodatki klienta
                    <Badge variant="secondary">{upsellSelections.length}</Badge>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Wybrane przez klienta — tylko do odczytu</p>
                {upsellSelections.map((sel) => {
                  const item = sel.upsell_items as unknown as { name: string; emoji: string | null } | null;
                  return (
                    <div key={sel.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="flex items-center gap-2">
                        <span>{item?.emoji ?? '🛒'}</span>
                        <span className="font-medium">{item?.name ?? 'Dodatek'}</span>
                        {sel.quantity > 1 && (
                          <Badge variant="outline" className="text-xs">×{sel.quantity}</Badge>
                        )}
                      </span>
                      <span className="font-medium">
                        {sel.quantity > 1
                          ? `${formatCurrency(Number(sel.unit_price))} × ${sel.quantity} = ${formatCurrency(Number(sel.total_price))}`
                          : formatCurrency(Number(sel.total_price))}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between font-semibold text-sm pt-2 border-t">
                  <span>Suma dodatków</span>
                  <span>{formatCurrency(upsellTotal)}</span>
                </div>
                {!upsellSelections.every((s) => s.confirmed_at) && (
                  <p className="text-xs text-amber-600">⚠ Dodatki jeszcze nie zatwierdzone przez klienta</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Section 2: Discount & Delivery */}
      <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Rabat i dostawa
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${discountOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Rodzaj rabatu</Label>
                <RadioGroup value={discountType} onValueChange={(v) => {
                  setDiscountType(v as DiscountType);
                  if (v === 'percent') setDiscountValue(0);
                  else setDiscountPercent(0);
                }} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="percent" id="dt-percent" />
                    <Label htmlFor="dt-percent">Procentowy</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="value" id="dt-value" />
                    <Label htmlFor="dt-value">Kwotowy</Label>
                  </div>
                </RadioGroup>
              </div>

              {discountType === 'percent' ? (
                <div className="max-w-xs">
                  <Label>Rabat (%)</Label>
                  <Input type="number" min={0} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} />
                  {discountPercent > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Rabat {discountPercent}% = {formatCurrency(totals.discountAmount)}</p>
                  )}
                </div>
              ) : (
                <div className="max-w-xs">
                  <Label>Rabat (zł)</Label>
                  <Input type="number" min={0} step={0.01} value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} />
                </div>
              )}

              <div className="max-w-xs">
                <Label>Koszt dostawy (zł)</Label>
                <Input type="number" min={0} step={0.01} value={deliveryCost} onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)} />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz wycenę
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section 2b: Coordinator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Koordynator wydarzenia
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Imię i nazwisko</Label>
            <Input
              placeholder="np. Jan Kowalski"
              value={coordinatorName}
              onChange={(e) => setCoordinatorName(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Telefon</Label>
            <Input
              placeholder="np. +48 123 456 789"
              value={coordinatorPhone}
              onChange={(e) => setCoordinatorPhone(e.target.value)}
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Summary (sticky) */}
      <Card className="sticky bottom-0 bg-background border-t z-10">
        <CardContent className="pt-4 pb-2 space-y-2">
          <h4 className="font-semibold text-sm">Podsumowanie</h4>
          {totals.variantTotals.map((vt) => (
            <div key={vt.id} className="flex justify-between text-sm">
              <span>{vt.name}</span>
              <span>{formatCurrency(vt.total)}</span>
            </div>
          ))}
          {totals.servicesTotalCalc > 0 && (
            <div className="flex justify-between text-sm">
              <span>Usługi</span>
              <span>{formatCurrency(totals.servicesTotalCalc)}</span>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Rabat</span>
              <span>-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          {upsellTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Dodatki klienta</span>
              <span>{formatCurrency(upsellTotal)}</span>
            </div>
          )}
          {deliveryCost > 0 && (
            <div className="flex justify-between text-sm">
              <span>Dostawa</span>
              <span>{formatCurrency(deliveryCost)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>RAZEM</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
          {pricingMode === 'PER_PERSON' && peopleCount > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Cena za osobę</span>
              <span>{formatCurrency(totals.pricePerPerson)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
