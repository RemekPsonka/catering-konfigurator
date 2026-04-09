import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import type { ClientRequirement } from './requirements-sidebar';

interface RequirementHintsProps {
  requirements: ClientRequirement[];
  category: string;
  currentPricePerPerson?: number;
}

export const RequirementHints = ({ requirements, category, currentPricePerPerson }: RequirementHintsProps) => {
  const relevant = requirements.filter((r) => r.category === category && r.is_met !== true);

  if (relevant.length === 0) return null;

  // Budget special case
  if (category === 'budget' && currentPricePerPerson !== undefined) {
    const budgetReq = relevant.find((r) => r.text);
    if (!budgetReq) return null;

    // Try to extract number from text like "do 120 zł/os"
    const match = budgetReq.text.match(/(\d+(?:[.,]\d+)?)/);
    const budgetValue = match ? parseFloat(match[1].replace(',', '.')) : null;

    const isOver = budgetValue !== null && currentPricePerPerson > budgetValue;

    return (
      <Alert className={`mb-4 ${isOver ? 'border-destructive/50 bg-destructive/5' : 'border-green-500/50 bg-green-50'}`}>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription className="text-sm">
          💡 Budżet klienta: {budgetReq.text}.{' '}
          {budgetValue !== null && (
            <span className={isOver ? 'text-destructive font-medium' : 'text-green-700 font-medium'}>
              Aktualnie: {currentPricePerPerson.toFixed(2)} zł/os
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2 mb-4">
      {relevant.map((req, i) => (
        <Alert key={i} className="border-primary/20 bg-primary/5">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="text-sm">
            💡 Klient oczekuje: {req.text}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
