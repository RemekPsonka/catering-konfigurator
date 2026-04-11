import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Check, Trash2, Sparkles, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/calculations';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { Button } from '@/components/ui/button';

interface UpsellSectionProps {
  offerId: string;
  eventType: string;
  peopleCount: number;
  upsellEnabled: boolean;
  actionsDisabled: boolean;
}

interface UpsellItem {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  price: number;
  price_type: string;
  default_quantity: number;
  is_active: boolean;
  sort_order: number;
}

export const UpsellSection = ({
  offerId,
  eventType,
  peopleCount,
  upsellEnabled,
  actionsDisabled,
}: UpsellSectionProps) => {
  const queryClient = useQueryClient();
  const [pendingQuantities, setPendingQuantities] = useState<Map<string, number>>(new Map());

  const setsQuery = useQuery({
    queryKey: ['public-upsell-sets', eventType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upsell_sets')
        .select('*, upsell_items(*)')
        .eq('is_active', true)
        .contains('event_types', [eventType])
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: upsellEnabled,
  });

  const selectionsQuery = useQuery({
    queryKey: ['public-upsell-selections', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_upsell_selections')
        .select('*')
        .eq('offer_id', offerId)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: upsellEnabled,
  });

  const addMutation = useMutation({
    mutationFn: async (item: {
      upsell_item_id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }) => {
      const { error } = await supabase
        .from('offer_upsell_selections')
        .insert({
          offer_id: offerId,
          upsell_item_id: item.upsell_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-upsell-selections', offerId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (selectionId: string) => {
      const { error } = await supabase
        .from('offer_upsell_selections')
        .update({ status: 'removed' as const })
        .eq('id', selectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-upsell-selections', offerId] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ selectionId, quantity, unitPrice }: { selectionId: string; quantity: number; unitPrice: number }) => {
      const { error } = await supabase
        .from('offer_upsell_selections')
        .update({ quantity, total_price: unitPrice * quantity })
        .eq('id', selectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-upsell-selections', offerId] });
    },
  });

  const activeSelections = useMemo(
    () => new Map((selectionsQuery.data ?? []).map((s) => [s.upsell_item_id, s])),
    [selectionsQuery.data],
  );

  const allItems = useMemo(() => {
    if (!setsQuery.data) return [];
    return setsQuery.data.flatMap((set) =>
      (set.upsell_items as UpsellItem[])
        .filter((i) => i.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    );
  }, [setsQuery.data]);

  if (!upsellEnabled || allItems.length === 0) return null;

  const getPendingQty = (itemId: string, defaultQty: number) =>
    pendingQuantities.get(itemId) ?? defaultQty;

  const setPendingQty = (itemId: string, qty: number) => {
    setPendingQuantities((prev) => new Map(prev).set(itemId, Math.max(1, Math.min(10, qty))));
  };

  const handleAdd = (item: UpsellItem) => {
    const isPerPerson = item.price_type === 'PER_PERSON';
    const quantity = isPerPerson ? peopleCount : getPendingQty(item.id, item.default_quantity);
    const unitPrice = item.price;
    const totalPrice = unitPrice * quantity;
    addMutation.mutate({
      upsell_item_id: item.id,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    });
  };

  const handleRemove = (itemId: string) => {
    const selection = activeSelections.get(itemId);
    if (selection) removeMutation.mutate(selection.id);
  };

  const handleQuantityChange = (itemId: string, newQty: number) => {
    const selection = activeSelections.get(itemId);
    if (!selection) return;
    const clampedQty = Math.max(1, Math.min(10, newQty));
    updateQuantityMutation.mutate({
      selectionId: selection.id,
      quantity: clampedQty,
      unitPrice: Number(selection.unit_price),
    });
  };

  return (
    <motion.section
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div variants={fadeInUp} className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--theme-primary, #1A1A1A)' }} />
            <span
              className="font-header text-sm uppercase tracking-widest"
              style={{ color: 'var(--theme-primary, #1A1A1A)' }}
            >
              Dopasowane do Twojego wydarzenia
            </span>
          </div>
          <h2
            className="font-header text-2xl md:text-3xl font-bold"
            style={{ color: 'var(--theme-text, #1A1A1A)' }}
          >
            Urozmaić menu?
          </h2>
          <p className="font-body text-sm mt-2 opacity-70" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Wybrane pozycje zostaną dodane do Twojej oferty
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={staggerContainer}
        >
          {allItems.map((item) => {
            const isAdded = activeSelections.has(item.id);
            const isPerPerson = item.price_type === 'PER_PERSON';
            const totalForPerPerson = item.price * peopleCount;
            const selection = activeSelections.get(item.id);

            return (
              <motion.div
                key={item.id}
                variants={fadeInUp}
                className="rounded-xl p-5 transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  border: isAdded
                    ? '2px solid #22c55e'
                    : '1px solid rgba(0,0,0,0.08)',
                  boxShadow: isAdded
                    ? '0 0 0 3px rgba(34,197,94,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {item.emoji && (
                  <span className="text-5xl leading-none block mb-3">{item.emoji}</span>
                )}

                <h3
                  className="font-header text-base font-semibold mb-1"
                  style={{ color: 'var(--theme-text, #1A1A1A)' }}
                >
                  {item.name}
                </h3>

                {item.description && (
                  <p
                    className="font-body text-sm line-clamp-2 mb-3 opacity-60"
                    style={{ color: 'var(--theme-text, #1A1A1A)' }}
                  >
                    {item.description}
                  </p>
                )}

                <div className="mb-4">
                  {isPerPerson ? (
                    <p className="font-body text-sm" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      <span className="font-bold">{formatCurrency(item.price)}/os</span>
                      <span className="opacity-60 ml-1">
                        ({peopleCount} os = {formatCurrency(totalForPerPerson)})
                      </span>
                    </p>
                  ) : (
                    <p
                      className="font-body text-lg font-bold"
                      style={{ color: 'var(--theme-primary, #1A1A1A)' }}
                    >
                      {formatCurrency(item.price)}{item.default_quantity > 1 ? ` × ${item.default_quantity}` : ''}
                    </p>
                  )}
                </div>

                {!isAdded ? (
                  <div className="space-y-2">
                    {/* Quantity selector for non-per-person items */}
                    {!isPerPerson && (
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs opacity-60" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                          Ilość:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPendingQty(item.id, getPendingQty(item.id, item.default_quantity) - 1)}
                            disabled={getPendingQty(item.id, item.default_quantity) <= 1}
                            className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors disabled:opacity-30"
                            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-body font-semibold w-6 text-center" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                            {getPendingQty(item.id, item.default_quantity)}
                          </span>
                          <button
                            onClick={() => setPendingQty(item.id, getPendingQty(item.id, item.default_quantity) + 1)}
                            disabled={getPendingQty(item.id, item.default_quantity) >= 10}
                            className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors disabled:opacity-30"
                            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      disabled={actionsDisabled || addMutation.isPending}
                      onClick={() => handleAdd(item)}
                      className="w-full"
                      style={{
                        backgroundColor: 'var(--theme-primary, #1A1A1A)',
                        color: '#fff',
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Dodaj{!isPerPerson && getPendingQty(item.id, item.default_quantity) > 1
                        ? ` (${formatCurrency(item.price * getPendingQty(item.id, item.default_quantity))})`
                        : ''}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Quantity changer for added non-per-person items */}
                    {!isPerPerson && selection && (
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs opacity-60" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                          Ilość:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, selection.quantity - 1)}
                            disabled={actionsDisabled || selection.quantity <= 1 || updateQuantityMutation.isPending}
                            className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors disabled:opacity-30"
                            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-body font-semibold w-6 text-center" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                            {selection.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, selection.quantity + 1)}
                            disabled={actionsDisabled || selection.quantity >= 10 || updateQuantityMutation.isPending}
                            className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors disabled:opacity-30"
                            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {!isPerPerson && selection && selection.quantity > 1 && (
                      <p className="font-body text-xs text-center opacity-60" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                        {selection.quantity} × {formatCurrency(Number(selection.unit_price))} = {formatCurrency(Number(selection.total_price))}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="flex-1 border-green-500 text-green-600"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Dodano
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionsDisabled || removeMutation.isPending}
                        onClick={() => handleRemove(item.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
};
