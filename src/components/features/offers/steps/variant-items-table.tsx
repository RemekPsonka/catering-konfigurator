import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GripVertical, ImageIcon, Plus, Trash2, Settings2, UserCog, Check, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { VariantItemWithDish } from '@/hooks/use-offer-variants';
import { getItemPrice } from '@/hooks/use-offer-variants';
import { formatCurrency } from '@/lib/calculations';
import { UNIT_TYPE_LABELS } from '@/lib/dish-constants';
import { DishPickerSheet } from './dish-picker-sheet';
import { ModificationOverrideDialog } from './modification-override-dialog';
import { ManagerModificationDialog } from './manager-modification-dialog';
import type { Json } from '@/integrations/supabase/types';
import type { PendingProposalItem } from '@/hooks/use-admin-pending-proposals';

interface VariantItemsTableProps {
  items: VariantItemWithDish[];
  variantId: string;
  offerId: string;
  onAddItem: (dishId: string) => void;
  onUpdateItem: (id: string, data: Record<string, unknown>) => void;
  onRemoveItem: (id: string) => void;
  onReorder: (items: Array<{ id: string; sort_order: number }>) => void;
  pendingProposalItems?: Map<string, PendingProposalItem[]>;
  onAcceptProposalItem?: (itemId: string, proposalId: string) => void;
  onRejectProposalItem?: (itemId: string, proposalId: string) => void;
}

interface SortableRowProps {
  item: VariantItemWithDish;
  onUpdateItem: (id: string, data: Record<string, unknown>) => void;
  onRemoveItem: (id: string) => void;
  onEditModifications: (item: VariantItemWithDish) => void;
  onManagerOverride: (item: VariantItemWithDish) => void;
  proposalItems?: PendingProposalItem[];
  onAcceptProposalItem?: (itemId: string, proposalId: string) => void;
  onRejectProposalItem?: (itemId: string, proposalId: string) => void;
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  SWAP: '🔄 Zamiana',
  VARIANT_CHANGE: '🎨 Wariant',
  SPLIT: '✂️ Podział',
  QUANTITY_CHANGE: '📊 Ilość',
};

