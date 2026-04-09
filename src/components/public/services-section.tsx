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

  const grouped = new Map<string, typeof services>();
  for (const s of services) {
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
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}
    >
      <div className="mx-auto max-w-5xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Usługi dodatkowe
        </motion.h2>

        <div className="flex flex-col gap-8">
          {(['STAFF', 'EQUIPMENT', 'LOGISTICS'] as const).map((type) => {
            const items = grouped.get(type);
            if (!items?.length) return null;
            const { label, Icon } = SERVICE_GROUPS[type];

            return (
              <motion.div key={type} variants={fadeInUp}>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    {label}
                  </h3>
                </div>

                <motion.div
                  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {items.map((s) => {
                    const price = s.custom_price != null ? Number(s.custom_price) : s.services.price;
                    return (
                      <motion.div
                        key={s.id}
                        variants={fadeInUp}
                        className="flex items-center justify-between rounded-xl bg-ivory p-4 shadow-premium"
                      >
                        <div>
                          <p className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                            {s.services.name}
                          </p>
                          {s.services.description && (
                            <p className="mt-0.5 font-body text-xs" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.6 }}>
                              {s.services.description}
                            </p>
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
