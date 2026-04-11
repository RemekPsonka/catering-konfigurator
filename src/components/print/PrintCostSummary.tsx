import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Tables } from '@/integrations/supabase/types';
import { formatCurrency, calculateOfferTotals } from '@/lib/calculations';

interface PrintCostSummaryProps {
  offer: PublicOffer;
  offerTerms: Tables<'offer_terms'>[];
}

export const PrintCostSummary = ({ offer, offerTerms }: PrintCostSummaryProps) => {
  const variants = [...(offer.offer_variants ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const services = (offer.offer_services ?? []) as unknown[];
  const peopleCount = offer.people_count ?? 1;
  const deliveryCost = Number(offer.delivery_cost ?? 0);
  const discountPercent = Number(offer.discount_percent ?? 0);
  const discountValue = Number(offer.discount_value ?? 0);
  const upsellTotal = Number(offer.upsell_total ?? 0);

  const totals = calculateOfferTotals(
    offer.pricing_mode,
    peopleCount,
    variants as never[],
    services as never[],
    discountPercent,
    discountValue,
    deliveryCost,
    upsellTotal,
  );

  const hasDiscount = discountPercent > 0 || discountValue > 0;
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;

  return (
    <div className="print-section print-page-break">
      <h2 style={{ fontSize: '14pt', marginBottom: '12pt' }}>Podsumowanie finansowe</h2>

      <table className="print-cost-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Pozycja</th>
            {totals.variantTotals.map((vt) => (
              <th key={vt.id} style={{ textAlign: 'right' }}>{vt.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'left', fontWeight: 600 }}>Menu (dania)</td>
            {totals.variantTotals.map((vt) => (
              <td key={vt.id}>{formatCurrency(vt.total)}</td>
            ))}
          </tr>
          {hasDiscount && (
            <tr>
              <td style={{ textAlign: 'left' }}>
                Rabat {discountPercent > 0 ? `(${discountPercent}%)` : ''}
              </td>
              {totals.variantTotals.map((vt) => (
                <td key={vt.id} style={{ color: '#c00' }}>-{formatCurrency(vt.discountAmount)}</td>
              ))}
            </tr>
          )}
          {totals.servicesTotalCalc > 0 && (
            <tr>
              <td style={{ textAlign: 'left' }}>Usługi</td>
              {totals.variantTotals.map((vt) => (
                <td key={vt.id}>{formatCurrency(totals.servicesTotalCalc)}</td>
              ))}
            </tr>
          )}
          {deliveryCost > 0 && (
            <tr>
              <td style={{ textAlign: 'left' }}>Dostawa</td>
              {totals.variantTotals.map((vt) => (
                <td key={vt.id}>{formatCurrency(deliveryCost)}</td>
              ))}
            </tr>
          )}
          {upsellTotal > 0 && (
            <tr>
              <td style={{ textAlign: 'left' }}>Dodatki</td>
              {totals.variantTotals.map((vt) => (
                <td key={vt.id}>{formatCurrency(upsellTotal)}</td>
              ))}
            </tr>
          )}
          <tr className="total-row">
            <td style={{ textAlign: 'left' }}>RAZEM</td>
            {totals.variantTotals.map((vt) => (
              <td key={vt.id}>{formatCurrency(vt.grandTotal)}</td>
            ))}
          </tr>
          <tr>
            <td style={{ textAlign: 'left' }}>Cena za osobę</td>
            {totals.variantTotals.map((vt) => (
              <td key={vt.id}>{formatCurrency(vt.pricePerPerson)}</td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Validity */}
      {offer.valid_until && (
        <div className="print-validity">
          Oferta ważna do: <strong>{formatDate(offer.valid_until)}</strong>
        </div>
      )}

      {/* Terms */}
      {offerTerms.length > 0 && (
        <div style={{ marginTop: '16pt' }}>
          <h3 style={{ fontSize: '12pt', marginBottom: '8pt' }}>Warunki oferty</h3>
          <dl className="print-terms">
            {offerTerms.map((term) => (
              <div key={term.id}>
                <dt>{term.label}</dt>
                <dd>{term.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
};
