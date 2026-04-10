import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Check, X, RefreshCw, Palette, Scissors, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useProposalDetail, useUpdateProposalItem, useResolveProposal } from '@/hooks/use-proposal-diff';
import type { ProposalItemWithDishes } from '@/hooks/use-proposal-diff';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CHANGE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  SWAP: { icon: <RefreshCw className="h-4 w-4" />, label: 'Zamiana' },
  VARIANT_CHANGE: { icon: <Palette className="h-4 w-4" />, label: 'Wariant' },
  SPLIT: { icon: <Scissors className="h-4 w-4" />, label: 'Podział' },
  QUANTITY_CHANGE: { icon: <Users className="h-4 w-4" />, label: 'Ilość' },
};

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  pending: { className: 'bg-muted text-muted-foreground', label: 'Oczekuje' },
  accepted: { className: 'bg-green-100 text-green-800 animate-scale-in', label: 'Zaakceptowano' },
  rejected: { className: 'bg-red-100 text-red-800 animate-scale-in', label: 'Odrzucono' },
  invalidated: { className: 'bg-yellow-100 text-yellow-800', label: 'Nieaktualny' },
};

const PROPOSAL_STATUS_BADGE: Record<string, { className: string; label: string }> = {
  draft_client: { className: 'bg-muted text-muted-foreground', label: 'Szkic klienta' },
  pending: { className: 'bg-orange-100 text-orange-800', label: 'Oczekuje' },
  accepted: { className: 'bg-green-100 text-green-800', label: 'Zaakceptowana' },
  partially_accepted: { className: 'bg-yellow-100 text-yellow-800', label: 'Częściowo' },
  rejected: { className: 'bg-red-100 text-red-800', label: 'Odrzucona' },
};


interface DiffRowProps {
  item: ProposalItemWithDishes;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  flashState: 'green' | 'red' | null;
}

