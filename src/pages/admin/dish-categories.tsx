import { useState, useMemo } from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { CategoryDialog } from '@/components/features/dishes/category-dialog';
import {
  useDishCategories,
  useCreateCategory,
  useUpdateCategory,
  useUpdateCategoryOrder,
  useToggleCategoryActive,
  type DishCategoryWithCount,
} from '@/hooks/use-dish-categories';
import type { Tables } from '@/integrations/supabase/types';

interface SortableRowProps {
  category: DishCategoryWithCount;
  onEdit: (cat: Tables<'dish_categories'>) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  isToggling: boolean;
}

const SortableRow = ({ category, onEdit, onToggleActive, isToggling }: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
          aria-label="Przeciągnij, aby zmienić kolejność"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="text-xl w-12">{category.icon ?? '—'}</TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{category.code}</TableCell>
      <TableCell className="text-center">{category.dish_count}</TableCell>
      <TableCell>
        <Switch
          checked={category.is_active ?? true}
          onCheckedChange={(checked) => onToggleActive(category.id, checked)}
          disabled={isToggling}
          aria-label={category.is_active ? 'Dezaktywuj' : 'Aktywuj'}
        />
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
          <Pencil className="h-4 w-4 mr-1" />
          Edytuj
        </Button>
      </TableCell>
    </TableRow>
  );
};

export const DishCategoriesPage = () => {
  const { data: categories, isLoading } = useDishCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const orderMutation = useUpdateCategoryOrder();
  const toggleMutation = useToggleCategoryActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Tables<'dish_categories'> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedIds = useMemo(() => (categories ?? []).map((c) => c.id), [categories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }));

    orderMutation.mutate(updates);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Tables<'dish_categories'>) => {
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const handleSubmit = (values: { name: string; code: string; icon?: string; description?: string; is_active: boolean }) => {
    if (editingCategory) {
      updateMutation.mutate(
        {
          id: editingCategory.id,
          name: values.name,
          code: values.code,
          icon: values.icon || null,
          description: values.description || null,
          is_active: values.is_active,
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      const maxOrder = Math.max(0, ...(categories ?? []).map((c) => c.sort_order ?? 0));
      createMutation.mutate(
        {
          name: values.name,
          code: values.code,
          icon: values.icon || null,
          description: values.description || null,
          is_active: values.is_active,
          sort_order: maxOrder + 1,
        },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleMutation.mutate({ id, is_active: isActive });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kategorie dań</h1>
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Dodaj kategorię
        </Button>
      </div>

      {!categories?.length ? (
        <EmptyState
          title="Brak kategorii"
          description="Dodaj pierwszą kategorię, aby rozpocząć organizowanie dań."
          actionLabel="Dodaj kategorię"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="rounded-md border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead className="w-12">Ikona</TableHead>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-center">Liczba dań</TableHead>
                    <TableHead>Aktywna</TableHead>
                    <TableHead>Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <SortableRow
                      key={cat.id}
                      category={cat}
                      onEdit={handleOpenEdit}
                      onToggleActive={handleToggleActive}
                      isToggling={toggleMutation.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};
