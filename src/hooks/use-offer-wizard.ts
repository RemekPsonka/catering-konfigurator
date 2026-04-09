import { useReducer, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { Tables, TablesInsert, Json } from '@/integrations/supabase/types';
import type { TemplateData } from '@/hooks/use-offer-templates';

export interface StepEventData {
  event_type: string;
  event_date: string | null;
  event_time_from: string;
  event_time_to: string;
  people_count: number;
  event_location: string;
  delivery_type: string;
  pricing_mode: string;
  client_id: string;
  client_name: string;
  inquiry_text: string;
  greeting_text: string;
}

export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  offerId: string | null;
  stepData: {
    eventData: StepEventData;
  };
}

const initialEventData: StepEventData = {
  event_type: '',
  event_date: null,
  event_time_from: '',
  event_time_to: '',
  people_count: 0,
  event_location: '',
  delivery_type: '',
  pricing_mode: 'PER_PERSON',
  client_id: '',
  client_name: '',
  inquiry_text: '',
  greeting_text: '',
};

const initialState: WizardState = {
  currentStep: 1,
  completedSteps: [],
  offerId: null,
  stepData: {
    eventData: { ...initialEventData },
  },
};

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_EVENT_DATA'; data: StepEventData }
  | { type: 'COMPLETE_STEP'; step: number }
  | { type: 'SET_OFFER_ID'; offerId: string }
  | { type: 'LOAD_OFFER'; offer: Tables<'offers'>; clientName: string };

const wizardReducer = (state: WizardState, action: WizardAction): WizardState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_EVENT_DATA':
      return { ...state, stepData: { ...state.stepData, eventData: action.data } };
    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.step)
          ? state.completedSteps
          : [...state.completedSteps, action.step],
      };
    case 'SET_OFFER_ID':
      return { ...state, offerId: action.offerId };
    case 'LOAD_OFFER':
      return {
        ...state,
        offerId: action.offer.id,
        completedSteps: [1],
        stepData: {
          ...state.stepData,
          eventData: {
            event_type: action.offer.event_type,
            event_date: action.offer.event_date,
            event_time_from: action.offer.event_time_from ?? '',
            event_time_to: action.offer.event_time_to ?? '',
            people_count: action.offer.people_count,
            event_location: action.offer.event_location ?? '',
            delivery_type: action.offer.delivery_type,
            pricing_mode: action.offer.pricing_mode,
            client_id: action.offer.client_id,
            client_name: action.clientName,
            inquiry_text: action.offer.inquiry_text ?? '',
            greeting_text: action.offer.greeting_text ?? '',
          },
        },
      };
    default:
      return state;
  }
};

export const useOfferWizard = (offerId?: string, templateData?: TemplateData, templateEventType?: string, templatePricingMode?: string) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const templateAppliedRef = useRef(false);

  const offerQuery = useQuery({
    queryKey: ['offer', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('*, clients!client_id(name)')
        .eq('id', offerId)
        .single();
      if (error) throw error;
      return data as Tables<'offers'> & { clients: { name: string } | null };
    },
    enabled: !!offerId,
  });

  useEffect(() => {
    if (offerQuery.data) {
      dispatch({
        type: 'LOAD_OFFER',
        offer: offerQuery.data,
        clientName: offerQuery.data.clients?.name ?? '',
      });
    }
  }, [offerQuery.data]);

  const saveDraftMutation = useMutation({
    mutationFn: async (eventData: StepEventData) => {
      if (!user) throw new Error('Nie jesteś zalogowany');

      const payload: TablesInsert<'offers'> = {
        event_type: eventData.event_type as TablesInsert<'offers'>['event_type'],
        delivery_type: eventData.delivery_type as TablesInsert<'offers'>['delivery_type'],
        people_count: eventData.people_count,
        client_id: eventData.client_id,
        created_by: user.id,
        pricing_mode: eventData.pricing_mode as TablesInsert<'offers'>['pricing_mode'],
        event_date: eventData.event_date || null,
        event_time_from: eventData.event_time_from || null,
        event_time_to: eventData.event_time_to || null,
        event_location: eventData.event_location || null,
        inquiry_text: eventData.inquiry_text || null,
        greeting_text: eventData.greeting_text || null,
        status: 'draft',
      };

      if (state.offerId) {
        const { data, error } = await supabase
          .from('offers')
          .update(payload)
          .eq('id', state.offerId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('offers')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Szkic zapisany');
    },
    onError: () => {
      toast.error('Nie udało się zapisać szkicu');
    },
  });

  return {
    state,
    dispatch,
    offerQuery,
    saveDraftMutation,
  };
};
