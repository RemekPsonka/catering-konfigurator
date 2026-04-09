import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Info, Save } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

interface StepSettingsProps {
  offerId: string | null;
  pricingMode: string;
}

type PriceDisplayMode = Enums<'price_display_mode'>;

const DISPLAY_MODE_OPTIONS: { value: PriceDisplayMode; label: string; description: string }[] = [
  {
    value: 'DETAILED',
    label: 'Szczegółowy',
    description: 'Klient widzi cenę każdego dania, usługi, dostawy, rabat, łącznie',
  },
  {
    value: 'PER_PERSON_AND_TOTAL',
    label: 'Za osobę + łącznie',
    description: 'Klient widzi cenę za osobę per wariant + kwotę łączną',
  },
  {
    value: 'TOTAL_ONLY',
    label: 'Tylko łącznie',
    description: 'Klient widzi tylko jedną kwotę za całą ofertę',
  },
  {
    value: 'PER_PERSON_ONLY',
    label: 'Tylko za osobę',
    description: 'Klient widzi tylko cenę za osobę per wariant',
  },
  {
    value: 'HIDDEN',
    label: 'Ceny ukryte',
    description: 'Ceny ukryte — „Cena do ustalenia indywidualnie"',
  },
];

export const StepSettings = ({ offerId, pricingMode }: StepSettingsProps) => {
  const queryClient = useQueryClient();

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer-settings', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('price_display_mode, min_offer_price, is_people_count_editable')
        .eq('id', offerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!offerId,
  });

  const [displayMode, setDisplayMode] = useState<PriceDisplayMode>('PER_PERSON_AND_TOTAL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [peopleEditable, setPeopleEditable] = useState(false);

  useEffect(() => {
    if (offer) {
      setDisplayMode(offer.price_display_mode as PriceDisplayMode);
      setMinPrice(offer.min_offer_price ? String(offer.min_offer_price) : '');
      setPeopleEditable(offer.is_people_count_editable ?? false);
    }
  }, [offer]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!offerId) throw new Error('Brak ID oferty');
      const { error } = await supabase
        .from('offers')
        .update({
          price_display_mode: displayMode,
          min_offer_price: minPrice ? parseFloat(minPrice) : null,
          is_people_count_editable: peopleEditable,
        })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-settings', offerId] });
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      toast.success('Ustawienia zapisane');
    },
    onError: () => {
      toast.error('Nie udało się zapisać ustawień');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!offerId) return <p className="text-muted-foreground">Najpierw zapisz szkic oferty.</p>;

  const selectedOption = DISPLAY_MODE_OPTIONS.find((o) => o.value === displayMode);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tryb wyświetlania cen</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={displayMode} onValueChange={(v) => setDisplayMode(v as PriceDisplayMode)}>
            <div className="space-y-3">
              {DISPLAY_MODE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start gap-3">
                  <RadioGroupItem value={option.value} id={`mode-${option.value}`} className="mt-1" />
                  <div>
                    <Label htmlFor={`mode-${option.value}`} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Cena minimalna oferty
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Jeśli zmiany klienta obniżą cenę poniżej tej kwoty — blokada z ogólnym komunikatem
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Brak limitu"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Opcjonalne. Kwota nie jest widoczna dla klienta.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edytowalność liczby osób</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Switch checked={peopleEditable} onCheckedChange={setPeopleEditable} />
            <div>
              <Label className="font-medium">Klient może zmienić liczbę osób</Label>
              <p className="text-sm text-muted-foreground">
                {pricingMode === 'PER_PERSON'
                  ? 'Zmiana liczby osób przelicza łączną cenę oferty.'
                  : 'Zmiana liczby osób ma charakter informacyjny (ilości dań stałe).'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedOption && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Klient zobaczy ceny w trybie:{' '}
              <Badge variant="secondary">{selectedOption.label}</Badge>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Zapisz ustawienia
        </Button>
      </div>
    </div>
  );
};
