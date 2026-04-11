import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Printer } from 'lucide-react';
import { useOfferVersions } from '@/hooks/use-offer-versions';
import { format } from 'date-fns';

interface VersionHistoryPanelProps {
  offerId: string;
}

export const VersionHistoryPanel = ({ offerId }: VersionHistoryPanelProps) => {
  const { data: versions = [], isLoading } = useOfferVersions(offerId);

  if (isLoading || versions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Historia wersji
          <Badge variant="secondary" className="text-xs">{versions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {versions.map((ver, idx) => (
          <div
            key={ver.id}
            className="relative flex items-start gap-3 pl-4"
          >
            {/* Timeline line */}
            {idx < versions.length - 1 && (
              <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
            )}
            {/* Dot */}
            <div className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  Wersja {ver.version_number}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => window.open(`/admin/offers/${offerId}/print/${ver.version_number}`, '_blank')}
                >
                  <Printer className="h-3 w-3 mr-1" />
                  PDF
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {ver.created_at ? format(new Date(ver.created_at), 'dd.MM.yyyy HH:mm') : '—'}
              </p>
              {ver.change_summary && (
                <p className="text-xs text-muted-foreground mt-0.5">{ver.change_summary}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
