import { useState, useEffect } from 'react';
import { Copy, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EmailTemplateModalProps {
  open: boolean;
  onClose: () => void;
  recipientEmail: string;
  subject: string;
  body: string;
  title?: string;
}

const MAILTO_LIMIT = 1800;

export const EmailTemplateModal = ({
  open,
  onClose,
  recipientEmail,
  subject,
  body: initialBody,
  title = '📧 Email do klienta',
}: EmailTemplateModalProps) => {
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (open) setBody(initialBody);
  }, [open, initialBody]);

  const mailtoTooLong = encodeURIComponent(body).length > MAILTO_LIMIT;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(`Temat: ${subject}\n\n${body}`);
      toast.success('Skopiowano temat i treść do schowka');
    } catch {
      toast.error('Nie udało się skopiować');
    }
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(recipientEmail);
      toast.success('Email skopiowany');
    } catch {
      toast.error('Nie udało się skopiować');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Do:</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input value={recipientEmail} readOnly className="bg-muted" />
              <Button variant="outline" size="icon" onClick={handleCopyEmail}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Temat:</Label>
            <Input value={subject} readOnly className="mt-1 bg-muted" />
          </div>

          <div>
            <Label>Treść:</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 min-h-[150px] font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopyAll} className="gap-2">
              <Copy className="h-4 w-4" />
              Kopiuj wszystko
            </Button>
            <Button
              variant="secondary"
              onClick={handleOpenMailClient}
              className="gap-2"
              disabled={mailtoTooLong}
              title={mailtoTooLong ? 'Treść zbyt długa dla mailto' : undefined}
            >
              <Mail className="h-4 w-4" />
              Otwórz w kliencie email
            </Button>
            <Button variant="ghost" onClick={onClose} className="gap-2 ml-auto">
              <X className="h-4 w-4" />
              Pomiń
            </Button>
          </div>

          {mailtoTooLong && (
            <p className="text-xs text-destructive">
              Treść zbyt długa dla mailto — użyj przycisku „Kopiuj wszystko".
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Skopiuj treść i wyślij klientowi ze swojej skrzynki pocztowej.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
