import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitCorrection } from '@/hooks/use-public-offer';
import { fireNotification } from '@/hooks/use-notifications';
import { fadeInUp } from '@/lib/animations';

interface CorrectionsSectionProps {
  offerId: string;
  offerNumber?: string | null;
  clientName?: string;
}

export const CorrectionsSection = ({ offerId, offerNumber, clientName }: CorrectionsSectionProps) => {
  const [message, setMessage] = useState('');
  const submitCorrection = useSubmitCorrection();

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error('Wpisz treść uwagi.');
      return;
    }

    submitCorrection.mutate(
      { offerId, message: message.trim() },
      {
        onSuccess: () => {
          toast.success('Uwaga wysłana! Dziękujemy za informację.');
          setMessage('');
          fireNotification({
            offerId,
            eventType: 'correction_submitted',
            title: `📝 Korekta — ${offerNumber ?? ''}`,
            body: `${clientName ?? 'Klient'}: "${message.trim().substring(0, 100)}"`,
            link: `/admin/offers/${offerId}/edit`,
          });
        },
        onError: () => {
          toast.error('Nie udało się wysłać uwagi. Spróbuj ponownie.');
        },
      },
    );
  };

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-3xl px-6">
        <h2
          className="mb-8 text-center font-display text-2xl font-bold md:text-3xl"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Uwagi i korekty
        </h2>
        <p className="mb-6 text-center font-body text-charcoal/60">
          Masz pytania lub uwagi do oferty? Napisz do nas.
        </p>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Opisz swoje uwagi..."
          className="min-h-[120px] resize-none rounded-2xl border p-5 font-body text-base"
          style={{
            backgroundColor: 'var(--theme-bg, #FAF7F2)',
            borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 20%, transparent)',
            color: 'var(--theme-text, #1A1A1A)',
          }}
        />

        <div className="mt-4 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={submitCorrection.isPending || !message.trim()}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-body font-semibold tracking-wide transition-all disabled:opacity-50"
            style={{
              borderColor: 'var(--theme-primary, #1A1A1A)',
              color: 'var(--theme-primary, #1A1A1A)',
            }}
          >
            <Send className="h-4 w-4" />
            Wyślij korektę
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};
