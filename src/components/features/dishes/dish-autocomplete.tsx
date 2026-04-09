import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';

export interface DishOption {
  dish_id: string;
  label: string;
}

interface DishAutocompleteProps {
  excludeId?: string;
  excludeIds?: string[];
  onSelect: (dish: DishOption) => void;
  placeholder?: string;
}

export const DishAutocomplete = ({
  excludeId,
  excludeIds = [],
  onSelect,
  placeholder = 'Szukaj dania...',
}: DishAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const allExcluded = [...excludeIds];
  if (excludeId) allExcluded.push(excludeId);

  const { data: dishes = [] } = useQuery({
    queryKey: ['dishes-autocomplete', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const { data, error } = await supabase
        .from('dishes')
        .select('id, display_name')
        .ilike('display_name', `%${debouncedSearch}%`)
        .eq('is_active', true)
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: debouncedSearch.length >= 2,
  });

  const filtered = dishes.filter((d) => !allExcluded.includes(d.id));

  const handleSelect = useCallback(
    (dishId: string) => {
      const found = dishes.find((d) => d.id === dishId);
      if (found) {
        onSelect({ dish_id: found.id, label: found.display_name });
        setSearch('');
        setOpen(false);
      }
    },
    [dishes, onSelect],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-start font-normal text-muted-foreground">
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {debouncedSearch.length < 2 ? 'Wpisz min. 2 znaki' : 'Brak wyników'}
            </CommandEmpty>
            {filtered.length > 0 && (
              <CommandGroup>
                {filtered.map((d) => (
                  <CommandItem key={d.id} value={d.id} onSelect={handleSelect}>
                    <Check className={cn('mr-2 h-4 w-4', 'opacity-0')} />
                    {d.display_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
