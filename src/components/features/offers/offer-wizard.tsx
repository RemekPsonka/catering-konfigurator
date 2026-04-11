import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Lock, Unlock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WizardStepper } from './wizard-stepper';
import { StepEventData } from './steps/step-event-data';
import { StepMenu } from './steps/step-menu';
import { StepPricing } from './steps/step-pricing';
import { StepPreviewSend } from './steps/step-preview-send';
import { InternalNotesDrawer } from './internal-notes-drawer';
import { useOfferWizard } from '@/hooks/use-offer-wizard';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { getOfferVersionLabel } from '@/lib/offer-version';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { RequirementsSidebar, type ClientRequirement } from './requirements-sidebar';
import type { TemplateData } from '@/hooks/use-offer-templates';

interface OfferWizardProps {
  offerId?: string;
  templateData?: TemplateData;
  templateEventType?: string;
  templatePricingMode?: string;
}

export const OfferWizard = ({ offerId, templateData, templateEventType, templatePricingMode }: OfferWizardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state, dispatch, offerQuery, saveDraftMutation } = useOfferWizard(offerId, templateData, templateEventType, templatePricingMode);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);

  if (offerId && offerQuery.isLoading) return <LoadingSpinner />;

  if (offerId && offerQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive font-medium">Nie udało się załadować oferty.</p>
        <Button variant="outline" onClick={() => navigate('/admin/offers')}><ArrowLeft className="mr-2 h-4 w-4" />Wróć do listy ofert</Button>
      </div>
    );
  }

  const offerStatus = offerQuery.data?.status as string | undefined;
  const isLocked = !!offerStatus && ['accepted', 'won'].includes(offerStatus);

  const handleUnlock = async () => {
    if (!offerId) return;
    const { error } = await supabase.from('offers').update({ status: 'revision' as const }).eq('id', offerId);
    if (error) { toast.error('Nie udało się odblokować oferty'); return; }
    toast.success('Oferta odblokowana do edycji');
    queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
    queryClient.invalidateQueries({ queryKey: ['offer-preview', offerId] });
    queryClient.invalidateQueries({ queryKey: ['offers'] });
    setUnlockDialogOpen(false);
  };

  const goToStep = (step: number) => {
    if (isLocked) return;
    if (step >= 2 && !state.offerId) {
      saveDraftMutation.mutate({ eventData: state.stepData.eventData }, {
        onSuccess: ({ data }) => {
          dispatch({ type: 'SET_OFFER_ID', offerId: data.id, offerNumber: data.offer_number });
          if (!offerId) navigate(`/admin/offers/${data.id}/edit`, { replace: true });
          dispatch({ type: 'SET_STEP', step });
        },
      });
      return;
    }
    if (state.offerId && state.stepData.eventData.event_type) {
      saveDraftMutation.mutate({ eventData: state.stepData.eventData, silent: true });
    }
    dispatch({ type: 'COMPLETE_STEP', step: state.currentStep });
    dispatch({ type: 'SET_STEP', step });
  };

  const handleStep1Submit = (data: typeof state.stepData.eventData) => {
    dispatch({ type: 'SET_EVENT_DATA', data });
    dispatch({ type: 'COMPLETE_STEP', step: 1 });
    const missing: string[] = [];
    if (!data.client_id) missing.push('Klient');
    if (!data.people_count || data.people_count < 1) missing.push('Liczba osób');
    if (!data.delivery_type) missing.push('Forma dostawy');
    if (missing.length > 0) toast.info(`Brakujące pola: ${missing.join(', ')} — możesz uzupełnić później`);
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

  const currentStep = isLocked ? 4 : state.currentStep;
  const showSidebar = currentStep >= 2 && currentStep < 4 && requirements.length > 0 && !isLocked;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepEventData data={state.stepData.eventData} onSubmit={handleStep1Submit} />;
      case 2: return <StepMenu offerId={state.offerId} pricingMode={state.stepData.eventData.pricing_mode} peopleCount={state.stepData.eventData.people_count} requirements={requirements} acceptedVariantId={offerQuery.data?.accepted_variant_id} />;
      case 3: return <StepPricing offerId={state.offerId} pricingMode={state.stepData.eventData.pricing_mode || 'PER_PERSON'} peopleCount={state.stepData.eventData.people_count || 0} requirements={requirements} inquiryText={state.stepData.eventData.inquiry_text} />;
      case 4: return <StepPreviewSend offerId={state.offerId} pricingMode={state.stepData.eventData.pricing_mode || 'PER_PERSON'} peopleCount={state.stepData.eventData.people_count || 0} requirements={requirements} inquiryText={state.stepData.eventData.inquiry_text} onGoToStep={isLocked ? undefined : goToStep} isLocked={isLocked} />;
      default: return null;
    }
  };

  const warningSteps: number[] = [];
  const ed = state.stepData.eventData;
  if (!ed.client_id || !ed.people_count || ed.people_count < 1 || !ed.delivery_type) warningSteps.push(1);

  const STATUS_LABELS: Record<string, string> = { draft: 'szkic', ready: 'gotowa', sent: 'wysłana', viewed: 'wyświetlona', revision: 'rewizja', accepted: 'zaakceptowana', won: 'wygrana', lost: 'przegrana' };

  const currentVer = offerQuery.data?.current_version ?? 0;
  const offerTitle = isLocked
    ? `Oferta ${getOfferVersionLabel(state.offerNumber, currentVer)} (${STATUS_LABELS[offerStatus ?? ''] ?? offerStatus})`
    : state.offerNumber
      ? `Oferta ${getOfferVersionLabel(state.offerNumber, currentVer)} (${STATUS_LABELS[offerStatus ?? ''] ?? 'szkic'})`
      : offerId ? 'Edycja oferty' : 'Nowa oferta';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{offerTitle}</h1>
        <div className="flex items-center gap-2">
          <InternalNotesDrawer offerId={state.offerId} />
          {!isLocked && (
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saveDraftMutation.isPending || !ed.event_type}>
              <Save className="mr-2 h-4 w-4" />Zapisz szkic
            </Button>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Oferta {offerStatus === 'accepted' ? 'zaakceptowana' : 'wygrana'} — edycja zablokowana</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setUnlockDialogOpen(true)}><Unlock className="h-4 w-4 mr-2" />Odblokuj do edycji</Button>
        </div>
      )}

      {!isLocked && (
        <WizardStepper currentStep={state.currentStep} completedSteps={state.completedSteps} onStepClick={goToStep} warningSteps={warningSteps} />
      )}

      <div className={showSidebar ? 'flex gap-6 items-start' : ''}>
        <div className={showSidebar ? 'flex-1 min-w-0' : ''}>{renderStep()}</div>
        {showSidebar && <RequirementsSidebar requirements={requirements} onUpdate={handleRequirementsUpdate} />}
      </div>

      {!isLocked && currentStep < 4 && (
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => currentStep === 1 ? navigate('/admin/offers') : goToStep(currentStep - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />{currentStep === 1 ? 'Lista ofert' : 'Wstecz'}
          </Button>
          {currentStep === 1 ? (
            <Button type="submit" form="step-event-data">Dalej<ArrowRight className="ml-2 h-4 w-4" /></Button>
          ) : (
            <Button onClick={() => goToStep(currentStep + 1)}>Dalej<ArrowRight className="ml-2 h-4 w-4" /></Button>
          )}
        </div>
      )}

      <ConfirmDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen} title="Odblokować ofertę?" description={'Status zostanie zmieniony na „Rewizja" i oferta będzie ponownie edytowalna.'} confirmLabel="Odblokuj" cancelLabel="Anuluj" onConfirm={handleUnlock} variant="default" />
    </div>
  );
};
