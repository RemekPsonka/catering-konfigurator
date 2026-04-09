import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Save, CheckCircle, Send, RefreshCw, BookTemplate, Link2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';
import { getItemPrice } from '@/hooks/use-offer-variants';
import { SaveTemplateDialog } from '@/components/features/offers/save-template-dialog';
import { OfferValidationPanel } from './offer-validation-panel';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import type { Tables } from '@/integrations/supabase/types';
import type { ClientRequirement } from '@/components/features/offers/requirements-sidebar';

interface StepPreviewProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
  requirements?: ClientRequirement[];
  inquiryText?: string;
  onGoToStep?: (step: number) => void;
}

type FullOffer = Tables<'offers'> & {
  clients: { name: string; email: string | null } | null;
  offer_themes: Tables<'offer_themes'> | null;
};

export const StepPreview = ({ offerId, pricingMode, peopleCount, requirements = [], inquiryText = '', onGoToStep }: StepPreviewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [publicLink, setPublicLink] = useState('');

  const offerQuery = useQuery({
    queryKey: ['offer-preview', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('*, clients(name, email), offer_themes(*)')
        .eq('id', offerId)
        .single();
      if (error) throw error;
      return data as unknown as FullOffer;
    },
    enabled: !!offerId,
  });

  const variantsQuery = useQuery({
    queryKey: ['offer-variants', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_variants')
        .select('*, variant_items(*, dishes(display_name, price_per_person, price_per_piece, price_per_kg, price_per_set, unit_type, is_modifiable))')
        .eq('offer_id', offerId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const servicesQuery = useQuery({
    queryKey: ['offer-services', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_services')
        .select('*, services(*)')
        .eq('offer_id', offerId);
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const termsQuery = useQuery({
    queryKey: ['offer-terms-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_terms')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as Tables<'offer_terms'>[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status, sentAt }: { status: string; sentAt?: string }) => {
      if (!offerId) throw new Error('Brak offerId');
      const update: { status: string; sent_at?: string } = { status };
      if (sentAt) update.sent_at = sentAt;
      const { error } = await supabase.from('offers').update(update as { status: 'draft' }).eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
    onError: () => toast.error('Nie udało się zmienić statusu oferty'),
  });

  const offer = offerQuery.data;
  const theme = offer?.offer_themes;
  const variants = variantsQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const terms = termsQuery.data ?? [];
  const displayMode = offer?.price_display_mode ?? 'PER_PERSON_AND_TOTAL';

  const totals = calculateOfferTotals(
    pricingMode,
    peopleCount,
    variants as never[],
    services as never[],
    Number(offer?.discount_percent ?? 0),
    Number(offer?.discount_value ?? 0),
    Number(offer?.delivery_cost ?? 0),
  );

  const isLoading = offerQuery.isLoading || variantsQuery.isLoading || servicesQuery.isLoading;
  if (isLoading) return <LoadingSpinner />;

  const handleSaveDraft = () => {
    statusMutation.mutate({ status: 'draft' }, {
      onSuccess: () => { toast.success('Szkic zapisany'); navigate('/admin/offers'); },
    });
  };

  const handleMarkReady = () => {
    statusMutation.mutate({ status: 'ready' }, {
      onSuccess: () => { toast.success('Oferta oznaczona jako gotowa'); navigate('/admin/offers'); },
    });
  };

  const handleSaveAndShowLink = () => {
    statusMutation.mutate({ status: 'ready' }, {
      onSuccess: () => {
        const link = `${window.location.origin}/offer/${offer?.public_token}`;
        setPublicLink(link);
        setLinkDialogOpen(true);
        toast.success('Oferta zapisana jako gotowa');
      },
    });
  };

  const handleSend = () => {
    const clientEmail = offer?.clients?.email;
    if (!clientEmail) {
      toast.error('Klient nie ma przypisanego adresu email. Uzupełnij dane klienta.');
      return;
    }
    statusMutation.mutate({ status: 'sent', sentAt: new Date().toISOString() }, {
      onSuccess: () => {
        const publicUrl = `${window.location.origin}/offer/${offer?.public_token}`;
        // eslint-disable-next-line no-console
        console.log('Email wysłany do:', clientEmail, 'Link:', publicUrl);
        toast.success('Oferta wysłana!');
        navigate('/admin/offers');
      },
    });
  };

  const dm = displayMode as string;
  const showPrices = dm !== 'HIDDEN';
  const showDetailed = dm === 'DETAILED';
  const showPerPerson = dm === 'PER_PERSON_AND_TOTAL' || dm === 'PER_PERSON_ONLY';
  const showTotal = dm === 'PER_PERSON_AND_TOTAL' || dm === 'TOTAL_ONLY' || dm === 'DETAILED';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Podgląd oferty</h2>
        <p className="text-sm text-muted-foreground">Tak będzie wyglądać oferta dla klienta (wersja uproszczona MVP).</p>
      </div>

      {/* Themed preview */}
      <Card className="overflow-hidden">
        <div
          style={{
            backgroundColor: theme?.background_color ?? '#ffffff',
            color: theme?.text_color ?? '#333333',
            fontFamily: theme?.font_family ?? 'sans-serif',
          }}
        >
          {/* Header */}
          <div className="p-8 pb-4">
            <div className="h-1 w-full rounded mb-6" style={{ backgroundColor: theme?.accent_color ?? '#ccc' }} />
            <h2
              className="text-3xl font-bold mb-2"
              style={{
                fontFamily: theme?.header_font || theme?.font_family || 'sans-serif',
                color: theme?.primary_color ?? '#333',
              }}
            >
              Oferta cateringowa
            </h2>
            <p className="text-sm opacity-60">
              {offer?.offer_number} &bull; Ważna do: {offer?.valid_until ?? '—'}
            </p>
          </div>

          {/* Greeting */}
          {offer?.greeting_text && (
            <div className="px-8 pb-6">
              <p className="text-sm leading-relaxed">{offer.greeting_text}</p>
            </div>
          )}

          <Separator />

          {/* Variants */}
          <div className="px-8 py-6 space-y-6">
            {variants.map((variant) => {
              const vTotal = totals.variantTotals.find((vt) => vt.id === variant.id);
              return (
                <div key={variant.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold" style={{ color: theme?.primary_color ?? '#333' }}>
                      {variant.name}
                    </h3>
                    {variant.is_recommended && <Badge variant="secondary">Polecany</Badge>}
                  </div>
                  <div className="space-y-1">
                    {(variant as { variant_items: Array<{ id: string; quantity: number | null; custom_name: string | null; dishes: { display_name: string; is_modifiable: boolean | null; unit_type: string }; }> }).variant_items?.map((item: { id: string; quantity: number | null; custom_name: string | null; dishes: { display_name: string; is_modifiable: boolean | null; unit_type: string } }) => (
                      <div key={item.id} className="flex items-center justify-between text-sm py-1">
                        <span>
                          {item.custom_name || item.dishes.display_name}
                          {item.dishes.is_modifiable && ' 🔄'}
                        </span>
                        {showDetailed && (
                          <span className="text-xs opacity-60">
                            × {item.quantity ?? 1} — {formatCurrency(getItemPrice(item as never))}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {showPrices && vTotal && (
                    <div className="mt-3 pt-2 border-t text-sm font-medium flex justify-between" style={{ borderColor: theme?.accent_color ?? '#eee' }}>
                      {showPerPerson && <span>{formatCurrency(vTotal.perPerson)} / os</span>}
                      {showTotal && <span>{formatCurrency(vTotal.total)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Services */}
          {showPrices && services.length > 0 && (
            <>
              <Separator />
              <div className="px-8 py-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: theme?.primary_color ?? '#333' }}>Usługi dodatkowe</h3>
                <div className="space-y-1">
                  {services.map((os) => (
                    <div key={os.id} className="flex justify-between text-sm">
                      <span>{(os as unknown as { services: { name: string } }).services.name} × {os.quantity ?? 1}</span>
                      {showDetailed && (
                        <span>{formatCurrency((os.custom_price != null ? Number(os.custom_price) : (os as unknown as { services: { price: number } }).services.price) * (os.quantity ?? 1))}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Summary */}
          {showPrices && (
            <>
              <Separator />
              <div className="px-8 py-6">
                {displayMode === 'HIDDEN' ? (
                  <p className="text-sm italic">Cena do ustalenia indywidualnie</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    {showDetailed && totals.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Rabat</span>
                        <span className="text-destructive">-{formatCurrency(totals.discountAmount)}</span>
                      </div>
                    )}
                    {showTotal && (
                      <div className="flex justify-between font-bold text-base pt-2">
                        <span>Łącznie</span>
                        <span style={{ color: theme?.primary_color ?? '#333' }}>{formatCurrency(totals.grandTotal)}</span>
                      </div>
                    )}
                    {showPerPerson && (
                      <div className="flex justify-between text-xs opacity-70">
                        <span>Cena za osobę</span>
                        <span>{formatCurrency(totals.pricePerPerson)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Terms */}
          {terms.length > 0 && (
            <>
              <Separator />
              <div className="px-8 py-6">
                <h3 className="text-sm font-semibold mb-2" style={{ color: theme?.primary_color ?? '#333' }}>Warunki</h3>
                <ul className="space-y-1">
                  {terms.map((term) => (
                    <li key={term.id} className="text-xs opacity-70">
                      <span className="font-medium">{term.label}:</span> {term.value}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Client notes */}
          {offer?.notes_client && (
            <>
              <Separator />
              <div className="px-8 py-6">
                <p className="text-xs opacity-70">{offer.notes_client}</p>
              </div>
            </>
          )}

          <div className="h-1 w-full" style={{ backgroundColor: theme?.accent_color ?? '#ccc' }} />
        </div>
      </Card>

      {/* AI Validation */}
      {requirements.length > 0 && (
        <OfferValidationPanel
          offerId={offerId}
          requirements={requirements}
          inquiryText={inquiryText}
          eventType={offer?.event_type ?? ''}
          eventDate={offer?.event_date ?? null}
          peopleCount={peopleCount}
          pricingMode={pricingMode}
          variantsSummary={variants.map((v) => `${v.name} (${(v as { variant_items: unknown[] }).variant_items?.length ?? 0} dań)`).join(', ')}
          servicesSummary={services.map((os) => (os as unknown as { services: { name: string } }).services.name).join(', ') || 'Brak'}
          totalValue={totals.grandTotal}
          pricePerPerson={totals.pricePerPerson}
          discountInfo={
            Number(offer?.discount_percent ?? 0) > 0
              ? `${offer?.discount_percent}%`
              : Number(offer?.discount_value ?? 0) > 0
                ? `${offer?.discount_value} zł`
                : 'Brak'
          }
          budgetInfo={
            requirements.find((r) => r.category === 'budget')?.text ?? ''
          }
          onGoToStep={onGoToStep}
        />
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end pt-4 border-t">
        {offerId && (
          <Button variant="ghost" onClick={() => setTemplateDialogOpen(true)}>
            <BookTemplate className="mr-2 h-4 w-4" />
            Zapisz jako szablon
          </Button>
        )}
        <Button variant="outline" onClick={handleSaveDraft} disabled={statusMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Zapisz szkic
        </Button>
        <Button variant="secondary" onClick={handleMarkReady} disabled={statusMutation.isPending}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Oznacz jako gotowa
        </Button>
        <Button onClick={handleSend} disabled={statusMutation.isPending}>
          <Send className="mr-2 h-4 w-4" />
          Wyślij do klienta
        </Button>
      </div>

      {offerId && (
        <SaveTemplateDialog
          offerId={offerId}
          eventType={offer?.event_type ?? ''}
          pricingMode={pricingMode}
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
        />
      )}
    </div>
  );
};
