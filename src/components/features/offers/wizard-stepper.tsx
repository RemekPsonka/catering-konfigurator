import { Check, ClipboardList, UtensilsCrossed, Calculator, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS } from '@/lib/offer-constants';

const iconMap = {
  ClipboardList,
  UtensilsCrossed,
  Calculator,
  Eye,
} as const;

interface WizardStepperProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  warningSteps?: number[];
}

export const WizardStepper = ({ currentStep, completedSteps, onStepClick, warningSteps = [] }: WizardStepperProps) => {
  return (
    <nav className="flex items-center justify-between w-full" aria-label="Kroki kreatora">
      {WIZARD_STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.number);
        const isActive = currentStep === step.number;
        const isClickable = isCompleted || isActive;
        const hasWarning = warningSteps.includes(step.number);
        const Icon = iconMap[step.icon];

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.number)}
              className={cn(
                'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive && 'bg-primary text-primary-foreground',
                isCompleted && !isActive && 'bg-primary/10 text-primary hover:bg-primary/20',
                !isActive && !isCompleted && 'text-muted-foreground cursor-not-allowed',
              )}
            >
              <span
                className={cn(
                  'relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0',
                  isActive && 'bg-primary-foreground/20',
                  isCompleted && !isActive && 'bg-primary/20',
                  !isActive && !isCompleted && 'bg-muted',
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {hasWarning && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border border-background" />
                )}
              </span>
              <span className="hidden md:inline">{step.label}</span>
            </button>
            {idx < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mx-2',
                  isCompleted ? 'bg-primary/40' : 'bg-border',
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
};
