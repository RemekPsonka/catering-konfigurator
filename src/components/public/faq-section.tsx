import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { trackOfferEvent } from '@/lib/tracking';
import { HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  offerId: string;
  eventType: string;
}

export const FaqSection = ({ offerId, eventType }: FaqSectionProps) => {
  const { data: faqs } = useQuery({
    queryKey: ['offer-faq', eventType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_faq')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const filtered = (faqs ?? [])
    .filter((f) => {
      const types = f.event_types as string[];
      return !types || types.length === 0 || types.includes(eventType);
    })
    .slice(0, 8);

  if (filtered.length === 0) return null;

  const handleOpen = (value: string) => {
    if (value) {
      trackOfferEvent(offerId, 'faq_opened', { question_id: value });
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)' }}>
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(var(--theme-primary-rgb, 26,26,26), 0.1)' }}>
            <HelpCircle className="h-6 w-6" style={{ color: 'var(--theme-primary, #1A1A1A)' }} />
          </div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Najczęściej zadawane pytania
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="single" collapsible onValueChange={handleOpen} className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <AccordionItem
                  value={faq.id}
                  className="rounded-xl border-0 px-5 shadow-sm"
                  style={{ backgroundColor: 'rgba(var(--theme-primary-rgb, 26,26,26), 0.03)' }}
                >
                  <AccordionTrigger className="text-left font-body text-base font-semibold hover:no-underline [&[data-state=open]]:pb-2" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="font-body text-sm leading-relaxed" style={{ color: 'var(--theme-text, #1A1A1A)', opacity: 0.75 }}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
