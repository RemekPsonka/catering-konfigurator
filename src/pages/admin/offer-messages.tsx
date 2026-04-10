import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ArrowLeft, Send, MessageCircle, FileEdit } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { EmailTemplateModal } from '@/components/common/email-template-modal';
import { useAdminCorrections, useRespondCorrection } from '@/hooks/use-offer-corrections';
import { fireNotification } from '@/hooks/use-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { buildPublicOfferUrl } from '@/lib/constants';

export const OfferMessagesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: corrections, isLoading } = useAdminCorrections(id);
  const respondMutation = useRespondCorrection();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    subject: string;
    body: string;
    clientEmail: string;
    clientName: string;
  } | null>(null);

  // Fetch offer details for email template
  const { data: offer } = useQuery({
    queryKey: ['offer-for-messages', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('*, clients(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleRespond = (correctionId: string, type: string) => {
    const responseText = responses[correctionId]?.trim();
    if (!responseText) {
      toast.error('Wpisz treść odpowiedzi.');
      return;
    }

    respondMutation.mutate(
      { correctionId, managerResponse: responseText },
      {
        onSuccess: () => {
          toast.success('Odpowiedź zapisana');
          setResponses((prev) => ({ ...prev, [correctionId]: '' }));

          // Fire notification
          if (id && offer) {
            fireNotification({
              offerId: id,
              eventType: 'response_sent',
              title: `✉️ Odpowiedź wysłana — ${offer.offer_number ?? ''}`,
              body: 'Odpowiedziałeś na pytanie/korektę klienta.',
              link: `/admin/offers/${id}/messages`,
            });
          }

          // Show email modal
          const client = offer?.clients as any;
          const clientEmail = client?.email ?? '';
          const clientName = client?.name ?? '';
          const offerNumber = offer?.offer_number ?? '';
          const publicToken = offer?.public_token ?? '';
          const isQuestion = type === 'question';

          setEmailModal({
            open: true,
            clientEmail,
            clientName,
            subject: isQuestion
              ? `Odpowiedź na pytanie — oferta ${offerNumber}`
              : `Odpowiedź na korektę — oferta ${offerNumber}`,
            body: `Szanowna/y ${clientName},\n\ndziękujemy za ${isQuestion ? 'pytanie' : 'uwagę'} dotyczące oferty ${offerNumber}.\n\n${responseText}\n\nSzczegóły znajdziesz w swojej ofercie:\n${publicToken ? buildPublicOfferUrl(publicToken) : ''}\n\nPozdrawiamy,\nCatering Śląski\ntel. +48 123 456 789 | zamowienia@cateringslaski.pl`,
          });
        },
        onError: () => {
          toast.error('Nie udało się zapisać odpowiedzi.');
        },
      },
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={id ? `/admin/offers/${id}/edit` : '/admin/offers'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          💬 Komunikacja — {offer?.offer_number ?? 'Oferta'}
        </h1>
      </div>

      {!corrections?.length ? (
        <EmptyState
          icon={MessageCircle}
          title="Brak wiadomości"
          description="Klient nie wysłał jeszcze żadnych pytań ani korekt."
        />
      ) : (
        <div className="space-y-4">
          {corrections.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {c.type === 'question' ? (
                    <Badge className="bg-blue-100 text-blue-800">💬 Pytanie</Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800">📝 Korekta</Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      c.status === 'new'
                        ? 'border-yellow-300 text-yellow-700'
                        : c.status === 'resolved'
                          ? 'border-green-300 text-green-700'
                          : ''
                    }
                  >
                    {c.status === 'new' ? '⏳ Nowe' : c.status === 'read' ? '👁 Przeczytane' : '✅ Rozwiązane'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {c.created_at ? format(new Date(c.created_at), 'dd.MM.yyyy, HH:mm', { locale: pl }) : ''}
                  </span>
                  {c.client_name && (
                    <span className="text-sm font-medium">— {c.client_name}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-muted p-4 text-sm">{c.message}</div>

                {c.status === 'resolved' && c.manager_response && (
                  <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Twoja odpowiedź:</p>
                    <p>{c.manager_response}</p>
                    {c.responded_at && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(c.responded_at), 'dd.MM.yyyy, HH:mm', { locale: pl })}
                      </p>
                    )}
                  </div>
                )}

                {(c.status === 'new' || c.status === 'read') && (
                  <div className="space-y-2">
                    <Textarea
                      value={responses[c.id] ?? ''}
                      onChange={(e) =>
                        setResponses((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      placeholder="Twoja odpowiedź..."
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={() => handleRespond(c.id, c.type ?? 'correction')}
                      disabled={respondMutation.isPending}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {c.type === 'question' ? 'Odpowiedz' : 'Rozwiąż'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {emailModal?.open && (
        <EmailTemplateModal
          open={emailModal.open}
          onClose={() => setEmailModal(null)}
          recipientEmail={emailModal.clientEmail}
          subject={emailModal.subject}
          body={emailModal.body}
          title="Powiadom klienta o odpowiedzi"
        />
      )}
    </div>
  );
};
