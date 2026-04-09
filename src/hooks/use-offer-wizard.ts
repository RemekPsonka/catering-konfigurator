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
  ai_parsed_data?: unknown;
  client_requirements?: unknown;
}

export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  offerId: string | null;
  offerNumber: string | null;
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
  offerNumber: null,
  stepData: {
    eventData: { ...initialEventData },
  },
};

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_EVENT_DATA'; data: StepEventData }
  | { type: 'COMPLETE_STEP'; step: number }
  | { type: 'SET_OFFER_ID'; offerId: string; offerNumber?: string | null }
  | { type: 'LOAD_OFFER'; offer: Tables<'offers'>; clientName: string }
  | { type: 'SET_REQUIREMENTS'; requirements: unknown };

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
      return { ...state, offerId: action.offerId, offerNumber: action.offerNumber ?? state.offerNumber };
    case 'LOAD_OFFER':
      return {
        ...state,
        offerId: action.offer.id,
        offerNumber: action.offer.offer_number ?? state.offerNumber,
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
            client_requirements: action.offer.client_requirements ?? undefined,
          },
        },
      };
    case 'SET_REQUIREMENTS':
      return {
        ...state,
        stepData: {
          ...state.stepData,
          eventData: {
            ...state.stepData.eventData,
            client_requirements: action.requirements,
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

  // Apply template data to pre-fill event data
  useEffect(() => {
    if (templateData && !templateAppliedRef.current && !offerId) {
      templateAppliedRef.current = true;
      const settings = templateData.settings;
      dispatch({
        type: 'SET_EVENT_DATA',
        data: {
          ...initialEventData,
          event_type: templateEventType ?? '',
          pricing_mode: templatePricingMode ?? 'PER_PERSON',
          greeting_text: settings.greeting_text ?? '',
        },
      });
    }
  }, [templateData, templateEventType, templatePricingMode, offerId]);

  // After saving draft with template, apply template variants/services/settings
  const applyTemplateToOffer = async (newOfferId: string) => {
    if (!templateData) return;

    const td = templateData;

    // Apply settings
    await supabase.from('offers').update({
      price_display_mode: td.settings.price_display_mode as TablesInsert<'offers'>['price_display_mode'],
      is_people_count_editable: td.settings.is_people_count_editable,
      min_offer_price: td.settings.min_offer_price,
      theme_id: td.settings.theme_id,
      notes_client: td.settings.notes_client,
      discount_percent: td.settings.discount_percent,
      discount_value: td.settings.discount_value,
      delivery_cost: td.settings.delivery_cost,
    }).eq('id', newOfferId);

    // Create variants + items
    for (const v of td.variants) {
      const { data: newVar, error: nvErr } = await supabase
        .from('offer_variants')
        .insert({
          offer_id: newOfferId,
          name: v.name,
          description: v.description,
          is_recommended: v.is_recommended,
          sort_order: v.sort_order,
        })
        .select()
        .single();
      if (nvErr || !newVar) continue;

      if (v.items.length > 0) {
        await supabase.from('variant_items').insert(
          v.items.map((item) => ({
            variant_id: newVar.id,
            dish_id: item.dish_id,
            quantity: item.quantity,
            custom_price: item.custom_price,
            custom_name: item.custom_name,
            sort_order: item.sort_order,
            is_client_editable: item.is_client_editable,
            allowed_modifications: item.allowed_modifications as Json,
            selected_variant_option: item.selected_variant_option,
          }))
        );
      }
    }

    // Create services
    if (td.services.length > 0) {
      await supabase.from('offer_services').insert(
        td.services.map((s) => ({
          offer_id: newOfferId,
          service_id: s.service_id,
          quantity: s.quantity,
          custom_price: s.custom_price,
          notes: s.notes,
        }))
      );
    }

    // Invalidate queries so steps 2-7 see the data
    queryClient.invalidateQueries({ queryKey: ['offer-variants'] });
    queryClient.invalidateQueries({ queryKey: ['offer-services'] });
    queryClient.invalidateQueries({ queryKey: ['offer'] });
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (eventData: StepEventData) => {
      if (!user) throw new Error('Nie jesteś zalogowany');

      const payload: TablesInsert<'offers'> = {
        event_type: eventData.event_type as TablesInsert<'offers'>['event_type'],
        delivery_type: (eventData.delivery_type || null) as TablesInsert<'offers'>['delivery_type'],
        people_count: eventData.people_count > 0 ? eventData.people_count : null,
        client_id: eventData.client_id || null,
        created_by: user.id,
        pricing_mode: (eventData.pricing_mode || 'PER_PERSON') as TablesInsert<'offers'>['pricing_mode'],
        event_date: eventData.event_date || null,
        event_time_from: eventData.event_time_from || null,
        event_time_to: eventData.event_time_to || null,
        event_location: eventData.event_location || null,
        inquiry_text: eventData.inquiry_text || null,
        greeting_text: eventData.greeting_text || null,
        ai_parsed_data: (eventData.ai_parsed_data as Json) ?? null,
        client_requirements: (eventData.client_requirements as Json) ?? null,
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

        // If created from template, apply template data
        if (templateData) {
          await applyTemplateToOffer(data.id);
        }

        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      const num = data.offer_number ? ` Numer oferty: ${data.offer_number}` : '';
      toast.success(`Szkic zapisany!${num}`);
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
