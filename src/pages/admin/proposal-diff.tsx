import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { ArrowLeft, Check, X, RefreshCw, Palette, Scissors, Users, Loader2, ArrowRight } from 'lucide-react';
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
import type { Json } from '@/integrations/supabase/types';

/* ── Helpers ── */

const CHANGE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; verb: string }> = {
  SWAP: { icon: <RefreshCw className="h-4 w-4" />, label: 'Zamiana dania', verb: 'zamienić' },
  VARIANT_CHANGE: { icon: <Palette className="h-4 w-4" />, label: 'Zmiana wariantu', verb: 'zmienić wariant' },
  SPLIT: { icon: <Scissors className="h-4 w-4" />, label: 'Podział dania', verb: 'podzielić' },
  QUANTITY_CHANGE: { icon: <Users className="h-4 w-4" />, label: 'Zmiana ilości', verb: 'zmienić ilość' },
};

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  pending: { className: 'bg-orange-100 text-orange-800', label: 'Oczekuje' },
  accepted: { className: 'bg-green-100 text-green-800', label: 'Zaakceptowano' },
  rejected: { className: 'bg-red-100 text-red-800', label: 'Odrzucono' },
  invalidated: { className: 'bg-muted text-muted-foreground', label: 'Nieaktualny' },
};

const PROPOSAL_STATUS_BADGE: Record<string, { className: string; label: string }> = {
  draft_client: { className: 'bg-muted text-muted-foreground', label: 'Szkic klienta' },
  pending: { className: 'bg-orange-100 text-orange-800', label: 'Oczekuje na decyzję' },
  accepted: { className: 'bg-green-100 text-green-800', label: 'Zaakceptowana' },
  partially_accepted: { className: 'bg-yellow-100 text-yellow-800', label: 'Częściowo zaakceptowana' },
  rejected: { className: 'bg-red-100 text-red-800', label: 'Odrzucona' },
};

/** Resolve variant option index to label from modifiable_items */
const resolveVariantLabel = (optionValue: string | null, modifiableItems: Json | null): string | null => {
  if (optionValue === null || optionValue === undefined) return null;
  if (!modifiableItems || typeof modifiableItems !== 'object') return optionValue;

  const mod = modifiableItems as Record<string, unknown>;
  if (mod.type !== 'variant') return optionValue;

  const options = mod.options as Array<{ label?: string; price_modifier?: number }> | undefined;
  if (!options || !Array.isArray(options)) return optionValue;

  const idx = parseInt(optionValue, 10);
  if (!isNaN(idx) && options[idx]?.label) {
    return options[idx].label;
  }

  // Maybe it's already a label
  const found = options.find(o => o.label === optionValue);
  if (found) return found.label;

  return optionValue;
};

/* ── DiffCard ── */

interface DiffCardProps {
  item: ProposalItemWithDishes;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  flashState: 'green' | 'red' | null;
}

