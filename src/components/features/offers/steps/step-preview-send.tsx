import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Settings, Palette, Bot, Send, Link2, Copy, ExternalLink, Mail, Save, BookTemplate, ChevronDown, Eye, Trophy, XCircle, Unlock, CheckCircle, AlertTriangle, Info, Check, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';
import { getDishPrice } from '@/hooks/use-offer-variants';

const getPreviewItemPrice = (item: PreviewVariantItem): number => {
  if (item.custom_price != null) return Number(item.custom_price);
  const d = item.dishes;
  switch (d.unit_type) {
    case 'PERSON': return d.price_per_person ?? 0;
    case 'PIECE': return d.price_per_piece ?? 0;
    case 'KG': return d.price_per_kg ?? 0;
    case 'SET': return d.price_per_set ?? 0;
    default: return 0;
  }
};
import { buildPublicOfferUrl } from '@/lib/constants';
import { buildRichOfferEmail } from '@/lib/email-templates';
import { SaveTemplateDialog } from '@/components/features/offers/save-template-dialog';
import { OfferValidationPanel } from './offer-validation-panel';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import type { Tables, Enums } from '@/integrations/supabase/types';
import type { ClientRequirement } from '@/components/features/offers/requirements-sidebar';

interface StepPreviewSendProps {
  offerId: string | null;
  pricingMode: string;
  peopleCount: number;
  requirements?: ClientRequirement[];
  inquiryText?: string;
  onGoToStep?: (step: number) => void;
  isLocked?: boolean;
}

type PriceDisplayMode = Enums<'price_display_mode'>;
type FullOffer = Tables<'offers'> & {
  clients: { name: string; email: string | null } | null;
  offer_themes: Tables<'offer_themes'> | null;
};
type OfferServiceJoined = Tables<'offer_services'> & { services: Tables<'services'> };

// Use a simple inline type that matches the query select — avoids TS mismatch with VariantItemWithDish
interface PreviewVariantItem {
  id: string;
  quantity: number | null;
  custom_name: string | null;
  custom_price: number | null;
  selected_variant_option: string | null;
  dishes: {
    display_name: string;
    price_per_person: number | null;
    price_per_piece: number | null;
    price_per_kg: number | null;
    price_per_set: number | null;
    unit_type: string;
    is_modifiable: boolean | null;
  };
}
interface PreviewVariant {
  id: string;
  name: string;
  is_recommended: boolean | null;
  sort_order: number | null;
  variant_items: PreviewVariantItem[];
}

const DISPLAY_MODE_OPTIONS: { value: PriceDisplayMode; label: string; description: string }[] = [
  { value: 'DETAILED', label: 'Szczegółowy', description: 'Cena każdego dania, usługi, dostawy, rabat, łącznie' },
  { value: 'PER_PERSON_AND_TOTAL', label: 'Za osobę + łącznie', description: 'Cena za osobę per wariant + kwota łączna' },
  { value: 'TOTAL_ONLY', label: 'Tylko łącznie', description: 'Tylko jedna kwota za całą ofertę' },
  { value: 'PER_PERSON_ONLY', label: 'Tylko za osobę', description: 'Tylko cena za osobę per wariant' },
  { value: 'HIDDEN', label: 'Ceny ukryte', description: '„Cena do ustalenia indywidualnie"' },
];

