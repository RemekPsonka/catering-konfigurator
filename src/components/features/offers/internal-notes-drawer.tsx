import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Check } from 'lucide-react';

interface InternalNotesDrawerProps {
  offerId: string | null;
}

export const InternalNotesDrawer = ({ offerId }: InternalNotesDrawerProps) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: offer } = useQuery({
    queryKey: ['offer-internal-notes', offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data } = await supabase.from('offers').select('notes_internal').eq('id', offerId).single();
      return data;
    },
    enabled: !!offerId,
  });

  useEffect(() => {
    if (offer?.notes_internal) setNotes(offer.notes_internal);
  }, [offer]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!offerId) return;
      const { error } = await supabase.from('offers').update({ notes_internal: value }).eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['offer-preview', offerId] });
    },
  });

  useEffect(() => {
    if (!offerId) return;
    const timer = setTimeout(() => saveMutation.mutate(notes), 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, offerId]);

  if (!offerId) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <StickyNote className="mr-2 h-4 w-4" />
          Notatki
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notatki wewnętrzne</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Te notatki są widoczne tylko dla Ciebie. Klient ich nie zobaczy.
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={12}
            placeholder="Notatki wewnętrzne dotyczące tej oferty..."
            className="resize-y"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {saved && (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>Zapisano</span>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
