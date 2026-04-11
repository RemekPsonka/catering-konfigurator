import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle, XCircle, AlertTriangle, HelpCircle,
  Lightbulb, RefreshCw, Loader2, ArrowLeft, ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import type { ClientRequirement } from '@/components/features/offers/requirements-sidebar';

interface ValidationItem {
  requirement_text: string;
  status: 'met' | 'partially_met' | 'not_met' | 'unclear';
  explanation: string;
  suggestion?: string | null;
}

interface ValidationResult {
  validations: ValidationItem[];
  overall_score: string;
  overall_status: 'ready' | 'needs_attention' | 'major_gaps';
  summary: string;
  warnings: string[];
  suggestions: string[];
}

interface OfferValidationPanelProps {
  offerId: string | null;
  requirements: ClientRequirement[];
  inquiryText: string;
  eventType: string;
  eventDate: string | null;
  peopleCount: number;
  pricingMode: string;
  variantsSummary: string;
  servicesSummary: string;
  totalValue: number;
  pricePerPerson: number;
  discountInfo: string;
  budgetInfo: string;
  onGoToStep?: (step: number) => void;
}

const CATEGORY_STEP_MAP: Record<string, number> = {
  menu: 2, dietary: 2, service: 3, logistics: 3, budget: 3, special: 4,
};

const statusConfig = {
  met: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400' },
  partially_met: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400' },
  not_met: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400' },
  unclear: { icon: HelpCircle, bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground' },
};

const overallConfig = {
  ready: { icon: '🟢', label: 'Oferta zgodna z oczekiwaniami klienta', color: 'text-green-700 dark:text-green-400' },
  needs_attention: { icon: '🟡', label: 'Oferta wymaga uwagi', color: 'text-yellow-700 dark:text-yellow-400' },
  major_gaps: { icon: '🔴', label: 'Oferta ma istotne braki — sprawdź wymagania', color: 'text-red-700 dark:text-red-400' },
};

export const OfferValidationPanel = ({
  offerId, requirements, inquiryText, eventType, eventDate,
  peopleCount, pricingMode, variantsSummary, servicesSummary,
  totalValue, pricePerPerson, discountInfo, budgetInfo, onGoToStep,
}: OfferValidationPanelProps) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const hasAutoRun = useRef(false);

  const eventLabel = EVENT_TYPE_OPTIONS.find((e) => e.value === eventType)?.label ?? eventType;

  const runValidation = async () => {
    if (!offerId || requirements.length === 0) return;
    setIsValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-offer', {
        body: {
          requirements,
          inquiry_text: inquiryText,
          event_type: eventLabel,
          event_date: eventDate,
          people_count: peopleCount,
          pricing_mode: pricingMode,
          variants_summary: variantsSummary,
          services_summary: servicesSummary,
          total_value: totalValue,
          price_per_person: pricePerPerson,
          discount_info: discountInfo,
          budget_info: budgetInfo,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const validation = data.validation as ValidationResult;
      setResult(validation);

      // Save to ai_parsed_data
      await supabase.from('offers').update({
        ai_parsed_data: JSON.parse(JSON.stringify({ validation })) as import('@/integrations/supabase/types').Json,
      }).eq('id', offerId);
    } catch (err) {
      toast.error('Nie udało się przeprowadzić walidacji. Sprawdź ręcznie.');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (!hasAutoRun.current && requirements.length > 0 && offerId) {
      hasAutoRun.current = true;
      runValidation();
    }
  }, [offerId, requirements.length]);

  if (requirements.length === 0) return null;

  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Loader2 className="h-5 w-5 animate-spin" />
            Walidacja zgodności z wymaganiami...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Button onClick={runValidation} variant="outline">
            <ShieldCheck className="mr-2 h-4 w-4" />
            🤖 Sprawdź zgodność z wymaganiami
          </Button>
        </CardContent>
      </Card>
    );
  }

  const overall = overallConfig[result.overall_status] ?? overallConfig.needs_attention;
  const metCount = result.validations.filter((v) => v.status === 'met').length;
  const totalCount = result.validations.length;
  const scorePercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-base ${overall.color}`}>
            <span className="text-xl">{overall.icon}</span>
            {overall.label}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={runValidation} disabled={isValidating}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spełnienie wymagań</span>
            <span className="font-medium">{result.overall_score}</span>
          </div>
          <Progress value={scorePercent} className="h-2" />
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground">{result.summary}</p>

        <Separator />

        {/* Validations list */}
        <div className="space-y-2">
          {result.validations.map((v, i) => {
            const cfg = statusConfig[v.status] ?? statusConfig.unclear;
            const Icon = cfg.icon;
            return (
              <div key={i} className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{v.requirement_text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.explanation}</p>
                    {v.suggestion && onGoToStep && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-1 text-xs"
                        onClick={() => {
                          const req = requirements.find((r) => r.text === v.requirement_text);
                          const step = req ? (CATEGORY_STEP_MAP[req.category] ?? 2) : 2;
                          onGoToStep(step);
                        }}
                      >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Popraw: {v.suggestion}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sugestie AI</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
