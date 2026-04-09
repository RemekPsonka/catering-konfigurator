import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ImageIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useDishCategories } from '@/hooks/use-dish-categories';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UNIT_TYPE_LABELS } from '@/lib/dish-constants';
import { formatCurrency } from '@/lib/calculations';

interface DishPickerSheetProps {
  open: boolean;
  onClose: () => void;
  excludeIds: string[];
  onSelect: (dishId: string) => void;
}

export const DishPickerSheet = ({ open, onClose, excludeIds, onSelect }: DishPickerSheetProps) => {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);
  const { data: categories } = useDishCategories();

  const { data: dishes, isLoading } = useQuery({
    queryKey: ['dish-picker', debouncedSearch, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('dishes')
        .select('id, display_name, photo_url, unit_type, price_per_person, price_per_piece, price_per_kg, price_per_set, category_id')
        .eq('is_active', true)
        .order('sort_order')
        .limit(50);

      if (categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }
      if (debouncedSearch.length >= 2) {
        query = query.ilike('display_name', `%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const filteredDishes = (dishes ?? []).filter(d => !excludeIds.includes(d.id));

  const getDishDisplayPrice = (dish: typeof filteredDishes[0]): string => {
    switch (dish.unit_type) {
      case 'PERSON': return formatCurrency(dish.price_per_person ?? 0);
      case 'PIECE': return formatCurrency(dish.price_per_piece ?? 0);
      case 'KG': return formatCurrency(dish.price_per_kg ?? 0);
      case 'SET': return formatCurrency(dish.price_per_set ?? 0);
      default: return '—';
    }
  };

  const activeCategories = (categories ?? []).filter(c => c.is_active);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Dodaj dania</SheetTitle>
        </SheetHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj dania..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 py-2">
          <Badge
            variant={categoryId === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setCategoryId('all')}
          >
            Wszystkie
          </Badge>
          {activeCategories.map(cat => (
            <Badge
              key={cat.id}
              variant={categoryId === cat.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategoryId(cat.id)}
            >
              {cat.icon} {cat.name}
            </Badge>
          ))}
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Ładowanie...</p>
          ) : filteredDishes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Brak dań do wyświetlenia</p>
          ) : (
            <div className="space-y-1">
              {filteredDishes.map(dish => (
                <button
                  key={dish.id}
                  type="button"
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                  onClick={() => onSelect(dish.id)}
                >
                  {dish.photo_url ? (
                    <img src={dish.photo_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{dish.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDishDisplayPrice(dish)} / {UNIT_TYPE_LABELS[dish.unit_type] ?? dish.unit_type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
