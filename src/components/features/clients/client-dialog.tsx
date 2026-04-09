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
import { CLIENT_TYPE_LABELS } from '@/lib/service-constants';

const clientSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  email: z.string().email('Nieprawidłowy email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  client_type: z.enum(['PRIVATE', 'BUSINESS', 'INSTITUTION', 'AGENCY', 'RETURNING']).nullable().optional(),
  notes: z.string().optional(),
  is_returning: z.boolean(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Tables<'clients'> | null;
  onSubmit: (values: ClientFormValues) => void;
  isLoading?: boolean;
}

export const ClientDialog = ({ open, onOpenChange, client, onSubmit, isLoading }: ClientDialogProps) => {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      client_type: null,
      notes: '',
      is_returning: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset({
          name: client.name,
          email: client.email || '',
          phone: client.phone || '',
          company: client.company || '',
          client_type: client.client_type,
          notes: client.notes || '',
          is_returning: client.is_returning ?? false,
        });
      } else {
        form.reset({ name: '', email: '', phone: '', company: '', client_type: null, notes: '', is_returning: false });
      }
    }
  }, [open, client, form]);

  const handleFormSubmit = (values: ClientFormValues) => {
    onSubmit({
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      company: values.company || null,
      notes: values.notes || null,
    } as ClientFormValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? 'Edytuj klienta' : 'Dodaj klienta'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwa *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem>
                <FormLabel>Firma</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="client_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Typ klienta</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Wybierz typ" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notatki</FormLabel>
                <FormControl><Textarea {...field} rows={2} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="is_returning" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel className="cursor-pointer">Powracający klient</FormLabel>
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
