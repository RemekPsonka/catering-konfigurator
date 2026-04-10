import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GripVertical, ImageIcon, Plus, Trash2, Settings2 } from 'lucide-react';
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
import type { Json } from '@/integrations/supabase/types';

interface VariantItemsTableProps {
  items: VariantItemWithDish[];
  variantId: string;
  offerId: string;
  onAddItem: (dishId: string) => void;
  onUpdateItem: (id: string, data: Record<string, unknown>) => void;
  onRemoveItem: (id: string) => void;
  onReorder: (items: Array<{ id: string; sort_order: number }>) => void;
}

interface SortableRowProps {
  item: VariantItemWithDish;
  onUpdateItem: (id: string, data: Record<string, unknown>) => void;
  onRemoveItem: (id: string) => void;
  onEditModifications: (item: VariantItemWithDish) => void;
}

const SortableRow = ({ item, onUpdateItem, onRemoveItem, onEditModifications }: SortableRowProps) => {
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
    <TableRow ref={setNodeRef} style={style}>
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
          {modType && item.is_client_editable && (
            <Badge variant="outline" className="text-xs">
              🔄 {modType === 'swap' ? 'SWAP' : modType === 'variant' ? 'VARIANT' : 'SPLIT'}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{UNIT_TYPE_LABELS[item.dishes.unit_type] ?? ''}</span>
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
          {item.is_client_editable && item.dishes.is_modifiable && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditModifications(item)}>
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveItem(item.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const VariantItemsTable = ({ items, variantId, offerId, onAddItem, onUpdateItem, onRemoveItem, onReorder }: VariantItemsTableProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modDialogItem, setModDialogItem] = useState<VariantItemWithDish | null>(null);

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
                  <TableHead className="w-20">Akcje</TableHead>
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
    </>
  );
};
