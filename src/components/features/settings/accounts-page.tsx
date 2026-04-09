import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { DEV_MODE } from '@/lib/constants';
import { Plus, MoreHorizontal, KeyRound, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

interface UserAccount {
  id: string;
  email: string;
  role: string;
  last_sign_in_at: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'Użytkownik',
};

const createAccountSchema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  role: z.enum(['admin', 'manager']),
});

const changePasswordSchema = z.object({
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  confirmPassword: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

type CreateAccountValues = z.infer<typeof createAccountSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const DEV_MOCK_USERS: UserAccount[] = [
  { id: 'dev-user-id', email: 'dev@test.pl', role: 'admin', last_sign_in_at: null, created_at: new Date().toISOString() },
];

const useUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      if (DEV_MODE) return DEV_MOCK_USERS;
      const { data, error } = await supabase.functions.invoke('list-users', { method: 'GET' });
      if (error) throw error;
      return data as UserAccount[];
    },
  });
};

export const AccountsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();

  const createForm = useForm<CreateAccountValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { email: '', password: '', role: 'manager' },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const createUser = useMutation({
    mutationFn: async (values: CreateAccountValues) => {
      if (DEV_MODE) {
        toast.info('Tworzenie kont wyłączone w trybie deweloperskim');
        return { id: 'dev-new', email: values.email };
      }
      const { data, error } = await supabase.functions.invoke('list-users', {
        method: 'POST',
        body: values,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Konto zostało utworzone');
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast.error('Nie udało się utworzyć konta');
    },
  });

  const changePassword = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('list-users', {
        method: 'PATCH',
        body: { userId, password },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Hasło zostało zmienione');
      setPasswordDialogOpen(false);
      passwordForm.reset();
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Nie udało się zmienić hasła');
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('list-users', {
        method: 'DELETE',
        body: { userId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Konto zostało usunięte');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Nie udało się usunąć konta');
    },
  });

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Link do resetu hasła wysłany na ${email}`);
    } catch {
      toast.error('Nie udało się wysłać linku resetującego');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const isCurrentUser = (userId: string) => currentUser?.id === userId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Konta użytkowników</h2>
        <Button onClick={() => setCreateDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Dodaj konto</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !users?.length ? (
        <EmptyState title="Brak kont" description="Dodaj pierwsze konto użytkownika." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rola</TableHead>
              <TableHead>Ostatnie logowanie</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.email}
                  {isCurrentUser(u.id) && <Badge variant="outline" className="ml-2 text-xs">Ty</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                    {ROLE_LABELS[u.role] || u.role}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(u.last_sign_in_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleResetPassword(u.email)}>
                        <KeyRound className="mr-2 h-4 w-4" />Wyślij reset hasła
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedUser(u); setPasswordDialogOpen(true); }}>
                        <Lock className="mr-2 h-4 w-4" />Zmień hasło
                      </DropdownMenuItem>
                      {!isCurrentUser(u.id) && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => { setSelectedUser(u); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Usuń konto
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create account dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nowe konto</DialogTitle></DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((v) => createUser.mutate(v))} className="space-y-4">
              <FormField control={createForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Hasło</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rola</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Anuluj</Button>
                <Button type="submit" disabled={createUser.isPending}>{createUser.isPending ? 'Tworzenie...' : 'Utwórz konto'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => { setPasswordDialogOpen(open); if (!open) { passwordForm.reset(); setSelectedUser(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Zmień hasło — {selectedUser?.email}</DialogTitle></DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit((v) => { if (selectedUser) changePassword.mutate({ userId: selectedUser.id, password: v.password }); })} className="space-y-4">
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Nowe hasło</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Powtórz hasło</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>Anuluj</Button>
                <Button type="submit" disabled={changePassword.isPending}>{changePassword.isPending ? 'Zapisywanie...' : 'Zmień hasło'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setSelectedUser(null); }}
        title="Usuń konto"
        description={`Czy na pewno chcesz usunąć konto ${selectedUser?.email}? Tej operacji nie można cofnąć.`}
        confirmLabel={deleteUser.isPending ? 'Usuwanie...' : 'Usuń konto'}
        variant="destructive"
        onConfirm={() => { if (selectedUser) deleteUser.mutate(selectedUser.id); }}
      />
    </div>
  );
};
