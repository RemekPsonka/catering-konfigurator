import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EVENT_TYPE_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  PRICING_MODE_OPTIONS,
  DEFAULT_GREETINGS,
} from '@/lib/offer-constants';
import type { StepEventData } from '@/hooks/use-offer-wizard';
import type { Enums } from '@/integrations/supabase/types';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientAutocomplete } from '@/components/features/offers/client-autocomplete';
import { ClientDialog } from '@/components/features/clients/client-dialog';
import { useCreateClient } from '@/hooks/use-clients';

const stepSchema = z.object({
  event_type: z.string().min(1, 'Wybierz rodzaj imprezy'),
  event_date: z.string().nullable(),
  event_time_from: z.string(),
  event_time_to: z.string(),
  people_count: z.coerce.number().min(1, 'Minimum 1 osoba'),
  event_location: z.string(),
  delivery_type: z.string().min(1, 'Wybierz formę dostawy'),
  pricing_mode: z.string().min(1, 'Wybierz tryb kalkulacji'),
  client_id: z.string().min(1, 'Wybierz klienta'),
  client_name: z.string(),
  inquiry_text: z.string(),
  greeting_text: z.string(),
});

type FormValues = z.infer<typeof stepSchema>;

interface StepEventDataProps {
  data: StepEventData;
  onSubmit: (data: StepEventData) => void;
}

export const StepEventData = ({ data, onSubmit }: StepEventDataProps) => {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const createClient = useCreateClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: data,
  });

  const watchEventType = form.watch('event_type');

  // Auto-fill greeting on event_type change
  useEffect(() => {
    if (watchEventType && !form.getValues('greeting_text')) {
      const greeting = DEFAULT_GREETINGS[watchEventType as Enums<'event_type'>];
      if (greeting) {
        form.setValue('greeting_text', greeting);
      }
    }
  }, [watchEventType, form]);

  const handleClientSelect = (client: { id: string; name: string }) => {
    form.setValue('client_id', client.id, { shouldValidate: true });
    form.setValue('client_name', client.name);
  };

  const handleNewClient = async (values: Record<string, unknown>) => {
    try {
      const result = await createClient.mutateAsync(values as Parameters<typeof createClient.mutateAsync>[0]);
      form.setValue('client_id', result.id, { shouldValidate: true });
      form.setValue('client_name', result.name);
      setClientDialogOpen(false);
    } catch {
      // error handled in hook
    }
  };

  const handleFormSubmit = (values: FormValues) => {
    onSubmit(values as StepEventData);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} id="step-event-data" className="space-y-6">
          {/* Event type & client */}
          <Card>
            <CardHeader><CardTitle>Wydarzenie</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="event_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rodzaj imprezy *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Wybierz typ" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="event_date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data wydarzenia</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(new Date(field.value), 'dd.MM.yyyy') : 'Wybierz datę'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="event_time_from" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Godzina od</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="event_time_to" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Godzina do</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="people_count" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liczba osób *</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="event_location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokalizacja</FormLabel>
                    <FormControl><Input placeholder="Adres wydarzenia" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Delivery & pricing */}
          <Card>
            <CardHeader><CardTitle>Dostawa i kalkulacja</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="delivery_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma dostawy *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {DELIVERY_TYPE_OPTIONS.map((opt) => (
                        <Label
                          key={opt.value}
                          htmlFor={`delivery-${opt.value}`}
                          className={cn(
                            'flex flex-col gap-1 rounded-lg border p-4 cursor-pointer transition-colors',
                            field.value === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={opt.value} id={`delivery-${opt.value}`} />
                            <span className="font-medium">{opt.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground pl-6">{opt.description}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="pricing_mode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tryb kalkulacji *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PRICING_MODE_OPTIONS.map((opt) => (
                        <Label
                          key={opt.value}
                          htmlFor={`pricing-${opt.value}`}
                          className={cn(
                            'flex flex-col gap-1 rounded-lg border p-4 cursor-pointer transition-colors',
                            field.value === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={opt.value} id={`pricing-${opt.value}`} />
                            <span className="font-medium">{opt.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground pl-6">{opt.description}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Client */}
          <Card>
            <CardHeader><CardTitle>Klient</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="client_id" render={() => (
                <FormItem>
                  <FormLabel>Klient *</FormLabel>
                  <FormControl>
                    <ClientAutocomplete
                      value={form.watch('client_id')}
                      displayValue={form.watch('client_name')}
                      onSelect={handleClientSelect}
                      onAddNew={() => setClientDialogOpen(true)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="inquiry_text" render={({ field }) => (
                <FormItem>
                  <FormLabel>Treść zapytania klienta</FormLabel>
                  <FormDescription>Opcjonalnie — wklej oryginalną wiadomość od klienta</FormDescription>
                  <FormControl><Textarea rows={4} placeholder="Treść maila klienta..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="greeting_text" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tekst powitalny oferty</FormLabel>
                  <FormDescription>Automatycznie generowany na podstawie typu imprezy</FormDescription>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </form>
      </Form>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSubmit={handleNewClient}
        isLoading={createClient.isPending}
      />
    </>
  );
};
