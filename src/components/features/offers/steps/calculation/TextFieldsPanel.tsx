import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, MessageSquare, FileText, Lock, Loader2 } from 'lucide-react';

interface TextFieldsPanelProps {
  greetingText: string;
  aiSummary: string;
  notesClient: string;
  notesInternal: string;
  isGenerating: boolean;
  isGeneratingSummary: boolean;
  inquiryText?: string;
  onGreetingChange: (val: string) => void;
  onAiSummaryChange: (val: string) => void;
  onNotesClientChange: (val: string) => void;
  onNotesInternalChange: (val: string) => void;
  onGenerateGreeting: () => void;
  onGenerateSummary: () => void;
}

export const TextFieldsPanel = ({
  greetingText,
  aiSummary,
  notesClient,
  notesInternal,
  isGenerating,
  isGeneratingSummary,
  inquiryText,
  onGreetingChange,
  onAiSummaryChange,
  onNotesClientChange,
  onNotesInternalChange,
  onGenerateGreeting,
  onGenerateSummary,
}: TextFieldsPanelProps) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Tekst powitalny
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={greetingText}
          onChange={(e) => onGreetingChange(e.target.value)}
          placeholder="Tekst powitalny dla klienta..."
          rows={4}
        />
        <Button variant="outline" size="sm" onClick={onGenerateGreeting} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {isGenerating ? 'Generowanie...' : '🤖 Generuj z AI'}
        </Button>
        {!inquiryText && (
          <p className="text-xs text-muted-foreground">
            Podpowiedź: uzupełnij „Treść zapytania" w kroku 1, aby AI wygenerował bardziej spersonalizowany tekst.
          </p>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          Podsumowanie oferty (AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={aiSummary}
          onChange={(e) => onAiSummaryChange(e.target.value)}
          placeholder="Podsumowanie oferty widoczne dla klienta..."
          rows={4}
        />
        <Button variant="outline" size="sm" onClick={onGenerateSummary} disabled={isGeneratingSummary}>
          {isGeneratingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {isGeneratingSummary ? 'Generowanie...' : '🤖 Generuj podsumowanie AI'}
        </Button>
        {!inquiryText && (
          <p className="text-xs text-muted-foreground">
            Podpowiedź: uzupełnij „Treść zapytania" w kroku 1, aby podsumowanie było bardziej trafne.
          </p>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Notatki
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Notatki dla klienta</Label>
          <Textarea
            value={notesClient}
            onChange={(e) => onNotesClientChange(e.target.value)}
            placeholder="Widoczne dla klienta na ofercie..."
            rows={3}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Notatki wewnętrzne
          </Label>
          <Textarea
            value={notesInternal}
            onChange={(e) => onNotesInternalChange(e.target.value)}
            placeholder="Widoczne tylko w panelu admina..."
            rows={3}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">🔒 Nie będą widoczne na ofercie klienta.</p>
        </div>
      </CardContent>
    </Card>
  </>
);
