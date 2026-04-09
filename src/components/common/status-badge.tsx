import { Badge } from '@/components/ui/badge';
import { OFFER_STATUS_LABELS, OFFER_STATUS_COLORS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/lib/constants';
import type { OfferStatus, LeadStatus } from '@/types';

interface StatusBadgeProps {
  status: OfferStatus | LeadStatus;
  type: 'offer' | 'lead';
}

export const StatusBadge = ({ status, type }: StatusBadgeProps) => {
  const label = type === 'offer'
    ? OFFER_STATUS_LABELS[status as OfferStatus]
    : LEAD_STATUS_LABELS[status as LeadStatus];

  const colorClass = type === 'offer'
    ? OFFER_STATUS_COLORS[status as OfferStatus]
    : LEAD_STATUS_COLORS[status as LeadStatus];

  return (
    <Badge variant="outline" className={`${colorClass} border-none font-medium`}>
      {label}
    </Badge>
  );
};
