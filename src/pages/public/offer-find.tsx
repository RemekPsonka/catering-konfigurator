import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, AlertCircle } from 'lucide-react';

// All statuses with a public_token are now accessible

const formatOfferNumber = (raw: string): string => {
  const cleaned = raw.trim().toUpperCase();
  // Already full format
  if (/^CS-\d{4}-\d{4}$/.test(cleaned)) return cleaned;
  // Has year prefix: "2026-0042"
  const yearMatch = cleaned.match(/^(\d{4})-(\d{4})$/);
  if (yearMatch) return `CS-${yearMatch[1]}-${yearMatch[2]}`;
  // Just digits — extract last 4
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length >= 4) {
    const last4 = digitsOnly.slice(-4);
    const year = new Date().getFullYear();
    return `CS-${year}-${last4}`;
  }
  return cleaned;
};

export const OfferFindPage = () => {
  const [email, setEmail] = useState('');
  const [offerNumber, setOfferNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const navigate = useNavigate();

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    const formattedNumber = formatOfferNumber(offerNumber);

    try {
      const { data, error } = await supabase.rpc('find_offer_by_email_and_number', {
        p_email: email.trim(),
        p_offer_number: formattedNumber,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        if (newFailed >= 3) {
          setCooldownSeconds(30);
          setErrorMessage('Zbyt wiele prób. Spróbuj ponownie za 30 sekund.');
        } else {
          setErrorMessage('Nie znaleziono oferty. Sprawdź poprawność adresu email i numeru oferty.');
        }
        return;
      }

      const result = data[0];


      if (result.public_token) {
        toast.success(`Witaj! Oto Twoja oferta.`);
        navigate(`/offer/${result.public_token}`);
        return;
      }

      setErrorMessage('Nie znaleziono oferty. Sprawdź poprawność adresu email i numeru oferty.');
    } catch {
      setErrorMessage('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, offerNumber, failedAttempts, cooldownSeconds, navigate]);

  const isDisabled = isSubmitting || cooldownSeconds > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            CS
          </div>
          <CardTitle className="text-xl">Znajdź swoją ofertę</CardTitle>
          <CardDescription>
            Wpisz adres email i numer oferty, aby wyświetlić szczegóły
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="find-email" className="text-sm font-medium text-foreground">
                Adres email
              </label>
              <Input
                id="find-email"
                type="email"
                placeholder="jan@example.pl"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMessage(null); }}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="find-number" className="text-sm font-medium text-foreground">
                Numer oferty
              </label>
              <Input
                id="find-number"
                type="text"
                placeholder="CS-2026-0042"
                value={offerNumber}
                onChange={(e) => { setOfferNumber(e.target.value); setErrorMessage(null); }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Możesz wpisać sam numer np. "0042" — uzupełnimy automatycznie
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isDisabled}>
              <Search className="mr-2 h-4 w-4" />
              {cooldownSeconds > 0
                ? `Odczekaj ${cooldownSeconds}s`
                : isSubmitting
                  ? 'Szukam...'
                  : 'Pokaż ofertę'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Jesteś managerem? Zaloguj się
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
