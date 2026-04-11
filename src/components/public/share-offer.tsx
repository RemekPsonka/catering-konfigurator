import { useState } from 'react';
import { Share2, Copy, Mail, MessageCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { trackOfferEvent } from '@/lib/tracking';
import { motion } from 'framer-motion';

interface ShareOfferProps {
  offerId: string;
  eventTypeLabel: string;
  eventDate?: string | null;
}

export const ShareOffer = ({ offerId, eventTypeLabel, eventDate }: ShareOfferProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const offerUrl = window.location.href;
  const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('pl-PL') : '';
  const subject = `Oferta cateringowa — ${eventTypeLabel}${dateStr ? ` ${dateStr}` : ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(offerUrl);
      toast.success('Link skopiowany!');
    } catch {
      toast.error('Nie udało się skopiować linku');
    }
    trackOfferEvent(offerId, 'share_clicked', { method: 'copy' });
  };

  const handleEmail = () => {
    const body = `Cześć,\n\nPrzesyłam Ci ofertę cateringową do przejrzenia:\n${offerUrl}${message ? `\n\n${message}` : ''}`;
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    trackOfferEvent(offerId, 'share_clicked', { method: 'email' });
    setEmail('');
    setMessage('');
    setOpen(false);
  };

  const handleWhatsApp = () => {
    const text = `${subject}\n\nZobacz ofertę: ${offerUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    trackOfferEvent(offerId, 'share_clicked', { method: 'whatsapp' });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 15 }}
          className="fixed right-4 bottom-20 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: 'var(--theme-bg, #FAF7F2)' }}
          aria-label="Udostępnij ofertę"
        >
          <Share2 className="h-5 w-5" />
        </motion.button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[360px] sm:w-[400px]" style={{ backgroundColor: 'var(--theme-bg, #FAF7F2)', color: 'var(--theme-text, #1A1A1A)' }}>
        <SheetHeader>
          <SheetTitle className="font-display text-xl" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
            Udostępnij ofertę
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Copy link */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl border-2 px-4 py-6 text-left transition-colors hover:border-current"
            style={{ borderColor: 'var(--theme-primary, #1A1A1A)', color: 'var(--theme-text, #1A1A1A)' }}
            onClick={handleCopy}
          >
            <Copy className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Kopiuj link</p>
              <p className="text-xs opacity-60">Skopiuj link do schowka</p>
            </div>
          </Button>

          {/* WhatsApp */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl border-2 px-4 py-6 text-left transition-colors hover:border-current"
            style={{ borderColor: 'var(--theme-primary, #1A1A1A)', color: 'var(--theme-text, #1A1A1A)' }}
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">WhatsApp</p>
              <p className="text-xs opacity-60">Wyślij przez WhatsApp</p>
            </div>
          </Button>

          {/* Email */}
          <div className="space-y-3 rounded-xl border-2 p-4" style={{ borderColor: 'var(--theme-primary, #1A1A1A)' }}>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <p className="font-semibold">Wyślij emailem</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-email" className="text-xs opacity-60">Email odbiorcy</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="jan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-msg" className="text-xs opacity-60">Wiadomość (opcjonalnie)</Label>
              <Textarea
                id="share-msg"
                placeholder="Hej, zobacz tę ofertę..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="rounded-lg"
              />
            </div>
            <Button
              className="w-full rounded-lg"
              style={{ backgroundColor: 'var(--theme-primary, #1A1A1A)', color: 'var(--theme-bg, #FAF7F2)' }}
              disabled={!email.includes('@')}
              onClick={handleEmail}
            >
              Wyślij
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
