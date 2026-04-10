import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Wrench, Truck, Phone, ChefHat } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { formatCurrency } from '@/lib/calculations';
import { supabase } from '@/integrations/supabase/client';
import { DELIVERY_TYPE_LABELS } from '@/lib/offer-constants';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Enums } from '@/integrations/supabase/types';

interface ServicesLogisticsSectionProps {
  offer: PublicOffer;
  priceDisplayMode: Enums<'price_display_mode'>;
}

const SERVICE_GROUPS: Record<string, { label: string; Icon: React.ElementType }> = {
  STAFF: { label: 'Obsługa', Icon: Users },
  EQUIPMENT: { label: 'Sprzęt', Icon: Wrench },
  LOGISTICS: { label: 'Logistyka', Icon: Truck },
};

export const ServicesLogisticsSection = ({ offer, priceDisplayMode }: ServicesLogisticsSectionProps) => {
  const [managerPhone, setManagerPhone] = useState<string | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const [phoneRes, nameRes] = await Promise.all([
        supabase.rpc('get_setting', { p_key: 'manager_phone' }),
        supabase.rpc('get_setting', { p_key: 'manager_name' }),
      ]);
      if (phoneRes.data) setManagerPhone(phoneRes.data);
      if (nameRes.data) setManagerName(nameRes.data);
    };
    loadSettings();
  }, []);

  const services = offer.offer_services;
  const validServices = services.filter((s) => s.services != null);
  const grouped = new Map<string, typeof validServices>();
  for (const s of validServices) {
    const type = s.services.type;
    const arr = grouped.get(type) ?? [];
    arr.push(s);
    grouped.set(type, arr);
  }

  const deliveryLabel = offer.delivery_type ? DELIVERY_TYPE_LABELS[offer.delivery_type] : null;
  const hasContact = managerPhone || managerName;
  const showPrice = priceDisplayMode === 'DETAILED' || priceDisplayMode === 'PER_PERSON_AND_TOTAL';
  const hasContent = deliveryLabel || validServices.length > 0 || hasContact;

  if (!hasContent) return null;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-8 md:py-12"
      style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-6 text-center font-display text-xl font-bold"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Usługi i logistyka
        </motion.h2>

        <div className="flex flex-col gap-4">
          {/* Delivery type */}
          {deliveryLabel && (
            <motion.div variants={fadeInUp}>
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
                >
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-display text-base font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  Forma dostawy
                </h3>
              </div>
              <div className="rounded-lg bg-ivory px-4 py-2.5 shadow-sm">
                <span className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  {deliveryLabel}
                </span>
              </div>
            </motion.div>
          )}

          {/* Service groups */}
          {(['STAFF', 'EQUIPMENT', 'LOGISTICS'] as const).map((type) => {
            const items = grouped.get(type);
            if (!items?.length) return null;
            const { label, Icon } = SERVICE_GROUPS[type];

            return (
              <motion.div key={type} variants={fadeInUp}>
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="font-display text-base font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    {label}
                  </h3>
                </div>

                <div className="flex flex-col gap-1.5">
                  {items.map((s) => {
                    const price = s.custom_price != null ? Number(s.custom_price) : s.services.price;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg bg-ivory px-4 py-2.5 shadow-sm"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                            {s.services.name}
                          </span>
                          {(s.quantity ?? 1) > 1 && (
                            <span className="font-body text-xs" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}>
                              ×{s.quantity}
                            </span>
                          )}
                          {s.services.description && (
                            <span className="font-body text-xs" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.5 }}>
                              {s.services.description}
                            </span>
                          )}
                        </div>
                        {showPrice && (
                          <span className="font-body text-sm font-bold" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                            {formatCurrency(price * (s.quantity ?? 1))}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          {/* Contact on event day */}
          {hasContact && (
            <motion.div variants={fadeInUp}>
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
                >
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-display text-base font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  Kontakt na dzień eventu
                </h3>
              </div>
              <div className="rounded-lg bg-ivory px-4 py-2.5 shadow-sm">
                <span className="font-body text-sm" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  {managerName && <span className="font-semibold">{managerName}</span>}
                  {managerName && managerPhone && ', '}
                  {managerPhone && (
                    <a href={`tel:${managerPhone}`} className="font-medium underline underline-offset-2" style={{ color: 'var(--theme-primary, #1A1A1A)' }}>
                      {managerPhone}
                    </a>
                  )}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
};
