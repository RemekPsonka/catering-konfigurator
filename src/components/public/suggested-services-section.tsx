import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { Plus, Check } from 'lucide-react';
import type { PublicOffer } from '@/hooks/use-public-offer';

const SERVICE_TYPE_EMOJI: Record<string, string> = {
  STAFF: '👨‍🍳',
  EQUIPMENT: '🏗️',
  LOGISTICS: '🚚',
};

const formatServicePrice = (price: number, priceType: string, peopleCount: number) => {
  const fmt = (v: number) => v.toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  switch (priceType) {
    case 'PER_HOUR': return `${fmt(price)} zł/h`;
    case 'PER_EVENT': return `${fmt(price)} zł za event`;
    case 'PER_PIECE': return `${fmt(price)} zł/szt`;
    case 'PER_PERSON': {
      const total = price * peopleCount;
      return `${fmt(price)} zł/os (${peopleCount} os = ${fmt(total)} zł)`;
    }
    default: return `${fmt(price)} zł`;
  }
};

interface SuggestedServicesSectionProps {
  offerId: string;
  offerServices: PublicOffer['offer_services'];
  peopleCount: number;
  upsellEnabled: boolean;
  actionsDisabled: boolean;
}

export const SuggestedServicesSection = ({ offerId, offerServices, peopleCount, upsellEnabled, actionsDisabled }: SuggestedServicesSectionProps) => {
  const queryClient = useQueryClient();

  const { data: allServices } = useQuery({
    queryKey: ['public-services-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: upsellEnabled,
  });

  const { data: selections } = useQuery({
    queryKey: ['public-upsell-selections', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_upsell_selections')
        .select('*, upsell_items(*)')
        .eq('offer_id', offerId)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: upsellEnabled,
  });

  const addMutation = useMutation({
    mutationFn: async (service: { id: string; price: number; priceType: string }) => {
      const quantity = service.priceType === 'PER_PERSON' ? peopleCount : 1;
      const totalPrice = service.price * quantity;

      // We need an upsell_item_id — but services aren't upsell_items.
      // We insert with service_id reference. But offer_upsell_selections requires upsell_item_id.
      // Per the plan, we need to find or handle this. The table has upsell_item_id as required.
      // We'll look for an existing upsell_item with service_id matching, or create inline.
      // Actually, checking the schema: upsell_items has service_id field and item_type='SERVICE'.
      // Let's find or create one.
      let { data: existingItem } = await supabase
        .from('upsell_items')
        .select('id')
        .eq('service_id', service.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!existingItem) {
        // Fetch service details to create an upsell_item
        const { data: svc } = await supabase.from('services').select('*').eq('id', service.id).single();
        if (!svc) throw new Error('Service not found');

        // We need a set_id. Find or create a "suggested services" set.
        let { data: suggestedSet } = await supabase
          .from('upsell_sets')
          .select('id')
          .eq('name', '_suggested_services')
          .limit(1)
          .maybeSingle();

        if (!suggestedSet) {
          const { data: newSet, error: setErr } = await supabase
            .from('upsell_sets')
            .insert({ name: '_suggested_services', event_types: [], is_active: false })
            .select('id')
            .single();
          if (setErr) throw setErr;
          suggestedSet = newSet;
        }

        const { data: newItem, error: itemErr } = await supabase
          .from('upsell_items')
          .insert({
            set_id: suggestedSet!.id,
            item_type: 'SERVICE' as const,
            service_id: service.id,
            name: svc.name,
            description: svc.description,
            price: svc.price,
            price_type: service.priceType === 'PER_PERSON' ? 'PER_PERSON' as const : 'FIXED' as const,
            is_active: true,
          })
          .select('id')
          .single();
        if (itemErr) throw itemErr;
        existingItem = newItem;
      }

      const { error } = await supabase.from('offer_upsell_selections').insert({
        offer_id: offerId,
        upsell_item_id: existingItem!.id,
        quantity,
        unit_price: service.price,
        total_price: totalPrice,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-upsell-selections', offerId] });
    },
  });

  const offerServiceIds = useMemo(() => new Set(offerServices.map((os) => os.service_id)), [offerServices]);

  const selectedServiceIds = useMemo(() => {
    if (!selections) return new Set<string>();
    return new Set(
      selections
        .filter((s) => s.upsell_items?.service_id)
        .map((s) => s.upsell_items!.service_id as string)
    );
  }, [selections]);

  const suggestedServices = useMemo(() => {
    if (!allServices) return [];
    return allServices.filter((s) => !offerServiceIds.has(s.id) && !selectedServiceIds.has(s.id));
  }, [allServices, offerServiceIds, selectedServiceIds]);

  if (!upsellEnabled || suggestedServices.length === 0) return null;

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <motion.h2
            variants={fadeInUp}
            className="font-display text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: 'var(--theme-text, #1A1A1A)' }}
          >
            💡 Możesz jeszcze dodać
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {suggestedServices.map((service) => (
              <motion.div
                key={service.id}
                variants={fadeInUp}
                className="rounded-xl border p-5 flex flex-col items-center text-center transition-all"
                style={{
                  borderColor: 'rgba(var(--theme-primary-rgb, 26,26,26), 0.12)',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                }}
              >
                <span className="text-5xl mb-3">{SERVICE_TYPE_EMOJI[service.type] ?? '🔧'}</span>
                <h3
                  className="font-display text-lg font-semibold mb-1"
                  style={{ color: 'var(--theme-text, #1A1A1A)' }}
                >
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm mb-3 line-clamp-2 opacity-70" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    {service.description}
                  </p>
                )}
                <p className="font-semibold mb-4" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                  {formatServicePrice(Number(service.price), service.price_type, peopleCount)}
                </p>
                <button
                  onClick={() => addMutation.mutate({ id: service.id, price: Number(service.price), priceType: service.price_type })}
                  disabled={actionsDisabled || addMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--theme-primary, #1A1A1A)',
                    color: 'var(--theme-bg, #FAF7F2)',
                  }}
                >
                  <Plus className="h-4 w-4" /> Dodaj
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
