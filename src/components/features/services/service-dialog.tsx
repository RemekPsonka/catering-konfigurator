import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Tables } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICE_TYPE_LABELS, PRICE_TYPE_LABELS } from '@/lib/service-constants';

const serviceSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  description: z.string().optional(),
  type: z.enum(['STAFF', 'EQUIPMENT', 'LOGISTICS']),
  price_type: z.enum(['PER_HOUR', 'PER_EVENT', 'PER_PIECE', 'PER_PERSON', 'PER_BLOCK']),
  price: z.coerce.number().min(0, 'Cena musi być >= 0'),
  is_active: z.boolean(),
  block_duration_hours: z.coerce.number().min(1).optional().nullable(),
  block_unit_label: z.string().optional().nullable(),
  extra_block_price: z.coerce.number().min(0).optional().nullable(),
  extra_block_label: z.string().optional().nullable(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Tables<'services'> | null;
  onSubmit: (values: ServiceFormValues) => void;
  isLoading?: boolean;
}

export const ServiceDialog = ({ open, onOpenChange, service, onSubmit, isLoading }: ServiceDialogProps) => {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'STAFF',
      price_type: 'PER_EVENT',
      price: 0,
      is_active: true,
      block_duration_hours: null,
      block_unit_label: null,
      extra_block_price: null,
      extra_block_label: null,
    },
  });

  const watchPriceType = form.watch('price_type');

  useEffect(() => {
    if (open) {
      if (service) {
        form.reset({
          name: service.name,
          description: service.description || '',
          type: service.type,
          price_type: service.price_type,
          price: Number(service.price),
          is_active: service.is_active ?? true,
          block_duration_hours: service.block_duration_hours ?? null,
          block_unit_label: service.block_unit_label ?? null,
          extra_block_price: service.extra_block_price != null ? Number(service.extra_block_price) : null,
          extra_block_label: service.extra_block_label ?? null,
        });
      } else {
        form.reset({ name: '', description: '', type: 'STAFF', price_type: 'PER_EVENT', price: 0, is_active: true, block_duration_hours: null, block_unit_label: null, extra_block_price: null, extra_block_label: null });
      }
    }
  }, [open, service, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? 'Edytuj usługę' : 'Dodaj usługę'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Opis</FormLabel>
                <FormControl><Textarea {...field} rows={2} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ usługi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="price_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ ceny</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(PRICE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Cena (zł)</FormLabel>
                <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {watchPriceType === 'PER_BLOCK' && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium text-muted-foreground">Ustawienia bloku</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="block_duration_hours" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Czas bloku (h)</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="block_unit_label" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jednostka (np. kelner)</FormLabel>
                      <FormControl><Input placeholder="kelner" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="extra_block_price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena kolejnego bloku (zł)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min={0} placeholder="Domyślnie = cena bloku" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="extra_block_label" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etykieta kolejnego bloku</FormLabel>
                      <FormControl><Input placeholder="Każde kolejne 4h" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel className="cursor-pointer">Aktywna</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Zapisywanie...' : 'Zapisz'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
