import { useLocation } from 'react-router-dom';
import { OfferWizard } from '@/components/features/offers/offer-wizard';
import type { TemplateData } from '@/hooks/use-offer-templates';

interface LocationState {
  templateData?: TemplateData;
  eventType?: string;
  pricingMode?: string;
}

export const OfferNewPage = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;

  return (
    <OfferWizard
      templateData={state?.templateData}
      templateEventType={state?.eventType}
      templatePricingMode={state?.pricingMode}
    />
  );
};