const DiffCard = ({ item, onAccept, onReject, flashState }: DiffCardProps) => {
  const config = CHANGE_TYPE_CONFIG[item.change_type] ?? { icon: null, label: item.change_type, verb: 'zmienić' };
  const statusBadge = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
  const isPending = item.status === 'pending';
  const priceDiff = item.proposed_price - item.original_price;

  // Resolve modifiable_items for variant label resolution
  const modItems = item.variant_item?.dish?.modifiable_items ?? item.dishes?.modifiable_items ?? null;
  const currentVariantOption = item.variant_item?.selected_variant_option ?? null;

  const dishName = item.dishes?.display_name ?? item.dishes?.name ?? 'Nieznane danie';

  const flashClass = flashState === 'green'
    ? 'ring-2 ring-green-400 bg-green-50/50'
    : flashState === 'red'
      ? 'ring-2 ring-red-400 bg-red-50/50'
      : '';

  const renderDescription = () => {
    switch (item.change_type) {
      case 'SWAP': {
        const proposedName = item.proposed_dish?.display_name ?? item.proposed_dish?.name ?? 'Nieznane danie';
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Obecne danie</p>
                <p className="font-medium text-sm">{dishName}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.original_price)} / szt.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Proponowane danie</p>
                <p className="font-medium text-sm">{proposedName}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.proposed_price)} / szt.</p>
              </div>
            </div>
          </div>
        );
      }

      case 'VARIANT_CHANGE': {
        const currentLabel = resolveVariantLabel(currentVariantOption, modItems) ?? '(brak wyboru)';
        const proposedLabel = resolveVariantLabel(item.proposed_variant_option, modItems) ?? item.proposed_variant_option ?? '—';
        return (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Danie:</span>{' '}
              <span className="font-medium">{dishName}</span>
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-muted/50 border rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Obecny wariant</p>
                <p className="font-medium text-sm">{currentLabel}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Proponowany wariant</p>
                <p className="font-medium text-sm">{proposedLabel}</p>
              </div>
            </div>
          </div>
        );
      }

      case 'QUANTITY_CHANGE':
        return (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Danie:</span>{' '}
              <span className="font-medium">{dishName}</span>
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-muted/50 border rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Obecna ilość</p>
                <p className="font-medium text-sm">{item.original_quantity} szt.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">Proponowana ilość</p>
                <p className="font-medium text-sm">{item.proposed_quantity ?? item.original_quantity} szt.</p>
              </div>
            </div>
          </div>
        );

      case 'SPLIT':
        return (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Danie:</span>{' '}
              <span className="font-medium">{dishName}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Klient chce podzielić to danie na mniejsze porcje z innymi daniami.
            </p>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">Nieznany typ zmiany</p>;
    }
  };

  return (
    <Card className={`transition-all duration-300 ${flashClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary">{config.icon}</span>
            <CardTitle className="text-base">{config.label}</CardTitle>
          </div>
          <Badge variant="outline" className={`${statusBadge.className} border-none`}>
            {statusBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderDescription()}

        {/* Price impact */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Cena przed: <span className="font-medium text-foreground">{formatCurrency(item.original_price * item.original_quantity)}</span>
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Cena po: <span className="font-medium text-foreground">{formatCurrency(item.proposed_price * (item.proposed_quantity ?? item.original_quantity))}</span>
            </span>
          </div>
          <span className={`font-semibold text-sm ${priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
            ({priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff * (item.proposed_quantity ?? item.original_quantity))})
          </span>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={() => onReject(item.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Odrzuć
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onAccept(item.id)}
            >
              <Check className="h-4 w-4 mr-1" />
              Akceptuj
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ── Page ── */

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

  const totalOriginal = items.reduce((sum, i) => sum + i.original_price * i.original_quantity, 0);
  const totalProposed = items.reduce((sum, i) => sum + i.proposed_price * (i.proposed_quantity ?? i.original_quantity), 0);
  const totalDiff = totalProposed - totalOriginal;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/offers/${offerId}/edit`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Propozycja zmian klienta</h1>
          <p className="text-sm text-muted-foreground">
            {client?.name ?? 'Klient'} · Oferta {offer?.offer_number ?? '—'} · {proposal.created_at
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
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">💬 Wiadomość od klienta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed italic">„{proposal.client_message}"</p>
          </CardContent>
        </Card>
      )}

      {/* Diff cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Proponowane zmiany ({items.length})</h2>
        {items.map(item => (
          <DiffCard
            key={item.id}
            item={item}
            onAccept={handleAccept}
            onReject={handleReject}
            flashState={flashStates[item.id] ?? null}
          />
        ))}
      </div>

      {/* Summary + notes */}
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
              <span>Oczekujące na decyzję</span>
              <span className="font-medium">{pendingCount}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span>Łączny wpływ cenowy</span>
              <span className={`font-semibold ${totalDiff > 0 ? 'text-red-600' : totalDiff < 0 ? 'text-green-600' : ''}`}>
                {totalDiff > 0 ? '+' : ''}{formatCurrency(totalDiff)}
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
            {resolveProposal.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Zatwierdź decyzje
          </Button>
        </div>
      )}
    </div>
  );
};
