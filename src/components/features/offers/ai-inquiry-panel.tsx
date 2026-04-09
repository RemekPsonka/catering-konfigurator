import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  User, Mail, Phone, Building2, Calendar, Clock, MapPin, Users,
  Truck, Calculator, Check, CheckCheck, Plus, X, Pencil,
  Sparkles, AlertTriangle, DollarSign, StickyNote,
} from 'lucide-react';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import { EVENT_TYPE_OPTIONS, DELIVERY_TYPE_OPTIONS, PRICING_MODE_OPTIONS } from '@/lib/offer-constants';
import type { EventType } from '@/types';

export interface AiParsedData {
  client: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
  event: {
    type: string | null;
    type_confidence: 'high' | 'medium' | 'low';
    date: string | null;
    time_from: string | null;
    time_to: string | null;
    people_count: number | null;
    location: string | null;
    delivery_type: string | null;
  };
  pricing_mode_suggestion: string;
  requirements: Array<{
    text: string;
    category: 'menu' | 'budget' | 'service' | 'logistics' | 'dietary' | 'special';
    priority: 'must' | 'nice_to_have';
  }>;
  budget: {
    per_person: number | null;
    total: number | null;
    currency: string;
  };
  notes: string;
}

export interface ClientRequirement {
  text: string;
  category: string;
  priority: string;
  is_met: boolean | null;
}

interface AiInquiryPanelProps {
  parsedData: AiParsedData;
  form: UseFormReturn<Record<string, unknown>>;
  requirements: ClientRequirement[];
  onRequirementsChange: (reqs: ClientRequirement[]) => void;
  onCreateClient: (data: AiParsedData['client']) => void;
  onUseExistingClient: (clientId: string, clientName: string) => void;
}

const CONFIDENCE_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: '🟢 Pewne', className: 'bg-green-100 text-green-800' },
  medium: { label: '🟡 Prawdopodobne', className: 'bg-yellow-100 text-yellow-800' },
  low: { label: '🔴 Niepewne', className: 'bg-red-100 text-red-800' },
};

const CATEGORY_LABELS: Record<string, { label: string; className: string }> = {
  menu: { label: 'Menu', className: 'bg-orange-100 text-orange-800' },
  budget: { label: 'Budżet', className: 'bg-green-100 text-green-800' },
  service: { label: 'Obsługa', className: 'bg-blue-100 text-blue-800' },
  logistics: { label: 'Logistyka', className: 'bg-purple-100 text-purple-800' },
  dietary: { label: 'Dieta', className: 'bg-pink-100 text-pink-800' },
  special: { label: 'Specjalne', className: 'bg-indigo-100 text-indigo-800' },
};

