import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Clock, ArrowRight } from 'lucide-react';
import { useAdminProposals } from '@/hooks/use-offer-corrections';
import { formatCurrency } from '@/lib/calculations';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ProposalHistoryPanelProps {
  offerId: string;
}

const STATUS_CONFIG = {
  accepted: { label: 'Zaakceptowana', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Check },
  rejected: { label: 'Odrzucona', className: 'bg-red-100 text-red-800 border-red-200', icon: X },
  partially_accepted: { label: 'Częściowo', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  pending: { label: 'Oczekuje', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  draft_client: { label: 'Szkic', className: 'bg-muted text-muted-foreground', icon: Clock },
} as const;

const ITEM_STATUS_CONFIG = {
  accepted: { label: 'Zaakceptowane', className: 'bg-emerald-50 text-emerald-700', icon: Check },
  rejected: { label: 'Odrzucone', className: 'bg-red-50 text-red-700', icon: X },
  pending: { label: 'Oczekuje', className: 'bg-yellow-50 text-yellow-700', icon: Clock },
  invalidated: { label: 'Nieaktualne', className: 'bg-muted text-muted-foreground', icon: X },
} as const;

const CHANGE_TYPE_LABEL: Record<string, string> = {
  SWAP: 'Zamiana',
  VARIANT_CHANGE: 'Wariant',
  SPLIT: 'Podział',
  QUANTITY_CHANGE: 'Ilość',
};

export const ProposalHistoryPanel = ({ offerId }: ProposalHistoryPanelProps) => {
  const { data: proposals, isLoading } = useAdminProposals(offerId);

  if (isLoading || !proposals || proposals.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            📋 Historia zmian klienta
          </CardTitle>
          <Badge variant="outline" className="text-xs">{proposals.length} propozycji</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {proposals.map((proposal: Record<string, unknown>) => {
          const status = proposal.status as string;
          const statusConf = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
          const StatusIcon = statusConf.icon;
          const createdAt = proposal.created_at as string | null;
          const timeAgo = createdAt
            ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: pl })
            : '';
          const priceDiff = proposal.price_diff as number | null;
          const clientMessage = proposal.client_message as string | null;
          const managerNotes = proposal.manager_notes as string | null;
          const proposalItems = (proposal.proposal_items ?? []) as Record<string, unknown>[];

          return (
            <div key={proposal.id as string} className="rounded-lg border p-3 space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={statusConf.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConf.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>
                {priceDiff != null && priceDiff !== 0 && (
                  <span className={`text-xs font-medium ${priceDiff > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)}
                  </span>
                )}
              </div>

              {/* Client message */}
              {clientMessage && (
                <p className="text-xs text-muted-foreground italic">"{clientMessage}"</p>
              )}

              {/* Items */}
              <div className="space-y-1">
                {proposalItems.map((item) => {
                  const itemStatus = item.status as string;
                  const itemConf = ITEM_STATUS_CONFIG[itemStatus as keyof typeof ITEM_STATUS_CONFIG] ?? ITEM_STATUS_CONFIG.pending;
                  const ItemIcon = itemConf.icon;
                  const changeType = item.change_type as string;
                  const dishes = item.dishes as { display_name?: string } | null;
                  const proposedDish = item.proposed_dish as { display_name?: string } | null;
                  const originalName = dishes?.display_name ?? 'Danie';

                  // Resolve numeric variant option to label
                  let variantOption = item.proposed_variant_option as string | null;
                  if (variantOption && /^\d+$/.test(variantOption) && dishes && 'modifiable_items' in dishes) {
                    const mods = (dishes as Record<string, unknown>).modifiable_items;
                    if (mods && typeof mods === 'object' && (mods as Record<string, unknown>).type === 'variant') {
                      const options = (mods as Record<string, unknown>).options as { label?: string }[] | undefined;
                      const idx = parseInt(variantOption, 10);
                      if (options && options[idx]?.label) {
                        variantOption = options[idx].label;
                      }
                    }
                  }

                  const proposedName = changeType === 'SWAP' && proposedDish?.display_name
                    ? proposedDish.display_name
                    : changeType === 'VARIANT_CHANGE' && variantOption
                      ? variantOption
                      : CHANGE_TYPE_LABEL[changeType] ?? changeType;

                  const originalPrice = (item.original_price as number) ?? 0;
                  const proposedPrice = (item.proposed_price as number) ?? 0;
                  const itemPriceDiff = proposedPrice - originalPrice;

                  return (
                    <div
                      key={item.id as string}
                      className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${itemConf.className}`}
                    >
                      <ItemIcon className="h-3 w-3 shrink-0" />
                      <span className="text-muted-foreground shrink-0">
                        {CHANGE_TYPE_LABEL[changeType] ?? changeType}
                      </span>
                      <span className="truncate">{originalName}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{proposedName}</span>
                      {itemPriceDiff !== 0 && (
                        <span className={`shrink-0 ${itemPriceDiff > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                          {itemPriceDiff > 0 ? '+' : ''}{formatCurrency(itemPriceDiff)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Manager notes */}
              {managerNotes && (
                <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5">
                  <span className="font-medium">Manager:</span> {managerNotes}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
