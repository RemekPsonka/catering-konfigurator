import { motion } from 'framer-motion';
import { FileX2, Sparkles, Phone, Mail, Search } from 'lucide-react';
import { COMPANY } from '@/lib/company-config';

export const InvalidTokenScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
      <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
      <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Nieprawidłowy link do oferty</h1>
      <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Sprawdź poprawność linku lub skontaktuj się z nami.</p>
      <a href="/offer/find" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 font-body font-semibold text-ivory tracking-wide transition-all hover:bg-charcoal/90">
        <Search className="h-4 w-4" /> Znajdź ofertę
      </a>
    </motion.div>
  </div>
);

export const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-cream">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-charcoal/20 border-t-charcoal" />
      <p className="font-body text-charcoal/60 tracking-wide">Ładowanie oferty...</p>
    </motion.div>
  </div>
);

export const NotFoundScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
      <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
      <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Nie znaleziono oferty</h1>
      <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Sprawdź link lub skontaktuj się z nami.</p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a href="/offer/find" className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 font-body font-semibold text-ivory tracking-wide transition-all hover:bg-charcoal/90">
          <Search className="h-4 w-4" /> Szukaj oferty
        </a>
        <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal">
          <Mail className="h-4 w-4" /> Skontaktuj się z nami
        </a>
      </div>
    </motion.div>
  </div>
);

export const DraftScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg text-center">
      <Sparkles className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
      <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Ta oferta jest w trakcie aktualizacji</h1>
      <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Wróć później lub skontaktuj się z nami.</p>
      <ContactLinks />
    </motion.div>
  </div>
);

export const LostScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg text-center">
      <FileX2 className="mx-auto mb-6 h-16 w-16 text-charcoal/30" />
      <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Oferta zamknięta</h1>
      <p className="mt-4 font-body text-lg text-charcoal/60 leading-relaxed">Ta oferta została zamknięta. Jeśli chcesz wznowić rozmowę, skontaktuj się z nami.</p>
      <ContactLinks />
    </motion.div>
  </div>
);

const ContactLinks = () => (
  <div className="mt-8 flex flex-col items-center gap-4">
    <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-body text-charcoal/80 transition-colors hover:text-charcoal">
      <Phone className="h-4 w-4" /> {COMPANY.phone}
    </a>
    <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-2 font-body text-charcoal/60 underline underline-offset-4 transition-colors hover:text-charcoal">
      <Mail className="h-4 w-4" /> {COMPANY.email}
    </a>
  </div>
);
