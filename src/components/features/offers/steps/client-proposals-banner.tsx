import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ProposalSummary {
  id: string;
  status: string;
  itemCount: number;
  clientName: string | null;
  createdAt: string | null;
}

interface ClientProposalsBannerProps {
  offerId: string;
  proposals: ProposalSummary[];
}

export const ClientProposalsBanner = ({ offerId, proposals }: ClientProposalsBannerProps) => {
  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  if (pendingCount === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
        <span className="text-sm text-orange-800">
          <strong>{pendingCount}</strong> {pendingCount === 1 ? 'oczekująca propozycja zmian' : 'oczekujące propozycje zmian'} od klienta
        </span>
      </div>
      <div className="flex items-center gap-2">
        {proposals
          .filter(p => p.status === 'pending')
          .map(p => (
            <Link
              key={p.id}
              to={`/admin/offers/${offerId}/proposals/${p.id}`}
              className="inline-flex items-center gap-1"
            >
              <Badge variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-100 cursor-pointer">
                Przejrzyj
                <ExternalLink className="h-3 w-3 ml-1" />
              </Badge>
            </Link>
          ))}
      </div>
    </div>
  );
};
