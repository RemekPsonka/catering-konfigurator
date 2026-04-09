import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Tables } from '@/integrations/supabase/types';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nazwa jest wymagana').max(100),
  code: z
    .string()
    .trim()
    .min(1, 'Kod jest wymagany')
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Kod może zawierać tylko wielkie litery, cyfry i podkreślenia'),
  icon: z.string().max(10).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  is_active: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Tables<'dish_categories'> | null;
  onSubmit: (values: CategoryFormValues) => void;
  isLoading?: boolean;
}

const generateCode = (name: string): string =>
  name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');

export const CategoryDialog = ({
  open,
  onOpenChange,
  category,
  onSubmit,
  isLoading,
}: CategoryDialogProps) => {
  const isEdit = !!category;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      code: '',
      icon: '',
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          code: category.code,
          icon: category.icon ?? '',
          description: category.description ?? '',
          is_active: category.is_active ?? true,
        });
      } else {
        form.reset({
          name: '',
          code: '',
          icon: '',
          description: '',
          is_active: true,
        });
      }
    }
  }, [open, category, form]);

  const nameValue = form.watch('name');

  useEffect(() => {
    if (!isEdit && nameValue) {
      form.setValue('code', generateCode(nameValue), { shouldValidate: true });
    }
  }, [nameValue, isEdit, form]);

  const handleSubmit = (values: CategoryFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edytuj kategorię' : 'Dodaj kategorię'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Zupy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kod *</FormLabel>
                  <FormControl>
                    <Input placeholder="np. ZUPY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ikona (emoji)</FormLabel>
                  <FormControl>
                    <Input placeholder="np. 🍲" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Krótki opis kategorii..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Aktywna
                  </Label>
                  <FormControl>
                    <Switch
                      id="is_active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
