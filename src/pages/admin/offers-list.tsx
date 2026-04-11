import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Pencil, Copy, ExternalLink, BookTemplate, FileText, Link2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/common/status-badge';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { useOffers, useDuplicateOffer } from '@/hooks/use-offers';
import { useDebounce } from '@/hooks/use-debounce';
import { SaveTemplateDialog } from '@/components/features/offers/save-template-dialog';
import { UseTemplateDialog } from '@/components/features/offers/use-template-dialog';
import type { TemplateData } from '@/hooks/use-offer-templates';
import {
  OFFER_STATUS_LABELS, EVENT_TYPE_LABELS, ITEMS_PER_PAGE, buildPublicOfferUrl,
} from '@/lib/constants';
import type { OfferStatus, EventType } from '@/types';

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Wszystkie' },
  ...Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const formatCurrency = (value: number | null) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd.MM.yyyy'); } catch { return '—'; }
};

export const OffersListPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useOffers({
    status, eventType, search: debouncedSearch, page,
  });
  const duplicateMutation = useDuplicateOffer();
  const [saveTemplateOffer, setSaveTemplateOffer] = useState<{ id: string; eventType: string; pricingMode: string } | null>(null);
  const [useTemplateOpen, setUseTemplateOpen] = useState(false);

  const totalPages = Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE);

  const handleDuplicate = async (e: React.MouseEvent, offerId: string) => {
    e.stopPropagation();
    const newOffer = await duplicateMutation.mutateAsync(offerId);
    navigate(`/admin/offers/${newOffer.id}/edit`);
  };

  const handleTemplateSelect = (templateData: TemplateData, eventType: string, pricingMode: string) => {
    // Navigate to new offer with template data in state
    navigate('/admin/offers/new', { state: { templateData, eventType, pricingMode } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oferty</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUseTemplateOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />Z szablonu
          </Button>
          <Button asChild>
            <Link to="/admin/offers/new"><Plus className="mr-2 h-4 w-4" />Nowa oferta</Link>
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
        <TabsList className="flex-wrap h-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search + event type filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Szukaj po numerze oferty lub kliencie..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Typ eventu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            {Object.entries(EVENT_TYPE_LABELS).map(([code, label]) => (
              <SelectItem key={code} value={code}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.offers?.length ? (
        <EmptyState
          title="Brak ofert"
          description="Nie znaleziono ofert spełniających kryteria."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numer</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Typ eventu</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Wartość</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Utworzono</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.offers.map((offer) => (
                <TableRow
                  key={offer.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/offers/${offer.id}/edit`)}
                >
                  <TableCell className="font-mono text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      {['accepted', 'won'].includes(offer.status) && (
                        <Lock className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      )}
                      {offer.offer_number ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>{offer.clients?.name ?? '—'}</TableCell>
                  <TableCell>
                    {EVENT_TYPE_LABELS[offer.event_type as EventType] ?? offer.event_type}
                  </TableCell>
                  <TableCell>{formatDate(offer.event_date)}</TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex flex-col items-end gap-0.5">
                      {formatCurrency(offer.total_value)}
                      {(offer.upsell_total ?? 0) > 0 && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-[10px] mt-0.5">
                          +{formatCurrency(offer.upsell_total)} dosprzedaż
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={offer.status as OfferStatus} type="offer" />
                      {['accepted', 'won'].includes(offer.status) && offer.accepted_variant_id && (() => {
                        const variantName = offer.offer_variants?.find(v => v.id === offer.accepted_variant_id)?.name;
                        return variantName ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] w-fit">
                            Wariant: {variantName}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(offer.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/offers/${offer.id}/edit`);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDuplicate(e, offer.id)}
                          disabled={duplicateMutation.isPending}
                        >
                          <Copy className="mr-2 h-4 w-4" />Duplikuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSaveTemplateOffer({
                              id: offer.id,
                              eventType: offer.event_type,
                              pricingMode: offer.pricing_mode,
                            });
                          }}
                        >
                          <BookTemplate className="mr-2 h-4 w-4" />Zapisz jako szablon
                        </DropdownMenuItem>
                        {offer.public_token && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(buildPublicOfferUrl(offer.public_token!), '_blank');
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />Podgląd klienta
                          </DropdownMenuItem>
                        )}
                        {offer.public_token && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(buildPublicOfferUrl(offer.public_token!));
                              toast.success('Link skopiowany!');
                            }}
                          >
                            <Link2 className="mr-2 h-4 w-4" />Kopiuj link
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Poprzednia
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Następna
              </Button>
            </div>
          )}
        </>
      )}

      {saveTemplateOffer && (
        <SaveTemplateDialog
          offerId={saveTemplateOffer.id}
          eventType={saveTemplateOffer.eventType}
          pricingMode={saveTemplateOffer.pricingMode}
          open={!!saveTemplateOffer}
          onOpenChange={(open) => !open && setSaveTemplateOffer(null)}
        />
      )}

      <UseTemplateDialog
        open={useTemplateOpen}
        onOpenChange={setUseTemplateOpen}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};
