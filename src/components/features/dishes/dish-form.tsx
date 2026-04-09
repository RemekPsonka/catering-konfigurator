import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TagChipsField } from './tag-chips-field';
import { DishPhotosSection } from './dish-photos-section';
import { ModifiableItemsSection } from './modifiable-items-section';
import { useDishCategories } from '@/hooks/use-dish-categories';
import { useCreateDish, useUpdateDish } from '@/hooks/use-dishes';
import {
  UNIT_TYPE_LABELS,
  UNIT_TYPE_PRICE_LABELS,
  DIET_TAGS,
  EVENT_TAGS,
  SEASON_TAGS,
  SERVING_STYLES,
  ALLERGENS,
} from '@/lib/dish-constants';
import type { Tables } from '@/integrations/supabase/types';

const dishSchema = z.object({
  name: z.string().trim().min(3, 'Nazwa musi mieć min. 3 znaki'),
  display_name: z.string().trim().min(3, 'Nazwa wyświetlana musi mieć min. 3 znaki'),
  description_short: z.string().max(200, 'Max 200 znaków').nullable().optional(),
  description_sales: z.string().max(500, 'Max 500 znaków').nullable().optional(),
  category_id: z.string().min(1, 'Wybierz kategorię'),
  subcategory: z.string().nullable().optional(),
  unit_type: z.enum(['PERSON', 'PIECE', 'KG', 'SET']),
  price: z.coerce.number().min(0, 'Cena musi być >= 0'),
  min_order_quantity: z.coerce.number().int().min(1, 'Min. 1').default(1),
  portion_weight_g: z.coerce.number().int().positive().nullable().optional(),
  serves_people: z.coerce.number().int().positive().nullable().optional(),
  diet_tags: z.array(z.string()).default([]),
  event_tags: z.array(z.string()).default([]),
  season_tags: z.array(z.string()).default([]),
  serving_style: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  cost_per_unit: z.coerce.number().min(0).nullable().optional(),
  margin_percent: z.coerce.number().min(0).nullable().optional(),
  is_active: z.boolean().default(true),
  is_modifiable: z.boolean().default(false),
  modifiable_items: z.any().nullable().optional(),
});

type DishFormValues = z.infer<typeof dishSchema>;

const getPriceFromDish = (dish: Tables<'dishes'>): number => {
  switch (dish.unit_type) {
    case 'PERSON': return Number(dish.price_per_person ?? 0);
    case 'PIECE': return Number(dish.price_per_piece ?? 0);
    case 'KG': return Number(dish.price_per_kg ?? 0);
    case 'SET': return Number(dish.price_per_set ?? 0);
    default: return 0;
  }
};

interface DishFormProps {
  dish?: Tables<'dishes'>;
  mode: 'create' | 'edit';
  onCreated?: (dishId: string) => void;
}

