import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { WizardStepper } from './wizard-stepper';
import { StepEventData } from './steps/step-event-data';
import { StepMenu } from './steps/step-menu';
import { StepServices } from './steps/step-services';
import { StepSettings } from './steps/step-settings';
import { StepPlaceholder } from './steps/step-placeholder';
import { useOfferWizard } from '@/hooks/use-offer-wizard';
import { LoadingSpinner } from '@/components/common/loading-spinner';

interface OfferWizardProps {
  offerId?: string;
}

const STEP_TITLES = ['', 'Menu — konfiguracja dań', 'Usługi dodatkowe', 'Ustawienia oferty', 'Kalkulacja i rabaty', 'Motyw graficzny', 'Podgląd oferty'];

export const OfferWizard = ({ offerId }: OfferWizardProps) => {
  const navigate = useNavigate();
  const { state, dispatch, offerQuery, saveDraftMutation } = useOfferWizard(offerId);

  if (offerId && offerQuery.isLoading) {
    return <LoadingSpinner />;
  }

  const goToStep = (step: number) => {
    // For step 2+, ensure offer is saved first
    if (step >= 2 && !state.offerId) {
      saveDraftMutation.mutate(state.stepData.eventData, {
        onSuccess: (offer) => {
          dispatch({ type: 'SET_OFFER_ID', offerId: offer.id });
          if (!offerId) {
            navigate(`/admin/offers/${offer.id}/edit`, { replace: true });
          }
          dispatch({ type: 'SET_STEP', step });
        },
      });
      return;
    }
    dispatch({ type: 'SET_STEP', step });
  };

  const handleStep1Submit = (data: typeof state.stepData.eventData) => {
    dispatch({ type: 'SET_EVENT_DATA', data });
    dispatch({ type: 'COMPLETE_STEP', step: 1 });
    goToStep(2);
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(state.stepData.eventData, {
      onSuccess: (offer) => {
        if (!state.offerId) {
          dispatch({ type: 'SET_OFFER_ID', offerId: offer.id });
          navigate(`/admin/offers/${offer.id}/edit`, { replace: true });
        }
      },
    });
  };

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
          />
        );
      default:
        return <StepPlaceholder title={STEP_TITLES[state.currentStep - 1]} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{offerId ? 'Edycja oferty' : 'Nowa oferta'}</h1>
        <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saveDraftMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Zapisz szkic
        </Button>
      </div>

      <WizardStepper
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
        onStepClick={goToStep}
      />

      {renderStep()}

      {/* Navigation */}
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
        ) : state.currentStep < 7 ? (
          <Button onClick={() => goToStep(state.currentStep + 1)}>
            Dalej
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSaveDraft} disabled={saveDraftMutation.isPending}>
            Zapisz ofertę
          </Button>
        )}
      </div>
    </div>
  );
};