export const AiInquiryPanel = ({
  parsedData,
  form,
  requirements,
  onRequirementsChange,
  onCreateClient,
  onUseExistingClient,
}: AiInquiryPanelProps) => {
  const [newReqText, setNewReqText] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // Check if client exists by email or phone
  const clientEmail = parsedData.client.email;
  const clientPhone = parsedData.client.phone;

  const existingClientQuery = useQuery({
    queryKey: ['ai-client-match', clientEmail, clientPhone],
    queryFn: async () => {
      if (!clientEmail && !clientPhone) return null;
      let query = supabase.from('clients').select('id, name, email, phone').limit(1);
      if (clientEmail) {
        query = query.eq('email', clientEmail);
      } else if (clientPhone) {
        query = query.eq('phone', clientPhone);
      }
      const { data } = await query;
      return data?.[0] ?? null;
    },
    enabled: !!(clientEmail || clientPhone),
  });

  const existingClient = existingClientQuery.data;

  const applyField = (fieldName: string, value: unknown) => {
    form.setValue(fieldName as never, value as never, { shouldValidate: true });
  };

  const handleApplyAll = () => {
    const e = parsedData.event;
    if (e.type) applyField('event_type', e.type);
    if (e.date) applyField('event_date', e.date);
    if (e.time_from) applyField('event_time_from', e.time_from);
    if (e.time_to) applyField('event_time_to', e.time_to);
    if (e.people_count) applyField('people_count', e.people_count);
    if (e.location) applyField('event_location', e.location);
    if (e.delivery_type) applyField('delivery_type', e.delivery_type);
    if (parsedData.pricing_mode_suggestion) applyField('pricing_mode', parsedData.pricing_mode_suggestion);
  };

  const addRequirement = () => {
    if (!newReqText.trim()) return;
    onRequirementsChange([
      ...requirements,
      { text: newReqText.trim(), category: 'special', priority: 'nice_to_have', is_met: null },
    ]);
    setNewReqText('');
  };

  const removeRequirement = (idx: number) => {
    onRequirementsChange(requirements.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(requirements[idx].text);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const updated = [...requirements];
    updated[editingIdx] = { ...updated[editingIdx], text: editText };
    onRequirementsChange(updated);
    setEditingIdx(null);
  };

  const toggleRequirement = (idx: number) => {
    const updated = [...requirements];
    updated[idx] = { ...updated[idx], is_met: updated[idx].is_met === true ? null : true };
    onRequirementsChange(updated);
  };

  const hasClientData = parsedData.client.name || parsedData.client.email || parsedData.client.phone || parsedData.client.company;
  const hasBudget = parsedData.budget.per_person || parsedData.budget.total;

  return (
    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
      {/* Apply all button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Wyniki analizy AI
        </h3>
        <Button size="sm" onClick={handleApplyAll}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Zastosuj wszystko
        </Button>
      </div>

      {/* Client data */}
      {hasClientData && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Dane klienta</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {parsedData.client.name && (
              <FieldRow icon={<User className="h-4 w-4" />} label="Imię i nazwisko" value={parsedData.client.name} />
            )}
            {parsedData.client.email && (
              <FieldRow icon={<Mail className="h-4 w-4" />} label="Email" value={parsedData.client.email} />
            )}
            {parsedData.client.phone && (
              <FieldRow icon={<Phone className="h-4 w-4" />} label="Telefon" value={parsedData.client.phone} />
            )}
            {parsedData.client.company && (
              <FieldRow icon={<Building2 className="h-4 w-4" />} label="Firma" value={parsedData.client.company} />
            )}
            <Separator className="my-2" />
            {existingClient ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUseExistingClient(existingClient.id, existingClient.name)}
                className="w-full"
              >
                <Check className="mr-2 h-4 w-4" />
                Znaleziono klienta: {existingClient.name} — Użyj tego
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreateClient(parsedData.client)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nowy klient: {parsedData.client.name ?? 'Utwórz'} — Utwórz i przypisz
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event data */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Dane wydarzenia</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          <EventField
            icon={<Sparkles className="h-4 w-4" />}
            label="Typ wydarzenia"
            value={parsedData.event.type ? `${EVENT_TYPE_LABELS[parsedData.event.type as EventType] ?? parsedData.event.type}` : null}
            confidence={parsedData.event.type_confidence}
            onApply={parsedData.event.type ? () => applyField('event_type', parsedData.event.type) : undefined}
          />
          <EventField
            icon={<Calendar className="h-4 w-4" />}
            label="Data"
            value={parsedData.event.date}
            onApply={parsedData.event.date ? () => applyField('event_date', parsedData.event.date) : undefined}
          />
          <EventField
            icon={<Clock className="h-4 w-4" />}
            label="Godziny"
            value={parsedData.event.time_from || parsedData.event.time_to
              ? `${parsedData.event.time_from ?? '?'} – ${parsedData.event.time_to ?? '?'}`
              : null}
            onApply={parsedData.event.time_from ? () => {
              if (parsedData.event.time_from) applyField('event_time_from', parsedData.event.time_from);
              if (parsedData.event.time_to) applyField('event_time_to', parsedData.event.time_to);
            } : undefined}
          />
          <EventField
            icon={<Users className="h-4 w-4" />}
            label="Liczba osób"
            value={parsedData.event.people_count?.toString() ?? null}
            onApply={parsedData.event.people_count ? () => applyField('people_count', parsedData.event.people_count) : undefined}
          />
          <EventField
            icon={<MapPin className="h-4 w-4" />}
            label="Lokalizacja"
            value={parsedData.event.location}
            onApply={parsedData.event.location ? () => applyField('event_location', parsedData.event.location) : undefined}
          />
          <EventField
            icon={<Truck className="h-4 w-4" />}
            label="Dostawa"
            value={parsedData.event.delivery_type
              ? DELIVERY_TYPE_OPTIONS.find(o => o.value === parsedData.event.delivery_type)?.label ?? parsedData.event.delivery_type
              : null}
            onApply={parsedData.event.delivery_type ? () => applyField('delivery_type', parsedData.event.delivery_type) : undefined}
          />
          <EventField
            icon={<Calculator className="h-4 w-4" />}
            label="Tryb kalkulacji"
            value={PRICING_MODE_OPTIONS.find(o => o.value === parsedData.pricing_mode_suggestion)?.label ?? parsedData.pricing_mode_suggestion}
            onApply={() => applyField('pricing_mode', parsedData.pricing_mode_suggestion)}
          />
        </CardContent>
      </Card>

      {/* Requirements */}
      {requirements.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Wymagania klienta</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {requirements.map((req, idx) => (
              <div key={idx} className="flex items-start gap-2 group">
                <Checkbox
                  checked={req.is_met === true}
                  onCheckedChange={() => toggleRequirement(idx)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  {editingIdx === idx ? (
                    <div className="flex gap-1">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="h-7 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={saveEdit}>
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={`text-sm cursor-pointer hover:underline ${req.is_met ? 'line-through text-muted-foreground' : ''}`}
                      onClick={() => startEdit(idx)}
                    >
                      {req.text}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${CATEGORY_LABELS[req.category]?.className ?? ''}`}>
                  {CATEGORY_LABELS[req.category]?.label ?? req.category}
                </Badge>
                {req.priority === 'must' && (
                  <Badge variant="destructive" className="text-[10px] shrink-0">must</Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => removeRequirement(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Input
                value={newReqText}
                onChange={(e) => setNewReqText(e.target.value)}
                placeholder="Dodaj wymaganie ręcznie..."
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addRequirement()}
              />
              <Button size="sm" variant="outline" className="h-8" onClick={addRequirement} disabled={!newReqText.trim()}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget */}
      {hasBudget && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budżet klienta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {parsedData.budget.per_person && (
              <p className="text-sm">Budżet na osobę: <strong>{parsedData.budget.per_person} {parsedData.budget.currency}</strong></p>
            )}
            {parsedData.budget.total && (
              <p className="text-sm">Budżet łączny: <strong>{parsedData.budget.total} {parsedData.budget.currency}</strong></p>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Notes */}
      {parsedData.notes && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notatki AI
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-sm text-muted-foreground">{parsedData.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper components
const FieldRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground w-28 shrink-0">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);

const EventField = ({
  icon, label, value, confidence, onApply,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  confidence?: string;
  onApply?: () => void;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground w-28 shrink-0">{label}:</span>
    {value ? (
      <>
        <span className="font-medium">{value}</span>
        {confidence && (
          <Badge variant="outline" className={`text-[10px] ${CONFIDENCE_BADGE[confidence]?.className ?? ''}`}>
            {CONFIDENCE_BADGE[confidence]?.label ?? confidence}
          </Badge>
        )}
        {onApply && (
          <Button size="sm" variant="ghost" className="h-6 px-2 ml-auto" onClick={onApply}>
            <Check className="h-3 w-3 mr-1" />
            Zastosuj
          </Button>
        )}
      </>
    ) : (
      <span className="text-muted-foreground flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Brak w zapytaniu
      </span>
    )}
  </div>
);
