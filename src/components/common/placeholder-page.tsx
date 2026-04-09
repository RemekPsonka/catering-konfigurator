import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Construction className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-semibold text-foreground">{title} — w budowie</h1>
      <p className="text-sm text-muted-foreground">Ta strona jest w trakcie tworzenia.</p>
    </div>
  );
};
