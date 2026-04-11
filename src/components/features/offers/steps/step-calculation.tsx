import { Card, CardContent } from '@/components/ui/card';
import { RequirementHints } from '../requirement-hints';
import type { ClientRequirement } from '../requirements-sidebar';
import { useCalculationState } from '@/hooks/use-calculation-state';
import { VariantsPanel } from './calculation/VariantsPanel';
import { ServicesPanel } from './calculation/ServicesPanel';
import { DiscountPanel } from './calculation/DiscountPanel';
import { DeliveryPanel } from './calculation/DeliveryPanel';
import { SummaryCard } from './calculation/SummaryCard';
import { TextFieldsPanel } from './calculation/TextFieldsPanel';

interface StepCalculationProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
  inquiryText?: string;
  eventType?: string;
  eventDate?: string | null;
  clientName?: string;
  requirements?: ClientRequirement[];
}

export const StepCalculation = ({
  offerId,
  pricingMode,
  peopleCount,
  inquiryText,
  eventType,
  eventDate,
  clientName,
  requirements = [],
}: StepCalculationProps) => {
  const calc = useCalculationState({
    offerId,
    pricingMode,
    peopleCount,
    inquiryText,
    eventType,
    eventDate,
    clientName,
  });

  if (!offerId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Zapisz ofertę w kroku 1, aby zobaczyć kalkulację.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {requirements.length > 0 && (
        <RequirementHints
          requirements={requirements}
          category="budget"
          currentPricePerPerson={calc.totals.pricePerPerson}
        />
      )}

      <VariantsPanel
        variants={calc.variants}
        totals={calc.totals}
        pricingMode={pricingMode}
        peopleCount={peopleCount}
      />

      <ServicesPanel
        offerServices={calc.offerServices}
        servicesTotal={calc.totals.servicesTotalCalc}
      />

      <DiscountPanel
        discountType={calc.discountType}
        discountPercent={calc.discountPercent}
        discountValue={calc.discountValue}
        discountAmount={calc.totals.discountAmount}
        dishesAfterDiscount={calc.totals.dishesAfterDiscount}
        maxDishesTotal={calc.totals.maxDishesTotal}
        onTypeChange={calc.handleDiscountTypeChange}
        onValueChange={calc.handleDiscountChange}
      />

      <DeliveryPanel
        deliveryCost={calc.deliveryCost}
        onDeliveryCostChange={calc.setDeliveryCost}
      />

      <SummaryCard
        totals={calc.totals}
        deliveryCost={calc.deliveryCost}
        peopleCount={peopleCount}
      />

      <TextFieldsPanel
        greetingText={calc.greetingText}
        aiSummary={calc.aiSummary}
        notesClient={calc.notesClient}
        notesInternal={calc.notesInternal}
        isGenerating={calc.isGenerating}
        isGeneratingSummary={calc.isGeneratingSummary}
        inquiryText={inquiryText}
        onGreetingChange={calc.setGreetingText}
        onAiSummaryChange={calc.setAiSummary}
        onNotesClientChange={calc.setNotesClient}
        onNotesInternalChange={calc.setNotesInternal}
        onGenerateGreeting={calc.handleGenerateGreeting}
        onGenerateSummary={calc.handleGenerateSummary}
      />
    </div>
  );
};
