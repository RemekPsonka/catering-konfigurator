import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Copy, Trash2, Pencil } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { formatCurrency } from '@/lib/calculations';
import { MAX_VARIANTS } from '@/lib/constants';
import {
  useOfferVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
  useAddVariantItem,
  useUpdateVariantItem,
  useRemoveVariantItem,
  useDuplicateVariant,
  useReorderVariantItems,
  getItemPrice,
  type VariantWithItems,
} from '@/hooks/use-offer-variants';
import { useAdminPendingProposals } from '@/hooks/use-admin-pending-proposals';
import { useUpdateProposalItem, useResolveProposal } from '@/hooks/use-proposal-diff';
import { useAuth } from '@/hooks/use-auth';
import { VariantItemsTable } from './variant-items-table';
import { ClientProposalsBanner } from './client-proposals-banner';
import { ProposalHistoryPanel } from './proposal-history-panel';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { RequirementHints } from '../requirement-hints';
import type { ClientRequirement } from '../requirements-sidebar';
import { toast } from 'sonner';

interface StepMenuProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
  requirements?: ClientRequirement[];
  acceptedVariantId?: string | null;
}

const DEFAULT_VARIANT_NAMES = ['Classic', 'Premium', 'De Luxe'];

export const StepMenu = ({ offerId, pricingMode, peopleCount, requirements = [], acceptedVariantId }: StepMenuProps) => {
  const { data: variants, isLoading } = useOfferVariants(offerId);
  const { data: pendingData } = useAdminPendingProposals(offerId);
  const { user } = useAuth();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant();
  const deleteVariant = useDeleteVariant();
  const addItem = useAddVariantItem();
  const updateItem = useUpdateVariantItem();
  const removeItem = useRemoveVariantItem();
  const duplicateVariant = useDuplicateVariant();
  const reorderItems = useReorderVariantItems();
  const updateProposalItem = useUpdateProposalItem();
  const resolveProposal = useResolveProposal();

  const [activeTab, setActiveTab] = useState<string>('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const variantsList = variants ?? [];

  useEffect(() => {
    if (variantsList.length > 0 && (!activeTab || !variantsList.find(v => v.id === activeTab))) {
      setActiveTab(variantsList[0].id);
    }
  }, [variantsList, activeTab]);

  if (!offerId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Zapisz szkic oferty aby dodać dania do wariantów.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  const handleAddVariant = () => {
    if (variantsList.length >= MAX_VARIANTS) {
      toast.error(`Maksymalnie ${MAX_VARIANTS} warianty`);
      return;
    }
    const usedNames = variantsList.map(v => v.name);
    const nextName = DEFAULT_VARIANT_NAMES.find(n => !usedNames.includes(n)) ?? `Wariant ${variantsList.length + 1}`;
    createVariant.mutate(
      { offer_id: offerId, name: nextName, sort_order: variantsList.length },
      { onSuccess: (v) => setActiveTab(v.id) },
    );
  };

  const handleRecommendedChange = (variantId: string, checked: boolean) => {
    if (checked) {
      variantsList.forEach(v => {
        if (v.is_recommended && v.id !== variantId) {
          updateVariant.mutate({ id: v.id, offer_id: offerId, is_recommended: false });
        }
      });
    }
    updateVariant.mutate({ id: variantId, offer_id: offerId, is_recommended: checked });
  };

  const handleDuplicate = (variant: VariantWithItems) => {
    if (variantsList.length >= MAX_VARIANTS) {
      toast.error(`Maksymalnie ${MAX_VARIANTS} warianty`);
      return;
    }
    duplicateVariant.mutate({
      variantId: variant.id,
      offer_id: offerId,
      newName: `${variant.name} (kopia)`,
      newSortOrder: variantsList.length,
    });
  };

  const startRename = (variant: VariantWithItems) => {
    setEditingName(variant.id);
    setNameValue(variant.name);
  };

  const finishRename = (variantId: string) => {
    if (nameValue.trim()) {
      updateVariant.mutate({ id: variantId, offer_id: offerId, name: nameValue.trim() });
    }
    setEditingName(null);
  };

  const calculateVariantTotal = (variant: VariantWithItems): number => {
    return variant.variant_items.reduce((sum, item) => {
      return sum + getItemPrice(item) * (item.quantity ?? 1);
    }, 0);
  };

  const handleAcceptProposalItem = async (itemId: string, proposalId: string) => {
    if (!user?.id) return;
    try {
      await updateProposalItem.mutateAsync({
        itemId,
        status: 'accepted',
        decidedBy: user.id,
      });
      // Check if all items in proposal are decided, auto-resolve
      await checkAndAutoResolve(proposalId);
      toast.success('Propozycja zaakceptowana');
    } catch {
      toast.error('Nie udało się zaakceptować propozycji');
    }
  };

  const handleRejectProposalItem = async (itemId: string, proposalId: string) => {
    if (!user?.id) return;
    try {
      await updateProposalItem.mutateAsync({
        itemId,
        status: 'rejected',
        decidedBy: user.id,
      });
      await checkAndAutoResolve(proposalId);
      toast.success('Propozycja odrzucona');
    } catch {
      toast.error('Nie udało się odrzucić propozycji');
    }
  };

  const checkAndAutoResolve = async (proposalId: string) => {
    if (!user?.id) return;
    // Refetch proposal items to check if all decided
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: items } = await supabase
      .from('proposal_items')
      .select('status')
      .eq('proposal_id', proposalId);

    if (!items) return;
    const allDecided = items.every(i => i.status === 'accepted' || i.status === 'rejected');
    if (!allDecided) return;

    const hasAccepted = items.some(i => i.status === 'accepted');
    const hasRejected = items.some(i => i.status === 'rejected');

    let status: 'accepted' | 'partially_accepted' | 'rejected';
    if (hasAccepted && hasRejected) status = 'partially_accepted';
    else if (hasAccepted) status = 'accepted';
    else status = 'rejected';

    await resolveProposal.mutateAsync({
      proposalId,
      status,
      resolvedBy: user.id,
    });
  };

  const activeVariant = variantsList.find(v => v.id === activeTab);

  return (
    <div className="space-y-4">
      {requirements.length > 0 && (
        <>
          <RequirementHints requirements={requirements} category="menu" />
          <RequirementHints requirements={requirements} category="dietary" />
        </>
      )}

      {/* Pending proposals banner */}
      {pendingData && pendingData.proposals.length > 0 && (
        <ClientProposalsBanner offerId={offerId} proposals={pendingData.proposals} />
      )}

      {variantsList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Dodaj pierwszy wariant menu</p>
            <Button onClick={handleAddVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj wariant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center gap-2">
              <TabsList>
                {variantsList.map(v => (
                  <TabsTrigger key={v.id} value={v.id} className="gap-1.5">
                    {editingName === v.id ? (
                      <Input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onBlur={() => finishRename(v.id)}
                        onKeyDown={(e) => e.key === 'Enter' && finishRename(v.id)}
                        className="h-6 w-28 text-xs"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span onDoubleClick={() => startRename(v)}>{v.name}</span>
                    )}
                    {v.is_recommended && <span className="text-xs">⭐</span>}
                    {v.id === acceptedVariantId && (
                      <Badge className="bg-green-100 text-green-800 text-[10px] ml-1">✓ Wybrany</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {variantsList.length < MAX_VARIANTS && (
                <Button variant="outline" size="sm" onClick={handleAddVariant} disabled={createVariant.isPending}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            {variantsList.map(v => (
              <TabsContent key={v.id} value={v.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{v.name}</CardTitle>
                        {v.id === acceptedVariantId && (
                          <Badge className="bg-green-100 text-green-800 text-xs">✓ Wybrany przez klienta</Badge>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id={`rec-${v.id}`}
                            checked={v.is_recommended ?? false}
                            onCheckedChange={(checked) => handleRecommendedChange(v.id, !!checked)}
                          />
                          <label htmlFor={`rec-${v.id}`} className="text-xs text-muted-foreground cursor-pointer">Polecany</label>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startRename(v)} title="Zmień nazwę">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(v)} title="Duplikuj" disabled={variantsList.length >= MAX_VARIANTS}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {variantsList.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(v.id)} title="Usuń">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <VariantItemsTable
                      items={v.variant_items}
                      variantId={v.id}
                      offerId={offerId}
                      onAddItem={(dishId) =>
                        addItem.mutate({
                          variant_id: v.id,
                          dish_id: dishId,
                          sort_order: v.variant_items.length,
                          offer_id: offerId,
                        })
                      }
                      onUpdateItem={(id, data) =>
                        updateItem.mutate({ id, offer_id: offerId, ...data })
                      }
                      onRemoveItem={(id) =>
                        removeItem.mutate({ id, offer_id: offerId })
                      }
                      onReorder={(items) =>
                        reorderItems.mutate({ items, offer_id: offerId })
                      }
                      pendingProposalItems={pendingData?.itemsByVariantItem}
                      onAcceptProposalItem={handleAcceptProposalItem}
                      onRejectProposalItem={handleRejectProposalItem}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Live calculation */}
          {activeVariant && activeVariant.variant_items.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {pricingMode === 'PER_PERSON'
                      ? `Σ pozycji = ${formatCurrency(calculateVariantTotal(activeVariant))}/os. × ${peopleCount} osób`
                      : `Σ (cena × ilość)`}
                  </span>
                  <span className="text-lg font-bold">
                    {pricingMode === 'PER_PERSON'
                      ? formatCurrency(calculateVariantTotal(activeVariant) * peopleCount)
                      : formatCurrency(calculateVariantTotal(activeVariant))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proposal history */}
          <ProposalHistoryPanel offerId={offerId} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
        title="Usuń wariant"
        description="Czy na pewno chcesz usunąć ten wariant wraz ze wszystkimi pozycjami?"
        onConfirm={() => {
          if (deleteConfirm) {
            deleteVariant.mutate({ id: deleteConfirm, offer_id: offerId });
            setDeleteConfirm(null);
          }
        }}
      />
    </div>
  );
};
