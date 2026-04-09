import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { toast } from 'sonner';
import { WizardStepper } from './wizard-stepper';
import { StepEventData } from './steps/step-event-data';
import { StepMenu } from './steps/step-menu';
import { StepServices } from './steps/step-services';
import { StepSettings } from './steps/step-settings';
import { StepCalculation } from './steps/step-calculation';
import { StepTheme } from './steps/step-theme';
import { StepPreview } from './steps/step-preview';
import { useOfferWizard } from '@/hooks/use-offer-wizard';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { RequirementsSidebar, type ClientRequirement } from './requirements-sidebar';
import type { TemplateData } from '@/hooks/use-offer-templates';

interface OfferWizardProps {
  offerId?: string;
  templateData?: TemplateData;
  templateEventType?: string;
  templatePricingMode?: string;
}

const STEP_TITLES = ['', 'Menu — konfiguracja dań', 'Usługi dodatkowe', 'Ustawienia oferty', 'Kalkulacja i rabaty', 'Motyw graficzny', 'Podgląd oferty'];

export const OfferWizard = ({ offerId, templateData, templateEventType, templatePricingMode }: OfferWizardProps) => {
  const navigate = useNavigate();
  const { state, dispatch, offerQuery, saveDraftMutation } = useOfferWizard(offerId, templateData, templateEventType, templatePricingMode);

  if (offerId && offerQuery.isLoading) {
    return <LoadingSpinner />;
  }

  if (offerId && offerQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive font-medium">Nie udało się załadować oferty.</p>
        <Button variant="outline" onClick={() => navigate('/admin/offers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do listy ofert
        </Button>
      </div>
    );
  }

  const goToStep = (step: number) => {
    // For step 2+, ensure offer is saved first
    if (step >= 2 && !state.offerId) {
      saveDraftMutation.mutate({ eventData: state.stepData.eventData }, {
        onSuccess: ({ data }) => {
          dispatch({ type: 'SET_OFFER_ID', offerId: data.id, offerNumber: data.offer_number });
          if (!offerId) {
            navigate(`/admin/offers/${data.id}/edit`, { replace: true });
          }
          dispatch({ type: 'SET_STEP', step });
        },
      });
      return;
    }
    // Auto-save when navigating between steps 2+ if offer exists
    if (state.offerId && state.stepData.eventData.event_type) {
      saveDraftMutation.mutate({ eventData: state.stepData.eventData, silent: true });
    }
    // Mark current step as completed when moving forward
    dispatch({ type: 'COMPLETE_STEP', step: state.currentStep });
    dispatch({ type: 'SET_STEP', step });
  };

  const handleStep1Submit = (data: typeof state.stepData.eventData) => {
    dispatch({ type: 'SET_EVENT_DATA', data });
    dispatch({ type: 'COMPLETE_STEP', step: 1 });

    // Show toast about missing fields for draft awareness
    const missing: string[] = [];
    if (!data.client_id) missing.push('Klient');
    if (!data.people_count || data.people_count < 1) missing.push('Liczba osób');
    if (!data.delivery_type) missing.push('Forma dostawy');
    if (missing.length > 0) {
      toast.info(`Brakujące pola: ${missing.join(', ')} — możesz uzupełnić później`);
    }

    goToStep(2);
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate({ eventData: state.stepData.eventData }, {
      onSuccess: ({ data }) => {
        if (!state.offerId) {
          dispatch({ type: 'SET_OFFER_ID', offerId: data.id, offerNumber: data.offer_number });
          navigate(`/admin/offers/${data.id}/edit`, { replace: true });
        }
      },
    });
  };

  const requirements = Array.isArray(state.stepData.eventData.client_requirements)
    ? (state.stepData.eventData.client_requirements as ClientRequirement[])
    : [];

  const handleRequirementsUpdate = (reqs: ClientRequirement[]) => {
    dispatch({ type: 'SET_REQUIREMENTS', requirements: reqs });
  };

  const showSidebar = state.currentStep >= 2 && requirements.length > 0;

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <StepEventData data={state.stepData.eventData} onSubmit={handleStep1Submit} />;
      case 2:
        return (
          <StepMenu
            offerId={state.offerId}
            pricingMode={state.stepData.eventData.pricing_mode}
            peopleCount={state.stepData.eventData.people_count}
            requirements={requirements}
          />
        );
      case 3:
        return <StepServices offerId={state.offerId} requirements={requirements} />;
      case 4:
        return (
          <StepSettings
            offerId={state.offerId}
            pricingMode={state.stepData.eventData.pricing_mode}
          />
        );
      case 5:
        return (
          <StepCalculation
            offerId={state.offerId}
            pricingMode={state.stepData.eventData.pricing_mode}
            peopleCount={state.stepData.eventData.people_count}
            inquiryText={state.stepData.eventData.inquiry_text}
            eventType={state.stepData.eventData.event_type}
            eventDate={state.stepData.eventData.event_date}
            clientName={state.stepData.eventData.client_name}
            requirements={requirements}
          />
        );
      case 6:
        return <StepTheme offerId={state.offerId} eventType={state.stepData.eventData.event_type} />;
      case 7:
        return (
          <StepPreview
            offerId={state.offerId}
            pricingMode={state.stepData.eventData.pricing_mode}
            peopleCount={state.stepData.eventData.people_count}
            requirements={requirements}
            inquiryText={state.stepData.eventData.inquiry_text}
            onGoToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  // Compute warning steps (missing required data for non-draft status)
  const warningSteps: number[] = [];
  const ed = state.stepData.eventData;
  if (!ed.client_id || !ed.people_count || ed.people_count < 1 || !ed.delivery_type) {
    warningSteps.push(1);
  }

  const offerTitle = state.offerNumber
    ? `Oferta ${state.offerNumber} (szkic)`
    : offerId ? 'Edycja oferty' : 'Nowa oferta';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{offerTitle}</h1>
        <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saveDraftMutation.isPending || !ed.event_type}>
          <Save className="mr-2 h-4 w-4" />
          Zapisz szkic
        </Button>
      </div>

      <WizardStepper
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
        onStepClick={goToStep}
        warningSteps={warningSteps}
      />

      <div className={showSidebar ? 'flex gap-6 items-start' : ''}>
        <div className={showSidebar ? 'flex-1 min-w-0' : ''}>
          {renderStep()}
        </div>
        {showSidebar && (
          <RequirementsSidebar
            requirements={requirements}
            onUpdate={handleRequirementsUpdate}
          />
        )}
      </div>

      {/* Navigation — hidden on step 7 (has its own actions) */}
      {state.currentStep < 7 && (
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => state.currentStep === 1 ? navigate('/admin/offers') : goToStep(state.currentStep - 1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {state.currentStep === 1 ? 'Lista ofert' : 'Wstecz'}
          </Button>

          {state.currentStep === 1 ? (
            <Button type="submit" form="step-event-data">
              Dalej
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => goToStep(state.currentStep + 1)}>
              Dalej
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
