import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useClients, useClientOfferCounts, useCreateClient, useUpdateClient } from '@/hooks/use-clients';
import { useDebounce } from '@/hooks/use-debounce';
import { CLIENT_TYPE_LABELS } from '@/lib/service-constants';
import { ClientDialog } from './client-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import type { Tables } from '@/integrations/supabase/types';

export const ClientsPage = () => {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Tables<'clients'> | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data: clients, isLoading } = useClients({ search: debouncedSearch });
  const { data: offerCounts } = useClientOfferCounts();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const handleSubmit = (values: Record<string, unknown>) => {
    const payload = values as Parameters<typeof createClient.mutate>[0];
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, ...payload }, {
        onSuccess: () => { setDialogOpen(false); setEditingClient(null); },
      });
    } else {
      createClient.mutate(payload, {
        onSuccess: () => { setDialogOpen(false); },
      });
    }
  };

  const handleEdit = (client: Tables<'clients'>) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Klienci</h1>
        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" />Dodaj klienta</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj po nazwie, email, firmie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !clients?.length ? (
        <EmptyState
          title="Brak klientów"
          description={search ? 'Nie znaleziono klientów pasujących do wyszukiwania.' : 'Dodaj pierwszego klienta, aby rozpocząć.'}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead className="text-center">Powracający</TableHead>
              <TableHead className="text-center">Oferty</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.email || '—'}</TableCell>
                <TableCell>{client.phone || '—'}</TableCell>
                <TableCell>{client.company || '—'}</TableCell>
                <TableCell>
                  {client.client_type ? (
                    <Badge variant="outline">{CLIENT_TYPE_LABELS[client.client_type] || client.client_type}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-center">{client.is_returning ? '✓' : '—'}</TableCell>
                <TableCell className="text-center">{offerCounts?.[client.id] || 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>Edytuj</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingClient(null); }}
        client={editingClient}
        onSubmit={handleSubmit}
        isLoading={createClient.isPending || updateClient.isPending}
      />
    </div>
  );
};
