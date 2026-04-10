import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  FileEdit,
  RefreshCw,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { EmailTemplateModal } from '@/components/common/email-template-modal';
import {
  useAdminCorrections,
  useRespondCorrection,
  useAdminProposals,
} from '@/hooks/use-offer-corrections';
import {
  useUpdateProposalItem,
  useResolveProposal,
} from '@/hooks/use-proposal-diff';
import { fireNotification } from '@/hooks/use-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { buildPublicOfferUrl } from '@/lib/constants';
import { formatCurrency } from '@/lib/calculations';

// ── Timeline item types ──

interface TimelineCorrection {
  kind: 'correction';
  id: string;
  createdAt: string;
  type: 'question' | 'correction';
  message: string;
  clientName: string | null;
  status: string;
  managerResponse: string | null;
  respondedAt: string | null;
}

interface ProposalItemData {
  id: string;
  changeType: string;
  originalDish: string;
  proposedDish: string | null;
  proposedVariantOption: string | null;
  status: string;
  originalPrice: number;
  proposedPrice: number;
  originalQuantity: number;
  proposedQuantity: number | null;
}

interface TimelineProposal {
  kind: 'proposal';
  id: string;
  createdAt: string;
  clientMessage: string | null;
  clientName: string | null;
  status: string;
  items: ProposalItemData[];
}

type TimelineItem = TimelineCorrection | TimelineProposal;

// ── Status configs ──

const PROPOSAL_STATUS: Record<string, { label: string; className: string }> = {
  draft_client: { label: 'Szkic klienta', className: 'bg-muted text-muted-foreground' },
  pending: { label: 'Oczekuje', className: 'bg-orange-100 text-orange-800' },
  accepted: { label: 'Zaakceptowana', className: 'bg-green-100 text-green-800' },
  partially_accepted: { label: 'Częściowo', className: 'bg-yellow-100 text-yellow-800' },
  rejected: { label: 'Odrzucona', className: 'bg-red-100 text-red-800' },
};

const ITEM_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Oczekuje', className: 'text-orange-700' },
  accepted: { label: '✅', className: 'text-green-700' },
  rejected: { label: '❌', className: 'text-red-700' },
  invalidated: { label: '⚠️', className: 'text-yellow-700' },
};

const CHANGE_LABEL: Record<string, string> = {
  SWAP: 'Zamiana',
  VARIANT_CHANGE: 'Wariant',
  SPLIT: 'Podział',
  QUANTITY_CHANGE: 'Ilość',
};


// ── Page Component ──

