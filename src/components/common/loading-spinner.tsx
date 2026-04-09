import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ text = 'Ładowanie...', className = '' }: LoadingSpinnerProps) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-12 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
};
