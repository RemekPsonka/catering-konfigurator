import type { PublicOffer } from '@/hooks/use-public-offer';
import type { PrintCompanyInfo } from './OfferPrintDocument';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import { COMPANY } from '@/lib/company-config';

interface PrintHeaderProps {
  offer: PublicOffer;
  companyInfo: PrintCompanyInfo;
}

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const formatVersionDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

const formatTime = (t: string | null) => (t ? t.slice(0, 5) : null);

const DELIVERY_LABELS: Record<string, string> = {
  COLD: 'Catering zimny',
  HEATED: 'Catering ciepły',
  FULL_SERVICE: 'Pełna obsługa',
};

export const PrintHeader = ({ offer, companyInfo }: PrintHeaderProps) => {
  const version = offer.current_version ?? 0;
  const versionLabel = offer.offer_number
    ? `${offer.offer_number}/v${version}`
    : `DRAFT`;
  const isDraft = version === 0;

  return (
    <div className="print-section">
      {/* Company header */}
      <div className="print-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12pt' }}>
          {companyInfo.logoUrl && (
            <img src={companyInfo.logoUrl} alt={companyInfo.name} className="print-header-logo" />
          )}
          <div className="print-header-company">
            <strong>{companyInfo.name}</strong>
            {companyInfo.address}<br />
            tel. {companyInfo.phone} | {companyInfo.email}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="print-version-badge">{versionLabel}</div>
          {isDraft && <div className="print-draft-watermark">WERSJA ROBOCZA</div>}
          {!isDraft && offer.version_date && (
            <div style={{ fontSize: '8pt', color: '#888', marginTop: '4pt' }}>
              {formatVersionDate(offer.version_date)}
            </div>
          )}
        </div>
      </div>

      {/* Offer meta: client + event */}
      <div className="print-offer-meta">
        <div className="print-meta-block">
          <h3>Klient</h3>
          <p><strong>{offer.clients?.name ?? '—'}</strong></p>
          {offer.clients?.company && <p>{offer.clients.company}</p>}
          {offer.clients?.email && <p>{offer.clients.email}</p>}
          {offer.clients?.phone && <p>{offer.clients.phone}</p>}
        </div>
        <div className="print-meta-block">
          <h3>Wydarzenie</h3>
          <p><strong>{EVENT_TYPE_LABELS[offer.event_type as keyof typeof EVENT_TYPE_LABELS] ?? offer.event_type}</strong></p>
          <p>Data: {formatDate(offer.event_date)}</p>
          {(offer.event_time_from || offer.event_time_to) && (
            <p>Godziny: {formatTime(offer.event_time_from)} – {formatTime(offer.event_time_to)}</p>
          )}
          {offer.event_location && <p>Miejsce: {offer.event_location}</p>}
          {offer.people_count && <p>Liczba osób: {offer.people_count}</p>}
          {offer.delivery_type && (
            <p>Typ dostawy: {DELIVERY_LABELS[offer.delivery_type] ?? offer.delivery_type}</p>
          )}
        </div>
      </div>

      {/* Greeting text */}
      {offer.greeting_text && (
        <div className="print-greeting">{offer.greeting_text}</div>
      )}
    </div>
  );
};
