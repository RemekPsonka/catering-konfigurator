import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useDishCategories } from '@/hooks/use-dish-categories';
import { DIET_TAGS } from '@/lib/dish-constants';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DishFiltersProps {
  categoryId: string;
  onCategoryChange: (value: string) => void;
  showAll: boolean;
  onShowAllChange: (value: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  dietTags: string[];
  onDietTagsChange: (value: string[]) => void;
}

export const DishFilters = ({
  categoryId,
  onCategoryChange,
  showAll,
  onShowAllChange,
  search,
  onSearchChange,
  dietTags,
  onDietTagsChange,
}: DishFiltersProps) => {
  const { data: categories } = useDishCategories();

  const toggleDietTag = (tag: string) => {
    onDietTagsChange(
      dietTags.includes(tag)
        ? dietTags.filter((t) => t !== tag)
        : [...dietTags, tag]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {(categories ?? [])
              .filter((c) => c.is_active)
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Button
          variant={showAll ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onShowAllChange(!showAll)}
        >
          {showAll ? 'Wszystkie' : 'Tylko aktywne'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {DIET_TAGS.map((tag) => {
          const isSelected = dietTags.includes(tag.value);
          return (
            <Badge
              key={tag.value}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer select-none text-xs',
                isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              )}
              onClick={() => toggleDietTag(tag.value)}
            >
              {tag.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