export const StepPreviewSend = ({ offerId, pricingMode, peopleCount, requirements = [], inquiryText = '', onGoToStep, isLocked = false }: StepPreviewSendProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailText, setEmailText] = useState('');

  // Collapsible states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  // ── Data queries ──
  const offerQuery = useQuery({
    queryKey: ['offer-preview', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase.from('offers').select('*, clients(name, email), offer_themes(*)').eq('id', offerId).single();
      if (error) throw error;
      return data as FullOffer;
    },
    enabled: !!offerId,
  });

  const variantsQuery = useQuery({
    queryKey: ['offer-variants', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase.from('offer_variants').select('*, variant_items!variant_items_variant_id_fkey(*, dishes(display_name, price_per_person, price_per_piece, price_per_kg, price_per_set, unit_type, is_modifiable))').eq('offer_id', offerId).order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const servicesQuery = useQuery({
    queryKey: ['offer-services', offerId],
    queryFn: async () => {
      if (!offerId) return [];
      const { data, error } = await supabase.from('offer_services').select('*, services(*)').eq('offer_id', offerId);
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const termsQuery = useQuery({
    queryKey: ['offer-terms-active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offer_terms').select('*').eq('is_active', true).order('display_order');
      if (error) throw error;
      return data as Tables<'offer_terms'>[];
    },
  });

  const themesQuery = useQuery({
    queryKey: ['offer-themes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offer_themes').select('*');
      if (error) throw error;
      return data as Tables<'offer_themes'>[];
    },
  });

  const upsellSelectionsQuery = useQuery({
    queryKey: ['offer-upsell-selections', offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_upsell_selections')
        .select('*, upsell_items(name, emoji)')
        .eq('offer_id', offerId!)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const offer = offerQuery.data;
  const theme = offer?.offer_themes;
  const variants = (variantsQuery.data ?? []) as PreviewVariant[];
  const services = (servicesQuery.data ?? []) as OfferServiceJoined[];
  const terms = termsQuery.data ?? [];
  const upsellSelections = upsellSelectionsQuery.data ?? [];

  // ── Settings state ──
  const [displayMode, setDisplayMode] = useState<PriceDisplayMode>('PER_PERSON_AND_TOTAL');
  const [minPrice, setMinPrice] = useState('');
  const [peopleEditable, setPeopleEditable] = useState(false);
  const [upsellEnabled, setUpsellEnabled] = useState(true);
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (offer && !settingsLoaded) {
      setDisplayMode(offer.price_display_mode as PriceDisplayMode);
      setMinPrice(offer.min_offer_price ? String(offer.min_offer_price) : '');
      setPeopleEditable(offer.is_people_count_editable ?? false);
      setUpsellEnabled(offer.upsell_enabled ?? true);
      setFollowUpEnabled(offer.follow_up_enabled ?? true);
      setSettingsLoaded(true);
    }
  }, [offer, settingsLoaded]);

  // Auto-save settings
  const settingsPayload = useMemo(() => ({
    price_display_mode: displayMode,
    min_offer_price: minPrice ? parseFloat(minPrice) : null,
    is_people_count_editable: peopleEditable,
    upsell_enabled: upsellEnabled,
    follow_up_enabled: followUpEnabled,
  }), [displayMode, minPrice, peopleEditable, upsellEnabled, followUpEnabled]);

  const debouncedSettings = useDebounce(settingsPayload, 600);
  const prevSettingsRef = useRef(debouncedSettings);

  useEffect(() => {
    if (!settingsLoaded || !offerId) return;
    if (prevSettingsRef.current === debouncedSettings) return;
    prevSettingsRef.current = debouncedSettings;
    supabase.from('offers').update(debouncedSettings).eq('id', offerId).then(({ error }) => {
      if (error) toast.error('Nie udało się zapisać ustawień');
    });
  }, [debouncedSettings, settingsLoaded, offerId]);

  // ── Text fields state ──
  const [greetingText, setGreetingText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [notesClient, setNotesClient] = useState('');
  const [textsLoaded, setTextsLoaded] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (offer && !textsLoaded) {
      setGreetingText(offer.greeting_text ?? '');
      setAiSummary(offer.ai_summary ?? '');
      setNotesClient(offer.notes_client ?? '');
      setTextsLoaded(true);
    }
  }, [offer, textsLoaded]);

  // Auto-save text fields
  const textPayload = useMemo(() => ({
    greeting_text: greetingText || null,
    ai_summary: aiSummary || null,
    notes_client: notesClient || null,
  }), [greetingText, aiSummary, notesClient]);

  const debouncedTexts = useDebounce(textPayload, 800);
  const prevTextsRef = useRef(debouncedTexts);

  useEffect(() => {
    if (!textsLoaded || !offerId) return;
    if (prevTextsRef.current === debouncedTexts) return;
    prevTextsRef.current = debouncedTexts;
    supabase.from('offers').update(debouncedTexts).eq('id', offerId).then(({ error }) => {
      if (error) toast.error('Nie udało się zapisać tekstów');
      else queryClient.invalidateQueries({ queryKey: ['offer-preview', offerId] });
    });
  }, [debouncedTexts, textsLoaded, offerId, queryClient]);

  // ── Theme mutation ──
  const updateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      if (!offerId) throw new Error('Brak offerId');
      const { error } = await supabase.from('offers').update({ theme_id: themeId }).eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-preview', offerId] });
      toast.success('Motyw zaktualizowany');
    },
    onError: () => toast.error('Nie udało się zmienić motywu'),
  });

  // ── AI summary ──
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const eventTypeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === offer?.event_type)?.label ?? offer?.event_type;
      const pricingModeLabel = pricingMode === 'PER_PERSON' ? 'per person' : 'ilości stałe';
      const variantsSummary = variants.map((v) => {
        const dishes = v.variant_items.map((item) => `${item.custom_name || item.dishes?.display_name || '?'} (${getPreviewItemPrice(item)} zł)`).join(', ');
        return `${v.name}: ${dishes || 'brak dań'}`;
      }).join(' | ');
      const servicesSummary = services.map((os) => `${os.services.name} (${os.custom_price ?? os.services.price} zł × ${os.quantity ?? 1})`).join(', ');
      const discountInfo = Number(offer?.discount_percent ?? 0) > 0 ? `Rabat: ${offer?.discount_percent}%` : Number(offer?.discount_value ?? 0) > 0 ? `Rabat: ${offer?.discount_value} zł` : null;

      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { inquiry_text: inquiryText, event_type_label: eventTypeLabel, variants_summary: variantsSummary, total_value: totals.grandTotal, services_summary: servicesSummary, people_count: peopleCount, event_date: offer?.event_date, client_name: offer?.clients?.name, discount_info: discountInfo, delivery_cost: Number(offer?.delivery_cost ?? 0) > 0 ? offer?.delivery_cost : null, pricing_mode_label: pricingModeLabel },
      });
      if (error) throw error;
      if (data?.summary) { setAiSummary(data.summary); toast.success('Podsumowanie wygenerowane'); }
    } catch {
      toast.error('Nie udało się wygenerować podsumowania');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // ── Calculations ──
  const totals = useMemo(() => {
    return calculateOfferTotals(
      pricingMode, peopleCount, variants as never[], services as never[],
      Number(offer?.discount_percent ?? 0), Number(offer?.discount_value ?? 0), Number(offer?.delivery_cost ?? 0),
    );
  }, [offer, variants, services, pricingMode, peopleCount]);

  // ── Status mutations ──
  const statusMutation = useMutation({
    mutationFn: async ({ status, sentAt }: { status: string; sentAt?: string }) => {
      if (!offerId) throw new Error('Brak offerId');
      const update: { status: string; sent_at?: string } = { status };
      if (sentAt) update.sent_at = sentAt;
      const { error } = await supabase.from('offers').update(update as { status: 'draft' }).eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['offers'] }); },
    onError: () => toast.error('Nie udało się zmienić statusu oferty'),
  });

  const dm = (offer?.price_display_mode ?? displayMode) as string;
  const showPrices = dm !== 'HIDDEN';
  const showDetailed = dm === 'DETAILED';
  const showPerPerson = dm === 'PER_PERSON_AND_TOTAL' || dm === 'PER_PERSON_ONLY';
  const showTotal = dm === 'PER_PERSON_AND_TOTAL' || dm === 'TOTAL_ONLY' || dm === 'DETAILED';

  // ── Handlers ──
  const handleSaveDraft = () => {
    const protectedStatuses = ['sent', 'viewed', 'revision', 'accepted', 'won'];
    if (offer && protectedStatuses.includes(offer.status)) {
      toast.success('Zmiany zapisane');
      navigate('/admin/offers');
      return;
    }
    statusMutation.mutate({ status: 'draft' }, { onSuccess: () => { toast.success('Szkic zapisany'); navigate('/admin/offers'); } });
  };

  const handleSaveAndShowLink = () => {
    statusMutation.mutate({ status: 'ready' }, {
      onSuccess: () => {
        setPublicLink(buildPublicOfferUrl(offer?.public_token ?? ''));
        setLinkDialogOpen(true);
        toast.success('Oferta zapisana jako gotowa');
      },
    });
  };

  const handleMarkReady = () => {
    statusMutation.mutate({ status: 'ready' }, { onSuccess: () => { toast.success('Oferta oznaczona jako gotowa'); navigate('/admin/offers'); } });
  };

  const handleGenerateEmail = () => {
    const clientEmail = offer?.clients?.email;
    const clientName = offer?.clients?.name ?? 'Kliencie';
    if (!clientEmail) { toast.error('Klient nie ma przypisanego adresu email.'); return; }

    statusMutation.mutate({ status: 'ready' }, {
      onSuccess: () => {
        const eventTypeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === offer?.event_type)?.label ?? offer?.event_type ?? '—';
        const variantLines = variants.map((v) => `- ${v.name} (${v.variant_items?.length ?? 0} dań): ${v.variant_items.map((i) => i.custom_name || i.dishes.display_name).join(', ')}`).join('\n');
        const servicesText = services.length > 0 ? `🛎️ Usługi dodatkowe:\n${services.map((os) => `- ${os.services.name} × ${os.quantity ?? 1}`).join('\n')}` : '';
        const text = buildRichOfferEmail({
          clientName, offerNumber: offer?.offer_number ?? '—', publicToken: offer?.public_token ?? '', clientEmail,
          validUntil: offer?.valid_until ?? '—', eventType: eventTypeLabel, eventDate: offer?.event_date ?? '—',
          peopleCount, variantsSummary: variantLines || 'Menu w przygotowaniu', servicesSummary: servicesText, totalValue: formatCurrency(totals.grandTotal),
        });
        setEmailText(text);
        setEmailDialogOpen(true);
        toast.success('Treść emaila wygenerowana');
      },
    });
  };

  const isLoading = offerQuery.isLoading || variantsQuery.isLoading || servicesQuery.isLoading;
  if (isLoading) return <LoadingSpinner />;
  if (!offerId) return <p className="text-muted-foreground text-center py-12">Najpierw zapisz szkic oferty.</p>;

  const selectedThemeId = offer?.theme_id ?? offer?.event_type;
  const selectedTheme = themesQuery.data?.find((t) => t.id === selectedThemeId);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN — settings + theme + preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Settings (collapsed) */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Ustawienia wyświetlania</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <RadioGroup value={displayMode} onValueChange={(v) => setDisplayMode(v as PriceDisplayMode)}>
                    <div className="space-y-2">
                      {DISPLAY_MODE_OPTIONS.map((opt) => (
                        <div key={opt.value} className="flex items-start gap-3">
                          <RadioGroupItem value={opt.value} id={`dm-${opt.value}`} className="mt-1" />
                          <div>
                            <Label htmlFor={`dm-${opt.value}`} className="font-medium cursor-pointer text-sm">{opt.label}</Label>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Cena minimalna</Label>
                      <Input type="number" min={0} step={0.01} placeholder="Brak limitu" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-8" />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Switch checked={peopleEditable} onCheckedChange={setPeopleEditable} />
                      <Label className="text-xs">Klient zmienia liczbę osób</Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <Switch checked={upsellEnabled} onCheckedChange={setUpsellEnabled} />
                    <div>
                      <Label className="text-xs">Pokaż sekcję dosprzedaży klientowi</Label>
                      <p className="text-xs text-muted-foreground">Klient zobaczy sugerowane dodatki na stronie oferty</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t">
                    <Switch checked={followUpEnabled} onCheckedChange={setFollowUpEnabled} />
                    <div>
                      <Label className="text-xs">Automatyczne follow-upy</Label>
                      <p className="text-xs text-muted-foreground">System wyśle automatyczne przypomnienia po wysłaniu oferty</p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Theme (collapsed) */}
          <Collapsible open={themeOpen} onOpenChange={setThemeOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Palette className="h-4 w-4" /> Motyw graficzny
                      {selectedTheme && !themeOpen && <Badge variant="outline" className="text-xs ml-2">{selectedTheme.name}</Badge>}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${themeOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {themesQuery.data?.map((t) => {
                      const isSelected = t.id === selectedThemeId;
                      return (
                        <div
                          key={t.id}
                          className={cn('cursor-pointer rounded-lg border p-3 transition-all hover:shadow-sm relative', isSelected && 'ring-2 ring-primary')}
                          onClick={() => updateThemeMutation.mutate(t.id)}
                        >
                          {isSelected && <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
                          <div className="flex gap-1 mb-2">
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: t.primary_color }} />
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: t.secondary_color }} />
                            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: t.accent_color }} />
                          </div>
                          <p className="text-xs font-medium">{t.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Full preview */}
          <Card className="overflow-hidden">
            <div style={{ backgroundColor: theme?.background_color ?? '#ffffff', color: theme?.text_color ?? '#333333', fontFamily: theme?.font_family ?? 'sans-serif' }}>
              <div className="p-8 pb-4">
                <div className="h-1 w-full rounded mb-6" style={{ backgroundColor: theme?.accent_color ?? '#ccc' }} />
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: theme?.header_font || theme?.font_family || 'sans-serif', color: theme?.primary_color ?? '#333' }}>
                  Oferta cateringowa
                </h2>
                <p className="text-sm opacity-60">{offer?.offer_number} &bull; Ważna do: {offer?.valid_until ?? '—'}</p>
              </div>
              {offer?.greeting_text && <div className="px-8 pb-6"><p className="text-sm leading-relaxed">{offer.greeting_text}</p></div>}
              <Separator />
              <div className="px-8 py-6 space-y-6">
                {variants.map((variant) => {
                  const vTotal = totals.variantTotals.find((vt) => vt.id === variant.id);
                  return (
                    <div key={variant.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold" style={{ color: theme?.primary_color ?? '#333' }}>{variant.name}</h3>
                        {variant.is_recommended && <Badge variant="secondary">Polecany</Badge>}
                      </div>
                      <div className="space-y-1">
                        {variant.variant_items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm py-1">
                            <span>
                              {item.custom_name || item.dishes.display_name}
                              {item.selected_variant_option && <span className="text-xs text-emerald-600 ml-1">✓ {item.selected_variant_option}</span>}
                              {item.dishes.is_modifiable && ' 🔄'}
                            </span>
                            {showDetailed && <span className="text-xs opacity-60">× {item.quantity ?? 1} — {formatCurrency(getPreviewItemPrice(item))}</span>}
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
              {showPrices && services.length > 0 && (
                <>
                  <Separator />
                  <div className="px-8 py-6">
                    <h3 className="text-lg font-semibold mb-3" style={{ color: theme?.primary_color ?? '#333' }}>Usługi dodatkowe</h3>
                    <div className="space-y-1">
                      {services.map((os) => (
                        <div key={os.id} className="flex justify-between text-sm">
                          <span>{os.services.name} × {os.quantity ?? 1}</span>
                          {showDetailed && <span>{formatCurrency((os.custom_price != null ? Number(os.custom_price) : os.services.price) * (os.quantity ?? 1))}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {showPrices && (
                <>
                  <Separator />
                  <div className="px-8 py-6">
                    <div className="space-y-1 text-sm">
                      {showDetailed && totals.discountAmount > 0 && (
                        <div className="flex justify-between"><span>Rabat</span><span className="text-destructive">-{formatCurrency(totals.discountAmount)}</span></div>
                      )}
                      {showTotal && (
                        <div className="flex justify-between font-bold text-base pt-2"><span>Łącznie</span><span style={{ color: theme?.primary_color ?? '#333' }}>{formatCurrency(totals.grandTotal)}</span></div>
                      )}
                      {showPerPerson && (
                        <div className="flex justify-between text-xs opacity-70"><span>Cena za osobę</span><span>{formatCurrency(totals.pricePerPerson)}</span></div>
                      )}
                    </div>
                  </div>
                </>
              )}
              {upsellSelections.length > 0 && (
                <>
                  <Separator />
                  <div className="px-8 py-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: theme?.primary_color ?? '#333' }}>
                      <Gift className="h-4 w-4" /> Dosprzedaż klienta
                    </h3>
                    <div className="space-y-1">
                      {upsellSelections.map((sel) => (
                        <div key={sel.id} className="flex justify-between text-sm">
                          <span>{sel.upsell_items?.emoji ?? '🎁'} {sel.upsell_items?.name ?? '—'} × {sel.quantity}</span>
                          <span>{formatCurrency(Number(sel.total_price))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t flex justify-between text-sm font-medium" style={{ borderColor: theme?.accent_color ?? '#eee' }}>
                      <span>Suma dosprzedaży</span>
                      <span>{formatCurrency(upsellSelections.reduce((sum, s) => sum + Number(s.total_price), 0))}</span>
                    </div>
                    <p className="text-xs opacity-50 mt-1">
                      Dodano: {upsellSelections[0]?.added_at ? new Date(upsellSelections[0].added_at).toLocaleDateString('pl-PL') : '—'}
                    </p>
                  </div>
                </>
              )}
              {terms.length > 0 && (
                <>
                  <Separator />
                  <div className="px-8 py-6">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: theme?.primary_color ?? '#333' }}>Warunki</h3>
                    <ul className="space-y-1">
                      {terms.map((term) => <li key={term.id} className="text-xs opacity-70"><span className="font-medium">{term.label}:</span> {term.value}</li>)}
                    </ul>
                  </div>
                </>
              )}
              {offer?.notes_client && (
                <>
                  <Separator />
                  <div className="px-8 py-6"><p className="text-xs opacity-70">{offer.notes_client}</p></div>
                </>
              )}
              <div className="h-1 w-full" style={{ backgroundColor: theme?.accent_color ?? '#ccc' }} />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN — text fields + validation + actions */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-4 lg:self-start">
          {/* Text fields */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Treść oferty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Powitanie</Label>
                <Textarea value={greetingText} onChange={(e) => setGreetingText(e.target.value)} rows={3} placeholder="Tekst powitania dla klienta..." />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Podsumowanie oferty</Label>
                <Textarea value={aiSummary} onChange={(e) => setAiSummary(e.target.value)} rows={4} placeholder="Automatyczne podsumowanie lub wpisz własne..." />
                <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                  <Bot className="h-4 w-4 mr-2" /> {isGeneratingSummary ? 'Generuję...' : 'Generuj AI'}
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Notatki dla klienta</Label>
                <Textarea value={notesClient} onChange={(e) => setNotesClient(e.target.value)} rows={3} placeholder="Dodatkowe informacje widoczne dla klienta..." />
              </div>
            </CardContent>
          </Card>

          {/* Validation */}
          {requirements.length > 0 && (
            <OfferValidationPanel
              offerId={offerId}
              requirements={requirements}
              inquiryText={inquiryText}
              eventType={offer?.event_type ?? ''}
              eventDate={offer?.event_date ?? null}
              peopleCount={peopleCount}
              pricingMode={pricingMode}
              variantsSummary={variants.map((v) => `${v.name} (${v.variant_items?.length ?? 0} dań)`).join(', ')}
              servicesSummary={services.map((os) => os.services.name).join(', ') || 'Brak'}
              totalValue={totals.grandTotal}
              pricePerPerson={totals.pricePerPerson}
              discountInfo={Number(offer?.discount_percent ?? 0) > 0 ? `${offer?.discount_percent}%` : Number(offer?.discount_value ?? 0) > 0 ? `${offer?.discount_value} zł` : 'Brak'}
              budgetInfo={requirements.find((r) => r.category === 'budget')?.text ?? ''}
              onGoToStep={onGoToStep}
            />
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              {isLocked ? (
                <LockedActions offer={offer} queryClient={queryClient} offerId={offerId} />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={statusMutation.isPending}>
                      <Save className="mr-1 h-4 w-4" /> Zapisz szkic
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleMarkReady} disabled={statusMutation.isPending}>
                      <CheckCircle className="mr-1 h-4 w-4" /> Gotowa
                    </Button>
                  </div>
                  <Button className="w-full" variant="secondary" size="sm" onClick={handleSaveAndShowLink} disabled={statusMutation.isPending}>
                    <Link2 className="mr-2 h-4 w-4" /> Zapisz i pokaż link
                  </Button>
                  <Button className="w-full" size="sm" onClick={handleGenerateEmail} disabled={statusMutation.isPending}>
                    <Mail className="mr-2 h-4 w-4" /> Wygeneruj treść emaila
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button variant="ghost" size="sm" className="w-full" disabled={!offer?.public_token} onClick={() => offer?.public_token && window.open(buildPublicOfferUrl(offer.public_token), '_blank')}>
                              <ExternalLink className="mr-1 h-4 w-4" /> Podgląd
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!offer?.public_token && <TooltipContent>Zapisz ofertę aby zobaczyć podgląd</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="sm" onClick={() => setTemplateDialogOpen(true)}>
                      <BookTemplate className="mr-1 h-4 w-4" /> Szablon
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {offerId && (
        <SaveTemplateDialog offerId={offerId} eventType={offer?.event_type ?? ''} pricingMode={pricingMode} open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} />
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Oferta gotowa!</DialogTitle><DialogDescription>Skopiuj link i wyślij klientowi:</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <Input readOnly value={publicLink} className="font-mono text-sm" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(publicLink); toast.success('Link skopiowany'); }}><Copy className="mr-2 h-4 w-4" /> Kopiuj</Button>
              <Button onClick={() => window.open(publicLink, '_blank')}><ExternalLink className="mr-2 h-4 w-4" /> Otwórz</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Treść emaila do klienta</DialogTitle><DialogDescription>Skopiuj treść i wklej do email:</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <Textarea readOnly value={emailText} className="font-mono text-sm min-h-[400px]" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(emailText); toast.success('Treść skopiowana'); }}><Copy className="mr-2 h-4 w-4" /> Kopiuj</Button>
              <Button onClick={() => {
                const subject = encodeURIComponent(`Oferta cateringowa ${offer?.offer_number ?? ''}`);
                const body = encodeURIComponent(emailText);
                window.open(`mailto:${offer?.clients?.email ?? ''}?subject=${subject}&body=${body}`, '_blank');
              }}><Mail className="mr-2 h-4 w-4" /> Otwórz w email</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ── Locked offer actions ── */
const LockedActions = ({ offer, queryClient, offerId }: { offer: FullOffer | null | undefined; queryClient: ReturnType<typeof useQueryClient>; offerId: string | null }) => {
  const [confirmStatus, setConfirmStatus] = useState<'won' | 'lost' | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const handleStatusChange = async (newStatus: 'won' | 'lost') => {
    if (!offerId) return;
    const { error } = await supabase.from('offers').update({ status: newStatus }).eq('id', offerId);
    if (error) { toast.error('Nie udało się zmienić statusu'); return; }
    toast.success(newStatus === 'won' ? 'Oferta oznaczona jako wygrana!' : 'Oferta oznaczona jako przegrana');
    queryClient.invalidateQueries({ queryKey: ['offer-preview', offerId] });
    queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
    queryClient.invalidateQueries({ queryKey: ['offers'] });
    setConfirmStatus(null);
  };

  const handleUnlock = async () => {
    if (!offerId) return;
    const { error } = await supabase.from('offers').update({ status: 'revision' as const }).eq('id', offerId);
    if (error) { toast.error('Nie udało się odblokować oferty'); return; }
    toast.success('Oferta odblokowana do edycji');
    queryClient.invalidateQueries({ queryKey: ['offer-preview', offerId] });
    queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
    queryClient.invalidateQueries({ queryKey: ['offers'] });
    setUnlockOpen(false);
  };

  return (
    <div className="space-y-2">
      {offer?.status === 'accepted' && (
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => setConfirmStatus('won')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Trophy className="h-4 w-4 mr-1" /> Wygrana
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setConfirmStatus('lost')}>
            <XCircle className="h-4 w-4 mr-1" /> Przegrana
          </Button>
        </div>
      )}
      {offer?.status === 'won' && (
        <Badge className="bg-emerald-100 text-emerald-900 text-sm px-4 py-2 w-full justify-center"><Trophy className="h-4 w-4 mr-2" /> Oferta wygrana</Badge>
      )}
      <Button variant="outline" size="sm" className="w-full" onClick={() => setUnlockOpen(true)}>
        <Unlock className="h-4 w-4 mr-1" /> Odblokuj do edycji
      </Button>
      {offer?.public_token && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => window.open(buildPublicOfferUrl(offer.public_token!), '_blank')}>
          <Eye className="h-4 w-4 mr-1" /> Podgląd klienta
        </Button>
      )}

      <ConfirmDialog open={confirmStatus === 'won'} onOpenChange={(open) => !open && setConfirmStatus(null)} title="Oznacz jako wygrana?" description="Oferta zostanie oznaczona jako wygrana." confirmLabel="Oznacz jako wygrana" onConfirm={() => handleStatusChange('won')} variant="default" />
      <ConfirmDialog open={confirmStatus === 'lost'} onOpenChange={(open) => !open && setConfirmStatus(null)} title="Oznacz jako przegrana?" description="Oferta zostanie oznaczona jako przegrana." confirmLabel="Oznacz jako przegrana" onConfirm={() => handleStatusChange('lost')} variant="destructive" />
      <ConfirmDialog open={unlockOpen} onOpenChange={setUnlockOpen} title="Odblokować ofertę?" description={'Status zostanie zmieniony na „Rewizja".'} confirmLabel="Odblokuj" onConfirm={handleUnlock} variant="default" />
    </div>
  );
};