const SortableRow = ({ item, onUpdateItem, onRemoveItem, onEditModifications, onManagerOverride, proposalItems, onAcceptProposalItem, onRejectProposalItem }: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState('');

  const price = getItemPrice(item);
  const quantity = item.quantity ?? 1;
  const subtotal = price * quantity;

  const modType = (() => {
    const mods = (item.allowed_modifications ?? item.dishes?.modifiable_items) as Record<string, unknown> | null;
    return mods?.type as string | undefined;
  })();

  const hasModConfig = !!modType;
  const hasPendingProposals = proposalItems && proposalItems.length > 0;

  const handlePriceClick = () => {
    setPriceValue(price.toString());
    setEditingPrice(true);
  };

  const handlePriceBlur = () => {
    setEditingPrice(false);
    const newPrice = parseFloat(priceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      onUpdateItem(item.id, { custom_price: newPrice });
    }
  };

  return (
    <>
      <TableRow ref={setNodeRef} style={style} className={hasPendingProposals ? 'border-b-0' : ''}>
        <TableCell className="w-8">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </TableCell>
        <TableCell className="w-10">
          {item.dishes.photo_url ? (
            <img src={item.dishes.photo_url} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <ImageIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{item.custom_name ?? item.dishes.display_name}</span>
            {item.selected_variant_option && (
              <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                ✓ {item.selected_variant_option}
              </Badge>
            )}
            {modType && item.is_client_editable && (
              <Badge variant="outline" className="text-xs">
                🔄 {modType === 'swap' ? 'SWAP' : modType === 'variant' ? 'VARIANT' : 'SPLIT'}
              </Badge>
            )}
            {hasPendingProposals && (
              <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">
                Propozycja klienta
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{UNIT_TYPE_LABELS[item.dishes.unit_type] ?? ''}</span>
            {item.custom_name && item.custom_name !== item.dishes.display_name && (
              <span className="text-xs text-blue-600">✓ zamiana z: {item.dishes.display_name}</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          {editingPrice ? (
            <Input
              type="number"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onBlur={handlePriceBlur}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
              className="w-24 h-8"
              autoFocus
              min={0}
              step={0.01}
            />
          ) : (
            <button onClick={handlePriceClick} className="text-sm hover:underline cursor-pointer">
              {formatCurrency(price)}
              {item.custom_price != null && <span className="text-xs text-muted-foreground ml-1">(nadpisana)</span>}
            </button>
          )}
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => onUpdateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-16 h-8"
            min={1}
          />
        </TableCell>
        <TableCell className="text-sm font-medium">{formatCurrency(subtotal)}</TableCell>
        <TableCell>
          <Switch
            checked={item.is_client_editable ?? false}
            onCheckedChange={(v) => onUpdateItem(item.id, { is_client_editable: v })}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {item.is_client_editable && hasModConfig && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onManagerOverride(item)} title="Zmień za klienta">
                <UserCog className="h-3.5 w-3.5" />
              </Button>
            )}
            {item.is_client_editable && item.dishes.is_modifiable && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditModifications(item)} title="Konfiguruj zamienniki">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveItem(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Inline proposal rows */}
      {proposalItems?.map(pi => {
        const descriptionNode = (() => {
          if (pi.changeType === 'SWAP' && pi.proposedDishName) {
            return <>Zamiana na: <strong>{pi.proposedDishName}</strong></>;
          }
          if (pi.changeType === 'VARIANT_CHANGE') {
            const label = pi.resolvedProposedLabel ?? pi.proposedVariantOption ?? '—';
            return <>Zmiana wariantu na: <strong>{label}</strong></>;
          }
          if (pi.changeType === 'QUANTITY_CHANGE' && pi.proposedQuantity != null) {
            return <>Zmiana ilości na: <strong>{pi.proposedQuantity} szt.</strong></>;
          }
          return <>{pi.proposedDishName ?? pi.proposedVariantOption ?? '—'}</>;
        })();

        return (
        <TableRow key={pi.id} className="bg-orange-50/50 border-t-0">
          <TableCell colSpan={2} />
          <TableCell colSpan={3}>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-orange-700 font-medium">{CHANGE_TYPE_LABELS[pi.changeType] ?? pi.changeType}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">
                {descriptionNode}
              </span>
              {pi.proposedPrice !== pi.originalPrice && (
                <span className={pi.proposedPrice > pi.originalPrice ? 'text-destructive text-xs' : 'text-green-600 text-xs'}>
                  ({pi.proposedPrice > pi.originalPrice ? '+' : ''}{formatCurrency(pi.proposedPrice - pi.originalPrice)})
                </span>
              )}
            </div>
          </TableCell>
          <TableCell colSpan={3}>
            <div className="flex items-center gap-1 justify-end">
              {onAcceptProposalItem && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-green-700 hover:text-green-800 hover:bg-green-50"
                  onClick={() => onAcceptProposalItem(pi.id, pi.proposalId)}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Akceptuj
                </Button>
              )}
              {onRejectProposalItem && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive hover:bg-red-50"
                  onClick={() => onRejectProposalItem(pi.id, pi.proposalId)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Odrzuć
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
        );
      })}
    </>
  );
};

export const VariantItemsTable = ({ items, variantId, offerId, onAddItem, onUpdateItem, onRemoveItem, onReorder, pendingProposalItems, onAcceptProposalItem, onRejectProposalItem }: VariantItemsTableProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modDialogItem, setModDialogItem] = useState<VariantItemWithDish | null>(null);
  const [managerOverrideItem, setManagerOverrideItem] = useState<VariantItemWithDish | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((item, idx) => ({ id: item.id, sort_order: idx })));
  };

  const excludeIds = items.map(i => i.dish_id);

  return (
    <>
      {items.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="w-10" />
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Cena</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead>Suma</TableHead>
                  <TableHead>Edytowalne?</TableHead>
                  <TableHead className="w-24">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onUpdateItem={onUpdateItem}
                    onRemoveItem={onRemoveItem}
                    onEditModifications={setModDialogItem}
                    onManagerOverride={setManagerOverrideItem}
                    proposalItems={pendingProposalItems?.get(item.id)}
                    onAcceptProposalItem={onAcceptProposalItem}
                    onRejectProposalItem={onRejectProposalItem}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Brak dań w wariancie</p>
          <p className="text-xs mt-1">Kliknij "Dodaj dania" aby rozpocząć</p>
        </div>
      )}

      <Button variant="outline" size="sm" className="mt-2" onClick={() => setPickerOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Dodaj dania
      </Button>

      <DishPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={excludeIds}
        onSelect={(dishId) => onAddItem(dishId)}
      />

      {modDialogItem && (
        <ModificationOverrideDialog
          open={!!modDialogItem}
          onClose={() => setModDialogItem(null)}
          baseModifications={modDialogItem.dishes.modifiable_items}
          currentOverride={modDialogItem.allowed_modifications}
          currentDishId={modDialogItem.dish_id}
          onSave={(override) => onUpdateItem(modDialogItem.id, { allowed_modifications: override })}
        />
      )}

      {managerOverrideItem && (
        <ManagerModificationDialog
          open={!!managerOverrideItem}
          onClose={() => setManagerOverrideItem(null)}
          item={managerOverrideItem}
          offerId={offerId}
        />
      )}
    </>
  );
};
