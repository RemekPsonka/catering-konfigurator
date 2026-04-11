import { motion } from 'framer-motion';
import { Phone, Mail, Instagram, FileDown } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useCompanyInfo } from '@/hooks/use-company-info';

interface ContactSectionProps {
  onPrint?: () => void;
}

export const ContactSection = ({ onPrint }: ContactSectionProps) => {
  const { data: company } = useCompanyInfo();

  const contacts = [
    {
      icon: Phone,
      label: 'Telefon',
      value: company?.phone ?? '',
      href: `tel:${(company?.phone ?? '').replace(/\s/g, '')}`,
    },
    {
      icon: Mail,
      label: 'E-mail',
      value: company?.email ?? '',
      href: `mailto:${company?.email ?? ''}`,
    },
    ...(company?.instagram
      ? [{
          icon: Instagram,
          label: 'Instagram',
          value: `@${company.instagram.replace(/^@/, '')}`,
          href: `https://instagram.com/${company.instagram.replace(/^@/, '')}`,
        }]
      : []),
  ];

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="py-8 md:py-12"
    >
      <div className="mx-auto max-w-4xl px-6">
        <motion.h2
          variants={fadeInUp}
          className="mb-4 text-center font-display text-xl font-bold"
          style={{ color: 'var(--theme-text, #1A1A1A)' }}
        >
          Kontakt
        </motion.h2>

        {onPrint && (
          <motion.div variants={fadeInUp} className="mb-4 flex justify-center no-print">
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2 font-body text-sm font-semibold tracking-wide transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--theme-primary, #1A1A1A)',
                color: 'var(--theme-primary, #1A1A1A)',
              }}
            >
              <FileDown className="h-4 w-4" />
              Pobierz ofertę PDF
            </button>
          </motion.div>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
          {contacts.map((contact) => (
            <motion.a
              key={contact.label}
              variants={fadeInUp}
              href={contact.href}
              target={contact.href.startsWith('https') ? '_blank' : undefined}
              rel={contact.href.startsWith('https') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2 font-body text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--theme-text, #1A1A1A)' }}
            >
              <contact.icon className="h-4 w-4" style={{ color: 'var(--theme-primary, #1A1A1A)' }} />
              <span className="font-medium">{contact.value}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
