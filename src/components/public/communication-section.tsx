import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, FileEdit } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSubmitMessage, usePublicCorrections, usePublicResolvedProposals } from '@/hooks/use-offer-corrections';
import { fireNotification } from '@/hooks/use-notifications';
import { fadeInUp } from '@/lib/animations';

interface CommunicationSectionProps {
  offerId: string;
  offerNumber?: string | null;
  clientName?: string;
  actionsDisabled?: boolean;
}

export const CommunicationSection = ({ offerId, offerNumber, clientName, actionsDisabled = false }: CommunicationSectionProps) => {
  const [message, setMessage] = useState('');
  const [name, setName] = useState(clientName ?? '');
  const submitMessage = useSubmitMessage();
  const { data: corrections = [] } = usePublicCorrections(offerId);
  const { data: resolvedProposals = [] } = usePublicResolvedProposals(offerId);

  const handleSubmit = (type: 'question' | 'correction') => {
    if (!message.trim()) {
      toast.error('Wpisz treść wiadomości.');
      return;
    }

    submitMessage.mutate(
      { offerId, message: message.trim(), clientName: name.trim() || undefined, type },
      {
        onSuccess: () => {
          const isQuestion = type === 'question';
          toast.success(
            isQuestion
              ? 'Pytanie wysłane! Odpowiemy najszybciej jak to możliwe.'
              : 'Korekta wysłana! Manager przejrzy ją i wróci z odpowiedzią.',
          );
          setMessage('');
          fireNotification({
            offerId,
            eventType: isQuestion ? 'question_submitted' : 'correction_submitted',
            title: isQuestion
              ? `❓ Pytanie — ${offerNumber ?? ''}`
              : `📝 Korekta — ${offerNumber ?? ''}`,
            body: `${name.trim() || 'Klient'}: "${message.trim().substring(0, 100)}"`,
            link: `/admin/offers/${offerId}/messages`,
          });
        },
        onError: () => {
          toast.error('Nie udało się wysłać. Spróbuj ponownie.');
        },
      },
    );
  };

  // Build timeline items
  const timelineItems = [
    ...corrections.map((c) => ({
      id: c.id,
      date: c.created_at ?? '',
      type: c.type === 'question' ? ('question' as const) : ('correction' as const),
      clientMessage: c.message,
      clientName: c.client_name,
      status: c.status,
      managerResponse: c.manager_response,
      respondedAt: c.responded_at,
    })),
    ...resolvedProposals.map((p: any) => ({
      id: p.id,
      date: p.created_at ?? '',
      type: 'proposal' as const,
      clientMessage: p.client_message,
      clientName: p.client_name,
      status: p.status,
      managerNotes: p.manager_notes,
      items: p.proposal_items ?? [],
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasHistory = timelineItems.length > 0;

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
          Pytania i uwagi
        </h2>

        {/* ── Form tabs ── */}
        {!actionsDisabled && (
        <Tabs defaultValue="question" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="question" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Mam pytanie
            </TabsTrigger>
            <TabsTrigger value="correction" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Zgłoś korektę
            </TabsTrigger>
          </TabsList>

          <TabsContent value="question" className="mt-4 space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Twoje imię (opcjonalne)"
              className="rounded-xl"
              style={{
                backgroundColor: 'var(--theme-bg, #FAF7F2)',
                borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 20%, transparent)',
                color: 'var(--theme-text, #1A1A1A)',
              }}
            />
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Wpisz pytanie dotyczące oferty... np. Czy jest możliwość zamiany zupy?"
              className="min-h-[120px] resize-none rounded-2xl border p-5 font-body text-base"
              style={{
                backgroundColor: 'var(--theme-bg, #FAF7F2)',
                borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 20%, transparent)',
                color: 'var(--theme-text, #1A1A1A)',
              }}
            />
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitMessage.isPending || !message.trim()}
                onClick={() => handleSubmit('question')}
                className="inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-body font-semibold tracking-wide transition-all disabled:opacity-50"
                style={{
                  borderColor: 'var(--theme-primary, #1A1A1A)',
                  color: 'var(--theme-primary, #1A1A1A)',
                }}
              >
                <Send className="h-4 w-4" />
                Wyślij pytanie
              </motion.button>
            </div>
          </TabsContent>

          <TabsContent value="correction" className="mt-4 space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Twoje imię (opcjonalne)"
              className="rounded-xl"
              style={{
                backgroundColor: 'var(--theme-bg, #FAF7F2)',
                borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 20%, transparent)',
                color: 'var(--theme-text, #1A1A1A)',
              }}
            />
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Opisz jakie zmiany proponujesz... np. Proszę zmienić datę na 20 marca"
              className="min-h-[120px] resize-none rounded-2xl border p-5 font-body text-base"
              style={{
                backgroundColor: 'var(--theme-bg, #FAF7F2)',
                borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 20%, transparent)',
                color: 'var(--theme-text, #1A1A1A)',
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitMessage.isPending || !message.trim()}
                onClick={() => handleSubmit('correction')}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-body font-semibold tracking-wide text-white transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--theme-primary, #1A1A1A)',
                }}
              >
                <Send className="h-4 w-4" />
                Wyślij korektę
              </motion.button>
              <p className="text-xs text-center opacity-60 font-body" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                Korekta zmieni status oferty na &quot;do przejrzenia&quot; — manager zobaczy ją priorytetowo.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        )}

        {/* ── Timeline ── */}
        {hasHistory && (
          <div className="mt-12 space-y-6">
            <h3
              className="text-center font-display text-xl font-bold"
              style={{ color: 'var(--theme-text, #1A1A1A)' }}
            >
              Historia komunikacji
            </h3>

            <div className="space-y-4">
              {timelineItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 15%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--theme-bg, #FAF7F2) 50%, white)',
                  }}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    {item.type === 'question' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        💬 Pytanie
                      </Badge>
                    )}
                    {item.type === 'correction' && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        📝 Korekta
                      </Badge>
                    )}
                    {item.type === 'proposal' && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        🔄 Propozycja zmian
                      </Badge>
                    )}
                    <span className="text-xs opacity-50 font-body" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                      {item.date ? format(new Date(item.date), 'dd.MM.yyyy, HH:mm', { locale: pl }) : ''}
                    </span>
                    {item.clientName && (
                      <span className="text-xs font-medium opacity-70" style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                        — {item.clientName}
                      </span>
                    )}
                  </div>

                  {/* Client message */}
                  {item.clientMessage && (
                    <div
                      className="mb-3 rounded-xl p-4 font-body text-sm"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 5%, transparent)',
                        color: 'var(--theme-text, #1A1A1A)',
                      }}
                    >
                      {item.clientMessage}
                    </div>
                  )}

                  {/* Status / Response */}
                  {item.type !== 'proposal' && (
                    <>
                      {item.status === 'new' || item.status === 'read' ? (
                        <Badge variant="outline" className="text-xs">
                          ⏳ Oczekuje na odpowiedź
                        </Badge>
                      ) : item.status === 'resolved' && item.managerResponse ? (
                        <div
                          className="rounded-xl border-l-4 p-4 font-body text-sm"
                          style={{
                            borderColor: 'var(--theme-primary, #1A1A1A)',
                            backgroundColor: 'color-mix(in srgb, var(--theme-primary, #1A1A1A) 3%, white)',
                            color: 'var(--theme-text, #1A1A1A)',
                          }}
                        >
                          <p className="mb-1 text-xs font-semibold opacity-60">Odpowiedź:</p>
                          <p>{item.managerResponse}</p>
                          {item.respondedAt && (
                            <p className="mt-2 text-xs opacity-40">
                              {format(new Date(item.respondedAt), 'dd.MM.yyyy, HH:mm', { locale: pl })}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* Proposal items */}
                  {item.type === 'proposal' && (
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className={
                          item.status === 'accepted'
                            ? 'bg-green-50 text-green-700'
                            : item.status === 'rejected'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-yellow-50 text-yellow-700'
                        }
                      >
                        {item.status === 'accepted'
                          ? '✅ Zaakceptowana'
                          : item.status === 'rejected'
                            ? '❌ Odrzucona'
                            : '⚡ Częściowo zaakceptowana'}
                      </Badge>

                      {(item as any).items?.map((pi: any) => (
                        <div key={pi.id} className="flex items-center gap-2 text-sm font-body pl-2">
                          <span>{pi.status === 'accepted' ? '✅' : pi.status === 'rejected' ? '❌' : '⏳'}</span>
                          <span style={{ color: 'var(--theme-text, #1A1A1A)' }}>
                            {pi.dishes?.display_name ?? '—'}
                            {pi.proposed_dishes?.display_name && ` → ${pi.proposed_dishes.display_name}`}
                          </span>
                          {pi.manager_note && (
                            <span className="text-xs opacity-50 italic">({pi.manager_note})</span>
                          )}
                        </div>
                      ))}

                      {(item as any).managerNotes && (
                        <div
                          className="mt-2 rounded-xl border-l-4 p-3 text-sm font-body"
                          style={{
                            borderColor: 'var(--theme-primary, #1A1A1A)',
                            color: 'var(--theme-text, #1A1A1A)',
                          }}
                        >
                          <p className="text-xs font-semibold opacity-60 mb-1">Komentarz managera:</p>
                          {(item as any).managerNotes}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
};
