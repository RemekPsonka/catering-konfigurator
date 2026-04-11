import { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOfferVariants, getItemPrice } from '@/hooks/use-offer-variants';
import { useOfferServices } from '@/hooks/use-offer-services';
import { calculateOfferTotals } from '@/lib/calculations';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import type { OfferTotals } from '@/lib/calculations';

export type DiscountType = 'percent' | 'value';

interface UseCalculationStateProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
  inquiryText?: string;
  eventType?: string;
  eventDate?: string | null;
  clientName?: string;
}

export const useCalculationState = ({
  offerId,
  pricingMode,
  peopleCount,
  inquiryText,
  eventType,
  eventDate,
  clientName,
}: UseCalculationStateProps) => {
  const queryClient = useQueryClient();
  const { data: variants = [] } = useOfferVariants(offerId);
  const { data: offerServices = [] } = useOfferServices(offerId);

  const offerQuery = useQuery({
    queryKey: ['offer-calc', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('discount_percent, discount_value, delivery_cost, greeting_text, ai_summary, notes_client, notes_internal')
        .eq('id', offerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [greetingText, setGreetingText] = useState('');
  const [notesClient, setNotesClient] = useState('');
  const [notesInternal, setNotesInternal] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (offerQuery.data && !loaded) {
      const d = offerQuery.data;
      const pct = Number(d.discount_percent ?? 0);
      const val = Number(d.discount_value ?? 0);
      setDiscountPercent(pct);
      setDiscountValue(val);
      setDiscountType(pct > 0 ? 'percent' : 'value');
      setDeliveryCost(Number(d.delivery_cost ?? 0));
      setGreetingText(d.greeting_text ?? '');
      setAiSummary(d.ai_summary ?? '');
      setNotesClient(d.notes_client ?? '');
      setNotesInternal(d.notes_internal ?? '');
      setLoaded(true);
    }
  }, [offerQuery.data, loaded]);

  const totals: OfferTotals = useMemo(() => {
    const dp = discountType === 'percent' ? Math.min(100, Math.max(0, discountPercent)) : 0;
    const dv = discountType === 'value' ? discountValue : 0;
    return calculateOfferTotals(pricingMode, peopleCount, variants, offerServices, dp, dv, deliveryCost);
  }, [variants, offerServices, pricingMode, peopleCount, discountType, discountPercent, discountValue, deliveryCost]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<{ discount_percent: number; discount_value: number; delivery_cost: number; greeting_text: string | null; ai_summary: string | null; notes_client: string | null; notes_internal: string | null; total_dishes_value: number; total_services_value: number; total_value: number; price_per_person: number }>) => {
      if (!offerId) return;
      const { error } = await supabase.from('offers').update(payload).eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
    onError: () => {
      toast.error('Nie udało się zapisać zmian');
    },
  });

  // Auto-save text fields
  const textFields = useMemo(() => ({
    greeting_text: greetingText || null,
    ai_summary: aiSummary || null,
    notes_client: notesClient || null,
    notes_internal: notesInternal || null,
  }), [greetingText, aiSummary, notesClient, notesInternal]);

  const debouncedTextFields = useDebounce(textFields, 800);
  const prevTextRef = useRef(debouncedTextFields);

  useEffect(() => {
    if (!loaded || !offerId) return;
    if (prevTextRef.current === debouncedTextFields) return;
    prevTextRef.current = debouncedTextFields;
    saveMutation.mutate(debouncedTextFields);
  }, [debouncedTextFields]);

  const saveFinancials = () => {
    if (!offerId) return;
    const dp = discountType === 'percent' ? discountPercent : 0;
    const dv = discountType === 'value' ? discountValue : 0;

    if (dv > 0) {
      const maxTotal = Math.max(...totals.variantTotals.map(v => v.total), 0);
      if (dv > maxTotal) {
        toast.error(`Rabat (${dv} zł) nie może przekroczyć wartości dań (${maxTotal.toFixed(2)} zł)`);
        return;
      }
    }

    saveMutation.mutate({
      discount_percent: dp,
      discount_value: dv,
      delivery_cost: deliveryCost,
      total_dishes_value: totals.maxDishesTotal,
      total_services_value: totals.servicesTotalCalc,
      total_value: totals.grandTotal,
      price_per_person: totals.pricePerPerson,
    });
  };

  const handleDiscountTypeChange = (value: string) => {
    setDiscountType(value as DiscountType);
    if (value === 'percent') setDiscountValue(0);
    else setDiscountPercent(0);
    setTimeout(saveFinancials, 100);
  };

  const handleDiscountChange = (val: number) => {
    if (discountType === 'percent') setDiscountPercent(Math.min(100, Math.max(0, val)));
    else setDiscountValue(val);
  };

  useEffect(() => {
    if (!loaded) return;
    saveFinancials();
  }, [discountPercent, discountValue, discountType, deliveryCost, totals.maxDishesTotal, totals.servicesTotalCalc]);

  // AI generation
  const handleGenerateGreeting = async () => {
    setIsGenerating(true);
    try {
      const eventTypeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label ?? eventType;
      const { data, error } = await supabase.functions.invoke('generate-greeting', {
        body: { event_type_label: eventTypeLabel, event_date: eventDate, inquiry_text: inquiryText, client_name: clientName, people_count: peopleCount },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.greeting) { setGreetingText(data.greeting); toast.success('Tekst wygenerowany'); }
    } catch {
      toast.error('Nie udało się wygenerować tekstu');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const eventTypeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label ?? eventType;
      const pricingModeLabel = pricingMode === 'PER_PERSON' ? 'per person' : 'ilości stałe';
      const variantsSummary = variants
        .map((v) => {
          const dishes = v.variant_items.map((item) => {
            const name = item.custom_name || item.dishes?.display_name || '?';
            const price = getItemPrice(item);
            return `${name} (${price} zł)`;
          }).join(', ');
          return `${v.name}: ${dishes || 'brak dań'}`;
        }).join(' | ');
      const servicesSummary = offerServices.map((os) => {
        const price = os.custom_price ?? os.services.price;
        const qty = os.quantity ?? 1;
        return `${os.services.name} (${price} zł × ${qty})`;
      }).join(', ');
      const discountInfo = discountPercent > 0 ? `Rabat: ${discountPercent}%` : discountValue > 0 ? `Rabat: ${discountValue} zł` : null;

      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { inquiry_text: inquiryText, event_type_label: eventTypeLabel, variants_summary: variantsSummary, total_value: totals.grandTotal, services_summary: servicesSummary, people_count: peopleCount, event_date: eventDate, client_name: clientName, discount_info: discountInfo, delivery_cost: deliveryCost > 0 ? deliveryCost : null, pricing_mode_label: pricingModeLabel },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.summary) { setAiSummary(data.summary); toast.success('Podsumowanie wygenerowane'); }
    } catch {
      toast.error('Nie udało się wygenerować podsumowania');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return {
    variants,
    offerServices,
    totals,
    discountType,
    discountPercent,
    discountValue,
    deliveryCost,
    greetingText,
    aiSummary,
    notesClient,
    notesInternal,
    isGenerating,
    isGeneratingSummary,
    setDeliveryCost,
    setGreetingText,
    setAiSummary,
    setNotesClient,
    setNotesInternal,
    handleDiscountTypeChange,
    handleDiscountChange,
    handleGenerateGreeting,
    handleGenerateSummary,
    pricingMode,
    peopleCount,
    inquiryText,
  };
};