export const DishForm = ({ dish, mode, onCreated }: DishFormProps) => {
  const navigate = useNavigate();
  const { data: categories } = useDishCategories();
  const createDish = useCreateDish();
  const updateDish = useUpdateDish();

  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: dish
      ? {
          name: dish.name,
          display_name: dish.display_name,
          description_short: dish.description_short ?? '',
          description_sales: dish.description_sales ?? '',
          category_id: dish.category_id,
          subcategory: dish.subcategory ?? '',
          unit_type: dish.unit_type as DishFormValues['unit_type'],
          price: getPriceFromDish(dish),
          min_order_quantity: dish.min_order_quantity ?? 1,
          portion_weight_g: dish.portion_weight_g ?? undefined,
          serves_people: dish.serves_people ?? undefined,
          diet_tags: dish.diet_tags ?? [],
          event_tags: dish.event_tags ?? [],
          season_tags: dish.season_tags ?? [],
          serving_style: dish.serving_style ?? [],
          allergens: dish.allergens ?? [],
          cost_per_unit: dish.cost_per_unit ? Number(dish.cost_per_unit) : undefined,
          margin_percent: dish.margin_percent ? Number(dish.margin_percent) : undefined,
          is_active: dish.is_active ?? true,
          is_modifiable: dish.is_modifiable ?? false,
          modifiable_items: (dish.modifiable_items as Record<string, unknown>) ?? null,
        }
      : {
          name: '',
          display_name: '',
          description_short: '',
          description_sales: '',
          category_id: '',
          subcategory: '',
          unit_type: 'PERSON' as const,
          price: 0,
          min_order_quantity: 1,
          diet_tags: [],
          event_tags: [],
          season_tags: [],
          serving_style: [],
          allergens: [],
          is_active: true,
          is_modifiable: false,
          modifiable_items: null,
        },
  });

  const unitType = form.watch('unit_type');
  const isModifiable = form.watch('is_modifiable');
  const costPerUnit = form.watch('cost_per_unit');
  const marginPercent = form.watch('margin_percent');
  const descShort = form.watch('description_short') ?? '';
  const descSales = form.watch('description_sales') ?? '';

  const catalogPrice =
    costPerUnit && marginPercent
      ? (Number(costPerUnit) * (1 + Number(marginPercent) / 100)).toFixed(2)
      : null;

  const buildPayload = (values: DishFormValues) => {
    const priceFields = {
      price_per_person: values.unit_type === 'PERSON' ? values.price : null,
      price_per_piece: values.unit_type === 'PIECE' ? values.price : null,
      price_per_kg: values.unit_type === 'KG' ? values.price : null,
      price_per_set: values.unit_type === 'SET' ? values.price : null,
    };

    return {
      name: values.name,
      display_name: values.display_name,
      description_short: values.description_short || null,
      description_sales: values.description_sales || null,
      category_id: values.category_id,
      subcategory: values.subcategory || null,
      unit_type: values.unit_type as 'PERSON' | 'PIECE' | 'KG' | 'SET',
      ...priceFields,
      min_order_quantity: values.min_order_quantity,
      portion_weight_g: values.portion_weight_g ?? null,
      serves_people: values.serves_people ?? null,
      diet_tags: values.diet_tags,
      event_tags: values.event_tags,
      season_tags: values.season_tags,
      serving_style: values.serving_style,
      allergens: values.allergens,
      cost_per_unit: values.cost_per_unit ?? null,
      margin_percent: values.margin_percent ?? null,
      is_active: values.is_active,
      is_modifiable: values.is_modifiable,
      modifiable_items: values.is_modifiable ? (values.modifiable_items ?? null) : null,
    };
  };

  const onSubmit = async (values: DishFormValues, addAnother = false) => {
    try {
      const payload = buildPayload(values);
      if (mode === 'edit' && dish) {
        await updateDish.mutateAsync({ id: dish.id, ...payload });
      } else {
        const newDish = await createDish.mutateAsync(payload);
        if (onCreated && newDish?.id) {
          onCreated(newDish.id);
          return;
        }
      }
      if (addAnother) {
        form.reset();
      } else {
        navigate('/admin/dishes');
      }
    } catch {
      // toast handled by mutation
    }
  };

  const isPending = createDish.isPending || updateDish.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-6">
        {/* Section 1 — Podstawowe */}
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa wewnętrzna</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa wyświetlana</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description_short"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Opis krótki ({descShort.length}/200)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} maxLength={200} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description_sales"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Opis sprzedażowy ({descSales.length}/500)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} maxLength={500} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(categories ?? [])
                        .filter((c) => c.is_active)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Podkategoria (opcjonalna)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2 — Cena i wycena */}
        <Card>
          <CardHeader>
            <CardTitle>Cena i wycena</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="unit_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ wyceny</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-wrap gap-4"
                    >
                      {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                        <div key={value} className="flex items-center space-x-2">
                          <RadioGroupItem value={value} id={`unit-${value}`} />
                          <Label htmlFor={`unit-${value}`}>{label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{UNIT_TYPE_PRICE_LABELS[unitType]} (zł)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_order_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. zamówienie</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portion_weight_g"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gramatura (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serves_people"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Na ile osób (opcjonalne)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3 — Tagi */}
        <Card>
          <CardHeader>
            <CardTitle>Tagi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="diet_tags"
              render={({ field }) => (
                <TagChipsField label="Tagi dietetyczne" options={DIET_TAGS} value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="event_tags"
              render={({ field }) => (
                <TagChipsField label="Tagi wydarzeń" options={EVENT_TAGS} value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="season_tags"
              render={({ field }) => (
                <TagChipsField label="Tagi sezonowe" options={SEASON_TAGS} value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="serving_style"
              render={({ field }) => (
                <TagChipsField label="Styl podania" options={SERVING_STYLES} value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="allergens"
              render={({ field }) => (
                <TagChipsField label="Alergeny" options={ALLERGENS} value={field.value} onChange={field.onChange} />
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3.5 — Zdjęcia */}
        <Card>
          <CardHeader>
            <CardTitle>Zdjęcia</CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'edit' && dish ? (
              <DishPhotosSection dishId={dish.id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Zdjęcia będą dostępne po zapisaniu dania.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Section 4 — Wewnętrzne */}
        <Card>
          <CardHeader>
            <CardTitle>Wewnętrzne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="cost_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Koszt wytworzenia (zł)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="margin_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marża (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {catalogPrice && (
                <div className="flex flex-col justify-end">
                  <p className="text-sm text-muted-foreground">Cena katalogowa</p>
                  <p className="text-lg font-semibold">{catalogPrice} zł</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 5 — Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Aktywne</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_modifiable"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Klient może modyfikować</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 6 — Modyfikacje (conditional) */}
        {isModifiable && (
          <FormField
            control={form.control}
            name="modifiable_items"
            render={({ field }) => (
              <ModifiableItemsSection
                value={field.value as Record<string, unknown> | null}
                onChange={field.onChange}
                currentDishId={dish?.id}
              />
            )}
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            Zapisz
          </Button>
          {mode === 'create' && (
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={form.handleSubmit((v) => onSubmit(v, true))}
            >
              Zapisz i dodaj kolejne
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate('/admin/dishes')}>
            Anuluj
          </Button>
        </div>
      </form>
    </Form>
  );
};
