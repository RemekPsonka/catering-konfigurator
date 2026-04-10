import { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/loading-spinner';
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
import type { ClientRequirement } from '../requirements-sidebar';
import type { Tables } from '@/integrations/supabase/types';

interface StepServicesProps {
  offerId: string | null;
  requirements?: ClientRequirement[];
  peopleCount?: number;
}

const SERVICE_GROUPS = ['STAFF', 'EQUIPMENT', 'LOGISTICS'] as const;

export const StepServices = ({ offerId, requirements = [], peopleCount }: StepServicesProps) => {
  const { data: allServices, isLoading: loadingServices } = useServices();
  const { data: offerServices, isLoading: loadingOfferServices } = useOfferServices(offerId);
  const addService = useAddOfferService();
  const updateService = useUpdateOfferService();
  const removeService = useRemoveOfferService();

  const activeServices = useMemo(
    () => (allServices ?? []).filter((s) => s.is_active),
    [allServices],
  );

  const offerServiceMap = useMemo(() => {
    const map = new Map<string, OfferServiceWithService>();
    (offerServices ?? []).forEach((os) => map.set(os.service_id, os));
    return map;
  }, [offerServices]);

  const grouped = useMemo(() => {
    const groups: Record<string, Tables<'services'>[]> = {};
    for (const type of SERVICE_GROUPS) {
      groups[type] = activeServices.filter((s) => s.type === type);
    }
    return groups;
  }, [activeServices]);

  // Auto-sync: usługi PER_PERSON mają ilość = people_count
  useEffect(() => {
    if (!peopleCount || peopleCount < 1) return;
    (offerServices ?? []).forEach((os) => {
      if (os.services.price_type === 'PER_PERSON' && (os.quantity ?? 1) !== peopleCount) {
        handleUpdate(os.services.id, 'quantity', peopleCount);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleCount]);

  const total = useMemo(() => {
    return (offerServices ?? []).reduce((sum, os) => {
      const price = os.custom_price ?? os.services.price;
      const qty = os.services.price_type === 'PER_PERSON' && peopleCount ? peopleCount : (os.quantity ?? 1);
      return sum + price * qty;
    }, 0);
  }, [offerServices, peopleCount]);

  const handleToggle = (service: Tables<'services'>, checked: boolean) => {
    if (!offerId) return;
    if (checked) {
      addService.mutate({ offerId, serviceId: service.id });
    } else {
      const os = offerServiceMap.get(service.id);
      if (os) {
        removeService.mutate({ id: os.id, offerId });
      }
    }
  };

  const handleUpdate = (
    serviceId: string,
    field: 'quantity' | 'customPrice' | 'notes',
    value: number | string | null,
  ) => {
    if (!offerId) return;
    const os = offerServiceMap.get(serviceId);
    if (!os) return;
    updateService.mutate({ id: os.id, offerId, [field]: value });
  };

  if (loadingServices || loadingOfferServices) {
    return <LoadingSpinner />;
  }

  if (!offerId) {
    return <p className="text-muted-foreground">Najpierw zapisz szkic oferty.</p>;
  }

  const formatPrice = (price: number) =>
    price.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

  return (
    <div className="space-y-6">
      {requirements.length > 0 && (
        <RequirementHints requirements={requirements} category="service" />
      )}
      {SERVICE_GROUPS.map((type) => {
        const services = grouped[type];
        if (!services || services.length === 0) return null;
        return (
          <Card key={type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{SERVICE_TYPE_LABELS[type]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.map((service) => {
                const os = offerServiceMap.get(service.id);
                const isSelected = !!os;
                return (
                  <div key={service.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToggle(service, !!checked)}
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <span className="font-medium">{service.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {PRICE_TYPE_LABELS[service.price_type]}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground ml-7">{service.description}</p>
                    )}
                    {isSelected && (
                      <div className="ml-7 grid grid-cols-3 gap-3">
                        <div>
                          {service.price_type === 'PER_PERSON' ? (
                            <>
                              <Label className="text-xs">Ilość (= liczba osób)</Label>
                              <Input
                                type="number"
                                value={peopleCount ?? os.quantity ?? 1}
                                disabled
                                className="h-8 bg-muted"
                              />
                              <span className="text-xs text-muted-foreground">Auto: {peopleCount ?? '—'} os.</span>
                            </>
                          ) : (
                            <>
                              <Label className="text-xs">Ilość</Label>
                              <Input
                                type="number"
                                min={1}
                                value={os.quantity ?? 1}
                                onChange={(e) =>
                                  handleUpdate(service.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="h-8"
                              />
                            </>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Cena (opcjonalnie)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder={service.price.toString()}
                            value={os.custom_price ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleUpdate(service.id, 'customPrice', val);
                            }}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Notatki</Label>
                          <Input
                            placeholder="Opcjonalne"
                            value={os.notes ?? ''}
                            onChange={(e) =>
                              handleUpdate(service.id, 'notes', e.target.value || null)
                            }
                            className="h-8"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Usługi łącznie:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
