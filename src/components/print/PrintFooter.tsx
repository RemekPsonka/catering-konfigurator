import type { PublicOffer } from '@/hooks/use-public-offer';
import type { CompanyInfo } from '@/hooks/use-company-info';
import { COMPANY } from '@/lib/company-config';

interface PrintFooterProps {
  offer: PublicOffer;
  companyInfo: CompanyInfo;
}

export const PrintFooter = ({ offer, companyInfo }: PrintFooterProps) => {
  return (
    <div className="print-section">
      {/* Coordinator */}
      {(offer.coordinator_name || offer.coordinator_phone) && (
        <div style={{ marginBottom: '16pt' }}>
          <h3 style={{ fontSize: '12pt', marginBottom: '6pt' }}>Koordynator wydarzenia</h3>
          {offer.coordinator_name && <p style={{ margin: '2pt 0', fontSize: '10pt' }}>{offer.coordinator_name}</p>}
          {offer.coordinator_phone && <p style={{ margin: '2pt 0', fontSize: '10pt' }}>tel. {offer.coordinator_phone}</p>}
        </div>
      )}

      {/* Acceptance block */}
      <div className="print-acceptance-block">
        <h3>Akceptacja oferty</h3>
        <p style={{ fontSize: '10pt', marginBottom: '8pt' }}>
          Akceptuję powyższą ofertę i wyrażam zgodę na realizację usługi cateringowej na warunkach określonych w niniejszym dokumencie.
        </p>
        <p style={{ fontSize: '9pt', color: '#666', marginBottom: '4pt' }}>
          Wybrany wariant: ____________________________
        </p>
        <div className="print-signature-line">
          <div className="print-signature-field">Data</div>
          <div className="print-signature-field">Imię i nazwisko</div>
          <div className="print-signature-field">Podpis</div>
        </div>
      </div>

      {/* Legal footer */}
      <div className="print-legal-footer">
        {companyInfo.name} — marka {companyInfo.legalName || COMPANY.legalName}<br />
        {companyInfo.address} | NIP: {companyInfo.nip || COMPANY.nip} | KRS: {COMPANY.krs}<br />
        {companyInfo.email} | {companyInfo.phone}
      </div>
    </div>
  );
};