export const OfferMessagesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: corrections, isLoading: loadingCorrections } = useAdminCorrections(id);
  const { data: proposals, isLoading: loadingProposals } = useAdminProposals(id);
  const respondMutation = useRespondCorrection();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    subject: string;
    body: string;
    clientEmail: string;
    clientName: string;
  } | null>(null);

  const { data: offer } = useQuery({
    queryKey: ['offer-for-messages', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('*, clients(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // ── Build timeline ──
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    (corrections ?? []).forEach((c) => {
      items.push({
        kind: 'correction',
        id: c.id,
        createdAt: c.created_at ?? '',
        type: (c.type as 'question' | 'correction') ?? 'correction',
        message: c.message,
        clientName: c.client_name,
        status: c.status,
        managerResponse: c.manager_response,
        respondedAt: c.responded_at,
      });
    });

    (proposals ?? []).forEach((p: any) => {
      items.push({
        kind: 'proposal',
        id: p.id,
        createdAt: p.created_at ?? '',
        clientMessage: p.client_message,
        clientName: p.client_name,
        status: p.status,
        items: (p.proposal_items ?? []).map((pi: any) => {
          // Resolve numeric variant option to label from dish's modifiable_items
          let variantOption = pi.proposed_variant_option as string | null;
          if (variantOption && /^\d+$/.test(variantOption) && pi.dishes?.modifiable_items) {
            const mods = pi.dishes.modifiable_items;
            if (mods && typeof mods === 'object' && 'type' in mods && mods.type === 'variant') {
              const options = (mods as any).options as { label?: string }[] | undefined;
              const idx = parseInt(variantOption, 10);
              if (options && options[idx]?.label) {
                variantOption = options[idx].label;
              }
            }
          }
          return {
            id: pi.id,
            changeType: pi.change_type,
            originalDish: pi.dishes?.display_name ?? '—',
            proposedDish: pi.proposed_dish?.display_name ?? null,
            proposedVariantOption: variantOption,
            status: pi.status,
            originalPrice: pi.original_price ?? 0,
            proposedPrice: pi.proposed_price ?? 0,
            originalQuantity: pi.original_quantity ?? 0,
            proposedQuantity: pi.proposed_quantity,
          };
        }),
      });
    });

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  }, [corrections, proposals]);

  // ── Respond handler ──
  const handleRespond = (correctionId: string, type: string) => {
    const responseText = responses[correctionId]?.trim();
    if (!responseText) {
      toast.error('Wpisz treść odpowiedzi.');
      return;
    }

    respondMutation.mutate(
      { correctionId, managerResponse: responseText },
      {
        onSuccess: () => {
          toast.success('Odpowiedź zapisana');
          setResponses((prev) => ({ ...prev, [correctionId]: '' }));

          if (id && offer) {
            fireNotification({
              offerId: id,
              eventType: 'response_sent',
              title: `✉️ Odpowiedź wysłana — ${offer.offer_number ?? ''}`,
              body: 'Odpowiedziałeś na pytanie/korektę klienta.',
              link: `/admin/offers/${id}/messages`,
            });
          }

          const client = offer?.clients as any;
          const clientEmail = client?.email ?? '';
          const clientName = client?.name ?? '';
          const offerNumber = offer?.offer_number ?? '';
          const publicToken = offer?.public_token ?? '';
          const isQuestion = type === 'question';

          setEmailModal({
            open: true,
            clientEmail,
            clientName,
            subject: isQuestion
              ? `Odpowiedź na pytanie — oferta ${offerNumber}`
              : `Odpowiedź na korektę — oferta ${offerNumber}`,
            body: `Szanowna/y ${clientName},\n\ndziękujemy za ${isQuestion ? 'pytanie' : 'uwagę'} dotyczące oferty ${offerNumber}.\n\n${responseText}\n\nSzczegóły znajdziesz w swojej ofercie:\n${publicToken ? buildPublicOfferUrl(publicToken) : ''}\n\nPozdrawiamy,\nCatering Śląski\ntel. +48 123 456 789 | zamowienia@cateringslaski.pl`,
          });
        },
        onError: () => {
          toast.error('Nie udało się zapisać odpowiedzi.');
        },
      },
    );
  };

  const isLoading = loadingCorrections || loadingProposals;
  if (isLoading) return <LoadingSpinner />;

  const client = offer?.clients as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={id ? `/admin/offers/${id}/edit` : '/admin/offers'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            💬 Komunikacja — {offer?.offer_number ?? 'Oferta'}
          </h1>
          {client && (
            <p className="text-sm text-muted-foreground">
              {client.name}
              {offer?.people_count ? ` · ${offer.people_count} os.` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!timeline.length ? (
        <EmptyState
          icon={MessageCircle}
          title="Brak wiadomości"
          description="Klient nie wysłał jeszcze żadnych pytań, korekt ani propozycji zmian."
        />
      ) : (
        <div className="space-y-3">
          {timeline.map((item) =>
            item.kind === 'correction' ? (
              <CorrectionBubble
                key={`c-${item.id}`}
                item={item}
                responseText={responses[item.id] ?? ''}
                onResponseChange={(val) =>
                  setResponses((prev) => ({ ...prev, [item.id]: val }))
                }
                onRespond={() => handleRespond(item.id, item.type)}
                isPending={respondMutation.isPending}
              />
            ) : (
              <ProposalBubble
                key={`p-${item.id}`}
                item={item}
                offerId={id!}
                offer={offer}
                onEmailModal={setEmailModal}
              />
            ),
          )}
        </div>
      )}

      {emailModal?.open && (
        <EmailTemplateModal
          open={emailModal.open}
          onClose={() => setEmailModal(null)}
          recipientEmail={emailModal.clientEmail}
          subject={emailModal.subject}
          body={emailModal.body}
          title="Powiadom klienta o odpowiedzi"
        />
      )}
    </div>
  );
};

// ── Correction / Question Bubble ──

interface CorrectionBubbleProps {
  item: TimelineCorrection;
  responseText: string;
  onResponseChange: (val: string) => void;
  onRespond: () => void;
  isPending: boolean;
}

const CorrectionBubble = ({
  item,
  responseText,
  onResponseChange,
  onRespond,
  isPending,
}: CorrectionBubbleProps) => {
  const isQuestion = item.type === 'question';
  const isResolved = item.status === 'resolved';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          {isQuestion ? (
            <Badge className="bg-blue-100 text-blue-800 border-none">
              <MessageCircle className="h-3 w-3 mr-1" />
              Pytanie
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-800 border-none">
              <FileEdit className="h-3 w-3 mr-1" />
              Korekta
            </Badge>
          )}
          <Badge
            variant="outline"
            className={
              item.status === 'new'
                ? 'border-yellow-300 text-yellow-700'
                : isResolved
                  ? 'border-green-300 text-green-700'
                  : ''
            }
          >
            {item.status === 'new' ? '⏳ Nowe' : item.status === 'read' ? '👁 Przeczytane' : '✅ Rozwiązane'}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {item.createdAt
              ? format(new Date(item.createdAt), 'dd.MM.yyyy, HH:mm', { locale: pl })
              : ''}
          </span>
        </div>

        {/* Client name */}
        {item.clientName && (
          <p className="text-xs font-medium text-muted-foreground">{item.clientName}</p>
        )}

        {/* Client message */}
        <div className="rounded-lg bg-muted p-3 text-sm">{item.message}</div>

        {/* Manager response (if resolved) */}
        {isResolved && item.managerResponse && (
          <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Twoja odpowiedź:</p>
            <p>{item.managerResponse}</p>
            {item.respondedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                {format(new Date(item.respondedAt), 'dd.MM.yyyy, HH:mm', { locale: pl })}
              </p>
            )}
          </div>
        )}

        {/* Response form (if not resolved) */}
        {!isResolved && (
          <div className="space-y-2">
            <Textarea
              value={responseText}
              onChange={(e) => onResponseChange(e.target.value)}
              placeholder="Twoja odpowiedź..."
              className="min-h-[60px]"
            />
            <Button
              onClick={onRespond}
              disabled={isPending}
              size="sm"
              className="gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              {isQuestion ? 'Odpowiedz' : 'Rozwiąż'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Proposal Bubble ──

interface ProposalBubbleProps {
  item: TimelineProposal;
  offerId: string;
  offer: any;
  onEmailModal: (modal: {
    open: boolean;
    subject: string;
    body: string;
    clientEmail: string;
    clientName: string;
  }) => void;
}

const ProposalBubble = ({ item, offerId, offer, onEmailModal }: ProposalBubbleProps) => {
  const statusConfig = PROPOSAL_STATUS[item.status] ?? PROPOSAL_STATUS.pending;
  const isPending = item.status === 'pending';
  const isResolved = ['accepted', 'partially_accepted', 'rejected'].includes(item.status);
  const [flashStates, setFlashStates] = useState<Record<string, 'green' | 'red' | null>>({});
  const [managerNotes, setManagerNotes] = useState('');

  const updateItemMutation = useUpdateProposalItem();
  const resolveMutation = useResolveProposal();

  // Track local overrides for optimistic UI
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  const getItemStatus = (pi: ProposalItemData) => localStatuses[pi.id] ?? pi.status;
  const pendingCount = item.items.filter((i) => getItemStatus(i) === 'pending').length;
  const allDecided = isPending && pendingCount === 0 && item.items.length > 0;

  const handleItemAction = useCallback(
    async (itemId: string, status: 'accepted' | 'rejected') => {
      const { data: { user } } = await supabase.auth.getUser();

      setFlashStates((prev) => ({ ...prev, [itemId]: status === 'accepted' ? 'green' : 'red' }));
      setTimeout(() => setFlashStates((prev) => ({ ...prev, [itemId]: null })), 600);

      setLocalStatuses((prev) => ({ ...prev, [itemId]: status }));

      updateItemMutation.mutate(
        { itemId, status, decidedBy: user?.id ?? '' },
        {
          onError: () => {
            setLocalStatuses((prev) => {
              const copy = { ...prev };
              delete copy[itemId];
              return copy;
            });
            toast.error('Nie udało się zaktualizować pozycji.');
          },
        },
      );
    },
    [updateItemMutation],
  );

  const handleResolve = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const acceptedCount = item.items.filter((i) => getItemStatus(i) === 'accepted').length;
    const rejectedCount = item.items.filter((i) => getItemStatus(i) === 'rejected').length;
    const total = item.items.length;

    let finalStatus: 'accepted' | 'partially_accepted' | 'rejected';
    if (acceptedCount === total) finalStatus = 'accepted';
    else if (rejectedCount === total) finalStatus = 'rejected';
    else finalStatus = 'partially_accepted';

    resolveMutation.mutate(
      {
        proposalId: item.id,
        status: finalStatus,
        managerNotes: managerNotes.trim() || undefined,
        resolvedBy: user?.id ?? '',
      },
      {
        onSuccess: () => {
          toast.success('Propozycja rozpatrzona');

          if (offer) {
            fireNotification({
              offerId,
              eventType: 'proposal_resolved',
              title: `📋 Propozycja rozpatrzona — ${offer.offer_number ?? ''}`,
              body: `Status: ${PROPOSAL_STATUS[finalStatus]?.label ?? finalStatus}`,
              link: `/admin/offers/${offerId}/messages`,
            });

            const client = offer.clients as any;
            if (client?.email) {
              const publicToken = offer.public_token ?? '';
              onEmailModal({
                open: true,
                clientEmail: client.email,
                clientName: client.name ?? '',
                subject: `Decyzja w sprawie propozycji zmian — oferta ${offer.offer_number ?? ''}`,
                body: `Szanowna/y ${client.name ?? ''},\n\nrozpatrzyliśmy Twoją propozycję zmian do oferty ${offer.offer_number ?? ''}.\n\nStatus: ${PROPOSAL_STATUS[finalStatus]?.label ?? finalStatus}\n${managerNotes.trim() ? `\nUwagi: ${managerNotes.trim()}\n` : ''}\nSzczegóły znajdziesz w swojej ofercie:\n${publicToken ? buildPublicOfferUrl(publicToken) : ''}\n\nPozdrawiamy,\nCatering Śląski`,
              });
            }
          }
        },
        onError: () => {
          toast.error('Nie udało się rozpatrzyć propozycji.');
        },
      },
    );
  }, [item, managerNotes, resolveMutation, offerId, offer, onEmailModal, localStatuses]);

  const priceDiff = item.items.reduce((sum, pi) => sum + (pi.proposedPrice - pi.originalPrice), 0);

  return (
    <Card className="overflow-hidden border-l-4 border-l-indigo-400">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-indigo-100 text-indigo-800 border-none">
            <RefreshCw className="h-3 w-3 mr-1" />
            Propozycja zmian
          </Badge>
          <Badge variant="outline" className={`${statusConfig.className} border-none`}>
            {statusConfig.label}
          </Badge>
          {isPending && pendingCount > 0 && (
            <span className="text-xs text-orange-600 font-medium">
              {pendingCount} do rozpatrzenia
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {item.createdAt
              ? format(new Date(item.createdAt), 'dd.MM.yyyy, HH:mm', { locale: pl })
              : ''}
          </span>
        </div>

        {/* Client name + message */}
        {item.clientName && (
          <p className="text-xs font-medium text-muted-foreground">{item.clientName}</p>
        )}
        {item.clientMessage && (
          <div className="rounded-lg bg-muted p-3 text-sm">{item.clientMessage}</div>
        )}

        {/* Items with inline actions */}
        <div className="space-y-1">
          {item.items.map((pi) => {
            const currentStatus = getItemStatus(pi);
            const itemStatusConf = ITEM_STATUS[currentStatus] ?? ITEM_STATUS.pending;
            const flash = flashStates[pi.id];
            const proposedLabel =
              pi.changeType === 'SWAP' && pi.proposedDish
                ? pi.proposedDish
                : pi.changeType === 'VARIANT_CHANGE' && pi.proposedVariantOption
                  ? pi.proposedVariantOption
                  : CHANGE_LABEL[pi.changeType] ?? pi.changeType;

            const pDiff = pi.proposedPrice - pi.originalPrice;

            return (
              <div
                key={pi.id}
                className={`flex items-center gap-2 text-sm rounded px-2 py-1.5 transition-colors duration-300 ${
                  flash === 'green'
                    ? 'bg-green-100'
                    : flash === 'red'
                      ? 'bg-red-100'
                      : 'bg-muted/50'
                }`}
              >
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  {CHANGE_LABEL[pi.changeType] ?? pi.changeType}
                </span>
                <span className="font-medium truncate">{pi.originalDish}</span>
                <span className="text-muted-foreground shrink-0">→</span>
                <span className="font-medium truncate">{proposedLabel}</span>
                {pDiff !== 0 && (
                  <span className={`text-xs shrink-0 ${pDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {pDiff > 0 ? '+' : ''}{formatCurrency(pDiff)}
                  </span>
                )}
                {isPending && currentStatus === 'pending' ? (
                  <div className="ml-auto flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-700 hover:bg-green-100"
                      onClick={() => handleItemAction(pi.id, 'accepted')}
                      disabled={updateItemMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-700 hover:bg-red-100"
                      onClick={() => handleItemAction(pi.id, 'rejected')}
                      disabled={updateItemMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className={`ml-auto text-xs font-medium shrink-0 ${itemStatusConf.className}`}>
                    {itemStatusConf.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Price diff summary */}
        {priceDiff !== 0 && (
          <div className="flex items-center justify-between text-sm px-2">
            <span className="text-muted-foreground">Wpływ cenowy:</span>
            <span className={`font-semibold ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
            </span>
          </div>
        )}

        {/* Resolve section — shown when all items decided */}
        {isPending && allDecided && (
          <div className="space-y-2 border-t pt-3">
            <Textarea
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="Notatka do decyzji (opcjonalnie)..."
              className="min-h-[50px]"
            />
            <Button
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Zatwierdź decyzje
            </Button>
          </div>
        )}

        {/* Link to full diff for resolved or complex cases */}
        {isResolved && (
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to={`/admin/offers/${offerId}/proposals/${item.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              Zobacz szczegóły
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
