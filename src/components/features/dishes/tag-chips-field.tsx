import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagOption {
  value: string;
  label: string;
}

interface TagChipsFieldProps {
  label: string;
  options: TagOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export const TagChipsField = ({ label, options, value, onChange }: TagChipsFieldProps) => {
  const toggle = (tag: string) => {
    onChange(
      value.includes(tag)
        ? value.filter((v) => v !== tag)
        : [...value, tag]
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          return (
            <Badge
              key={option.value}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer select-none transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                  : 'hover:bg-accent'
              )}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
