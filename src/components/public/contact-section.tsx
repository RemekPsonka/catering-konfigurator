import { motion } from 'framer-motion';
import { Phone, Mail, Instagram, FileDown } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const CONTACTS = [
  {
    icon: Phone,
    label: 'Telefon',
    value: '+48 123 456 789',
    href: 'tel:+48123456789',
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: 'zamowienia@cateringslaski.pl',
    href: 'mailto:zamowienia@cateringslaski.pl',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: '@cateringsl',
    href: 'https://instagram.com/cateringsl',
  },
];

interface ContactSectionProps {
  ctaText?: string | null;
  onPrint?: () => void;
}

export const ContactSection = ({ ctaText, onPrint }: ContactSectionProps) => {
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
          Kontakt
        </motion.h2>

        {ctaText && (
          <motion.div variants={fadeInUp} className="mb-8 text-center">
            <a
              href="tel:+48123456789"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-display text-lg font-semibold text-ivory tracking-wide shadow-premium transition-all hover:shadow-premium-hover"
              style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)' }}
            >
              <Phone className="h-5 w-5" />
              {ctaText}
            </a>
          </motion.div>
        )}

        {onPrint && (
          <motion.div variants={fadeInUp} className="mb-8 flex justify-center no-print">
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-body font-semibold tracking-wide transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--theme-primary, #1A1A1A)',
                color: 'var(--theme-primary, #1A1A1A)',
              }}
            >
              <FileDown className="h-5 w-5" />
              Pobierz ofertę PDF
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONTACTS.map((contact) => (
            <motion.a
              key={contact.label}
              variants={fadeInUp}
              href={contact.href}
              target={contact.href.startsWith('https') ? '_blank' : undefined}
              rel={contact.href.startsWith('https') ? 'noopener noreferrer' : undefined}
              whileHover={{ y: -4 }}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-ivory p-6 shadow-premium transition-all"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--theme-secondary, #e8e4dd)' }}
              >
                <contact.icon
                  className="h-5 w-5 transition-colors group-hover:scale-110"
                  style={{ color: 'var(--theme-primary, #1A1A1A)' }}
                />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
                {contact.label}
              </p>
              <p
                className="font-body text-base font-semibold transition-colors"
                style={{ color: 'var(--theme-text, #1A1A1A)' }}
              >
                {contact.value}
              </p>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
