import { motion } from 'framer-motion';
import { Users, Wrench, Truck } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { formatCurrency } from '@/lib/calculations';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Enums } from '@/integrations/supabase/types';

interface ServicesSectionProps {
  services: PublicOffer['offer_services'];
  priceDisplayMode: Enums<'price_display_mode'>;
}

const SERVICE_GROUPS: Record<string, { label: string; Icon: React.ElementType }> = {
  STAFF: { label: 'Obsługa', Icon: Users },
  EQUIPMENT: { label: 'Sprzęt', Icon: Wrench },
  LOGISTICS: { label: 'Logistyka', Icon: Truck },
};

export const ServicesSection = ({ services, priceDisplayMode }: ServicesSectionProps) => {
  if (!services.length) return null;

  const validServices = services.filter((s) => s.services != null);
  const grouped = new Map<string, typeof validServices>();
  for (const s of validServices) {
    const type = s.services.type;
    const arr = grouped.get(type) ?? [];
    arr.push(s);
    grouped.set(type, arr);
  }

  const showPrice = priceDisplayMode === 'DETAILED' || priceDisplayMode === 'PER_PERSON_AND_TOTAL';

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
          Usługi dodatkowe
        </motion.h2>

        <div className="flex flex-col gap-4">
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

                <motion.div
                  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-1.5"
                >
                  {items.map((s) => {
                    const price = s.custom_price != null ? Number(s.custom_price) : s.services.price;
                    return (
                      <motion.div
                        key={s.id}
                        variants={fadeInUp}
                        className="flex items-center justify-between rounded-lg bg-ivory px-4 py-2.5 shadow-sm"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                            {s.services.name}
                          </span>
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
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};