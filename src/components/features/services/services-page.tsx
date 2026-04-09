import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useServices, useCreateService, useUpdateService, useToggleServiceActive } from '@/hooks/use-services';
import { SERVICE_TYPE_LABELS, PRICE_TYPE_LABELS } from '@/lib/service-constants';
import { ServiceDialog } from './service-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import type { Tables } from '@/integrations/supabase/types';

const TABS = [
  { value: '', label: 'Wszystkie' },
  { value: 'STAFF', label: 'Obsługa' },
  { value: 'EQUIPMENT', label: 'Sprzęt' },
  { value: 'LOGISTICS', label: 'Logistyka' },
];

export const ServicesPage = () => {
  const [filterType, setFilterType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Tables<'services'> | null>(null);

  const { data: services, isLoading } = useServices({ filterType: filterType || null });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const toggleActive = useToggleServiceActive();

  const handleSubmit = (values: Record<string, unknown>) => {
    const payload = values as Parameters<typeof createService.mutate>[0];
    if (editingService) {
      updateService.mutate({ id: editingService.id, ...payload }, {
        onSuccess: () => { setDialogOpen(false); setEditingService(null); },
      });
    } else {
      createService.mutate(payload, {
        onSuccess: () => { setDialogOpen(false); },
      });
    }
  };

  const handleEdit = (service: Tables<'services'>) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(price);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Usługi dodatkowe</h1>
        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" />Dodaj usługę</Button>
      </div>

      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingSpinner />
      ) : !services?.length ? (
        <EmptyState title="Brak usług" description="Dodaj pierwszą usługę, aby rozpocząć." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Typ ceny</TableHead>
              <TableHead className="text-right">Cena</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{SERVICE_TYPE_LABELS[service.type] || service.type}</Badge>
                </TableCell>
                <TableCell>{PRICE_TYPE_LABELS[service.price_type] || service.price_type}</TableCell>
                <TableCell className="text-right">{formatPrice(Number(service.price))}</TableCell>
                <TableCell>
                  <Switch
                    checked={service.is_active ?? true}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: service.id, isActive: checked })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>Edytuj</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingService(null); }}
        service={editingService}
        onSubmit={handleSubmit}
        isLoading={createService.isPending || updateService.isPending}
      />
    </div>
  );
};
