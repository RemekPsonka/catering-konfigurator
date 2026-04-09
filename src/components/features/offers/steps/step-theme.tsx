import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface StepThemeProps {
  offerId: string | null;
  eventType: string;
}

export const StepTheme = ({ offerId, eventType }: StepThemeProps) => {
  const queryClient = useQueryClient();

  const themesQuery = useQuery({
    queryKey: ['offer-themes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offer_themes').select('*');
      if (error) throw error;
      return data as Tables<'offer_themes'>[];
    },
  });

  const currentThemeQuery = useQuery({
    queryKey: ['offer-theme', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('theme_id')
        .eq('id', offerId)
        .single();
      if (error) throw error;
      return data.theme_id;
    },
    enabled: !!offerId,
  });

  const selectedThemeId = currentThemeQuery.data ?? eventType;

  const updateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      if (!offerId) throw new Error('Brak offerId');
      const { error } = await supabase
        .from('offers')
        .update({ theme_id: themeId })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-theme', offerId] });
      toast.success('Motyw zaktualizowany');
    },
    onError: () => toast.error('Nie udało się zmienić motywu'),
  });

  const selectedTheme = themesQuery.data?.find((t) => t.id === selectedThemeId);

  if (themesQuery.isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Motyw graficzny</h2>
        <p className="text-sm text-muted-foreground">Wybierz motyw kolorystyczny oferty. Domyślny motyw jest dopasowany do typu imprezy.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {themesQuery.data?.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
          return (
            <Card
              key={theme.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md relative',
                isSelected && 'ring-2 ring-primary shadow-md',
              )}
              onClick={() => updateThemeMutation.mutate(theme.id)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: theme.primary_color }} />
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: theme.secondary_color }} />
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: theme.accent_color }} />
                </div>
                <div>
                  <p className="font-medium text-sm">{theme.name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">{theme.mood}</Badge>
                </div>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: theme.font_family }}>
                  {theme.font_family}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTheme && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <div
              className="p-8 space-y-4"
              style={{
                backgroundColor: selectedTheme.background_color,
                color: selectedTheme.text_color,
                fontFamily: selectedTheme.font_family,
              }}
            >
              <div className="h-1 w-full rounded" style={{ backgroundColor: selectedTheme.accent_color }} />
              <h3
                className="text-2xl font-bold"
                style={{
                  fontFamily: selectedTheme.header_font || selectedTheme.font_family,
                  color: selectedTheme.primary_color,
                }}
              >
                Oferta cateringowa
              </h3>
              <p className="text-sm opacity-80">
                Szanowni Państwo, z przyjemnością prezentujemy ofertę cateringową przygotowaną specjalnie dla Państwa.
              </p>
              <div className="flex gap-4 pt-2">
                <div className="h-10 flex-1 rounded" style={{ backgroundColor: selectedTheme.primary_color, opacity: 0.15 }} />
                <div className="h-10 flex-1 rounded" style={{ backgroundColor: selectedTheme.secondary_color, opacity: 0.2 }} />
              </div>
              <div className="h-1 w-24 rounded" style={{ backgroundColor: selectedTheme.accent_color }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