const DiffRow = ({ item, onAccept, onReject, flashState }: DiffRowProps) => {
  const config = CHANGE_TYPE_CONFIG[item.change_type] ?? { icon: null, label: item.change_type };
  const statusBadge = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
  const priceDiff = item.proposed_price - item.original_price;
  const isPending = item.status === 'pending';

  const flashClass = flashState === 'green'
    ? 'bg-green-100/60'
    : flashState === 'red'
      ? 'bg-red-100/60'
      : '';

  return (
    <TableRow className={`transition-colors duration-300 ${flashClass}`}>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{config.icon}</span>
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </TableCell>

      <TableCell>
        <div>
          <p className="font-medium">{item.dishes?.display_name ?? item.dishes?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">
            {item.original_quantity} szt. × {formatCurrency(item.original_price)}
          </p>
        </div>
      </TableCell>

      <TableCell>
        <div>
          <p className="font-medium">
            {item.change_type === 'SWAP' && item.proposed_dish
              ? item.proposed_dish.display_name ?? item.proposed_dish.name
              : item.change_type === 'VARIANT_CHANGE' && item.proposed_variant_option
                ? item.proposed_variant_option
                : item.change_type === 'QUANTITY_CHANGE'
                  ? `${item.proposed_quantity ?? item.original_quantity} szt.`
                  : item.change_type === 'SPLIT'
                    ? 'Podział'
                    : '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.proposed_quantity ?? item.original_quantity} szt. × {formatCurrency(item.proposed_price)}
          </p>
        </div>
      </TableCell>

      <TableCell>
        <span className={`font-semibold text-sm ${priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
          {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
        </span>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className={`${statusBadge.className} border-none`}>
          {statusBadge.label}
        </Badge>
      </TableCell>

      <TableCell>
        {isPending && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => onAccept(item.id)}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onReject(item.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export const ProposalDiffPage = () => {
  const { id: offerId, proposalId } = useParams<{ id: string; proposalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: proposal, isLoading } = useProposalDetail(proposalId);
  const updateItem = useUpdateProposalItem();
  const resolveProposal = useResolveProposal();

  const [flashStates, setFlashStates] = useState<Record<string, 'green' | 'red' | null>>({});
  const [managerNotes, setManagerNotes] = useState('');

  const triggerFlash = useCallback((itemId: string, color: 'green' | 'red') => {
    setFlashStates(prev => ({ ...prev, [itemId]: color }));
    setTimeout(() => {
      setFlashStates(prev => ({ ...prev, [itemId]: null }));
    }, 400);
  }, []);

  const handleAccept = useCallback((itemId: string) => {
    if (!user?.id) return;
    triggerFlash(itemId, 'green');
    updateItem.mutate(
      { itemId, status: 'accepted', decidedBy: user.id },
      { onError: () => toast.error('Nie udało się zaakceptować pozycji.') }
    );
  }, [user, updateItem, triggerFlash]);

  const handleReject = useCallback((itemId: string) => {
    if (!user?.id) return;
    triggerFlash(itemId, 'red');
    updateItem.mutate(
      { itemId, status: 'rejected', decidedBy: user.id },
      { onError: () => toast.error('Nie udało się odrzucić pozycji.') }
    );
  }, [user, updateItem, triggerFlash]);

  const handleResolve = useCallback(() => {
    if (!proposal || !user?.id) return;

    const items = proposal.proposal_items ?? [];
    const allAccepted = items.every(i => i.status === 'accepted');
    const allRejected = items.every(i => i.status === 'rejected');
    const hasPending = items.some(i => i.status === 'pending');

    if (hasPending) {
      toast.error('Najpierw zdecyduj o wszystkich pozycjach.');
      return;
    }

    const resolveStatus = allAccepted ? 'accepted' as const
      : allRejected ? 'rejected' as const
        : 'partially_accepted' as const;

    resolveProposal.mutate(
      {
        proposalId: proposal.id,
        status: resolveStatus,
        managerNotes: managerNotes || undefined,
        resolvedBy: user.id,
      },
      {
        onSuccess: () => {
          toast.success('Propozycja została rozpatrzona.');
          navigate(`/admin/offers/${offerId}/edit`);
        },
        onError: () => toast.error('Nie udało się zapisać decyzji.'),
      }
    );
  }, [proposal, user, managerNotes, resolveProposal, navigate, offerId]);

  if (isLoading) return <LoadingSpinner />;

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Nie znaleziono propozycji.</p>
      </div>
    );
  }

  const items = proposal.proposal_items ?? [];
  const offer = proposal.offers;
  const client = offer?.clients;
  const proposalBadge = PROPOSAL_STATUS_BADGE[proposal.status] ?? PROPOSAL_STATUS_BADGE.pending;
  const isResolved = ['accepted', 'partially_accepted', 'rejected'].includes(proposal.status);
  const pendingCount = items.filter(i => i.status === 'pending').length;

  const acceptedPriceDiff = items
    .filter(i => i.status === 'accepted')
    .reduce((sum, i) => sum + (i.proposed_price - i.original_price), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Propozycja zmian</h1>
          <p className="text-sm text-muted-foreground">
            {client?.name ?? 'Klient'} · {proposal.created_at
              ? format(new Date(proposal.created_at), 'd MMM yyyy, HH:mm', { locale: pl })
              : '—'}
          </p>
        </div>
        <Badge variant="outline" className={`${proposalBadge.className} border-none text-sm`}>
          {proposalBadge.label}
        </Badge>
      </div>

      {/* Client message */}
      {proposal.client_message && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wiadomość klienta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{proposal.client_message}</p>
          </CardContent>
        </Card>
      )}

      {/* Diff table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Porównanie zmian</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Typ</TableHead>
                <TableHead>Oryginał</TableHead>
                <TableHead>Propozycja</TableHead>
                <TableHead className="w-[120px]">Wpływ cenowy</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <DiffRow
                  key={item.id}
                  item={item}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  flashState={flashStates[item.id] ?? null}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Podsumowanie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pozycje ogółem</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Oczekujące</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Wpływ cenowy (zaakceptowane)</span>
              <span className={`font-semibold ${acceptedPriceDiff > 0 ? 'text-red-600' : acceptedPriceDiff < 0 ? 'text-green-600' : ''}`}>
                {acceptedPriceDiff > 0 ? '+' : ''}{formatCurrency(acceptedPriceDiff)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notatki managera</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={managerNotes}
              onChange={e => setManagerNotes(e.target.value)}
              placeholder="Opcjonalne notatki do propozycji..."
              rows={3}
              disabled={isResolved}
            />
          </CardContent>
        </Card>
      </div>

      {/* Resolve button */}
      {!isResolved && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleResolve}
            disabled={resolveProposal.isPending || pendingCount > 0}
            className="rounded-xl"
          >
            {resolveProposal.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Zatwierdź decyzje
          </Button>
        </div>
      )}
    </div>
  );
};