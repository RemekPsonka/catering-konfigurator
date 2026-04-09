import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { DishFilters } from '@/components/features/dishes/dish-filters';
import { useDishes } from '@/hooks/use-dishes';
import { useDebounce } from '@/hooks/use-debounce';
import { UNIT_TYPE_LABELS, ITEMS_PER_PAGE } from '@/lib/dish-constants';
import { Plus, Pencil, RefreshCw } from 'lucide-react';

const getDishPrice = (dish: { unit_type: string; price_per_person: number | null; price_per_piece: number | null; price_per_kg: number | null; price_per_set: number | null }) => {
  switch (dish.unit_type) {
    case 'PERSON': return dish.price_per_person;
    case 'PIECE': return dish.price_per_piece;
    case 'KG': return dish.price_per_kg;
    case 'SET': return dish.price_per_set;
    default: return null;
  }
};

export const DishesListPage = () => {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [dietTags, setDietTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useDishes({
    categoryId: categoryId === 'all' ? undefined : categoryId,
    isActive: showAll ? undefined : true,
    search: debouncedSearch || undefined,
    dietTags: dietTags.length > 0 ? dietTags : undefined,
    page,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Baza potraw</h1>
        <Button asChild>
          <Link to="/admin/dishes/new">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj danie
          </Link>
        </Button>
      </div>

      <DishFilters
        categoryId={categoryId}
        onCategoryChange={(v) => { setCategoryId(v); setPage(1); }}
        showAll={showAll}
        onShowAllChange={(v) => { setShowAll(v); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        dietTags={dietTags}
        onDietTagsChange={(v) => { setDietTags(v); setPage(1); }}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.dishes.length ? (
        <EmptyState
          title="Brak dań"
          description="Nie znaleziono dań spełniających kryteria. Dodaj nowe danie, aby rozpocząć."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Foto</TableHead>
                <TableHead>Nazwa</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Typ wyceny</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead className="w-12 text-center">🔄</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.dishes.map((dish) => {
                const price = getDishPrice(dish);
                return (
                  <TableRow
                    key={dish.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/dishes/${dish.id}/edit`)}
                  >
                    <TableCell>
                      {dish.photo_url ? (
                        <img
                          src={dish.photo_url}
                          alt={dish.display_name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{dish.display_name}</TableCell>
                    <TableCell>
                      {dish.category_icon} {dish.category_name}
                    </TableCell>
                    <TableCell>{UNIT_TYPE_LABELS[dish.unit_type]}</TableCell>
                    <TableCell className="text-right">
                      {price != null ? `${Number(price).toFixed(2)} zł` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {dish.is_modifiable && <RefreshCw className="mx-auto h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell>
                      <Badge variant={dish.is_active ? 'default' : 'secondary'}>
                        {dish.is_active ? 'Aktywne' : 'Nieaktywne'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/dishes/${dish.id}/edit`);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};
