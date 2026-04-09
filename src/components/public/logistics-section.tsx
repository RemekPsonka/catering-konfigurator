import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, ChefHat, Phone } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { supabase } from '@/integrations/supabase/client';
import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Enums } from '@/integrations/supabase/types';

interface LogisticsSectionProps {
  offer: PublicOffer;
}

const DELIVERY_INFO: Record<string, { label: string; description: string }> = {
  COLD: { label: 'Zimna dostawa', description: 'Dania w pojemnikach, gotowe do podgrzania' },
  HEATED: { label: 'Podgrzewana', description: 'Dania w podgrzewaczach, gotowe do serwowania' },
  FULL_SERVICE: { label: 'Full service', description: 'Pełna obsługa: dostawa, setup, serwis, sprzątanie' },
};

export const LogisticsSection = ({ offer }: LogisticsSectionProps) => {
  const [managerPhone, setManagerPhone] = useState<string | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const [phoneRes, nameRes] = await Promise.all([
        supabase.rpc('get_setting', { p_key: 'manager_phone' }),
        supabase.rpc('get_setting', { p_key: 'manager_name' }),
      ]);
      if (phoneRes.data) setManagerPhone(phoneRes.data);
      if (nameRes.data) setManagerName(nameRes.data);
    };
    fetchSettings();
  }, []);

  const deliveryType = offer.delivery_type as string | null;
  const deliveryInfo = deliveryType ? DELIVERY_INFO[deliveryType] : null;
  const validServices = offer.offer_services.filter((s) => s.services != null);
  const hasContact = managerPhone || managerName;

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-4xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-10 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Logistyka
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Delivery type */}
          {deliveryInfo && (
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="rounded-2xl bg-ivory p-6 shadow-premium"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
              >
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                {deliveryInfo.label}
              </h3>
              <p className="mt-2 text-sm text-charcoal/60 font-body">
                {deliveryInfo.description}
              </p>
            </motion.div>
          )}

          {/* Card 2: Additional services */}
          {validServices.length > 0 && (
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="rounded-2xl bg-ivory p-6 shadow-premium"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
              >
                <ChefHat className="h-6 w-6" />
              </div>
              <h3 className="mb-3 font-display text-lg font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                Usługi dodatkowe
              </h3>
              <ul className="space-y-1.5">
                {validServices.map((os) => (
                  <li key={os.id} className="text-sm text-charcoal/70 font-body">
                    {os.services.name}
                    {(os.quantity ?? 1) > 1 && (
                      <span className="text-charcoal/40 ml-1">×{os.quantity}</span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Card 3: Contact */}
          {hasContact && (
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="rounded-2xl bg-ivory p-6 shadow-premium"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: '#FAF7F2' }}
              >
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                Kontakt na dzień eventu
              </h3>
              <p className="mt-2 text-sm text-charcoal/60 font-body">
                W dniu wydarzenia kontakt:
              </p>
              {managerName && (
                <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                  {managerName}
                </p>
              )}
              {managerPhone && (
                <a
                  href={`tel:${managerPhone}`}
                  className="mt-1 inline-block text-sm font-medium"
                  style={{ color: 'var(--theme-primary, #1A1A1A)' }}
                >
                  {managerPhone}
                </a>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
};
