import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientOption {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface ClientAutocompleteProps {
  value: string;
  displayValue: string;
  onSelect: (client: ClientOption) => void;
  onAddNew: () => void;
}

export const ClientAutocomplete = ({ value, displayValue, onSelect, onAddNew }: ClientAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-autocomplete', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, company')
        .or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`)
        .limit(10);
      if (error) throw error;
      return data as ClientOption[];
    },
    enabled: debouncedSearch.length >= 2,
  });

  const handleSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      onSelect(client);
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? displayValue : 'Wybierz klienta...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Szukaj klienta..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {debouncedSearch.length < 2 ? (
              <CommandEmpty>Wpisz min. 2 znaki</CommandEmpty>
            ) : clients.length === 0 ? (
              <CommandEmpty>Brak wyników</CommandEmpty>
            ) : (
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', value === client.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[client.email, client.company].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddNew();
                }}
                className="text-primary"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Dodaj nowego klienta
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
