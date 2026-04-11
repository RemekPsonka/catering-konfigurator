import type { PublicOffer } from '@/hooks/use-public-offer';
import type { Tables } from '@/integrations/supabase/types';
import { formatCurrency } from '@/lib/calculations';

interface PrintServicesTableProps {
  offer: PublicOffer;
  upsellSelections?: Tables<'offer_upsell_selections'>[];
}

const DELIVERY_LABELS: Record<string, string> = {
  COLD: 'Dostawa – catering zimny',
  HEATED: 'Dostawa – catering ciepły',
  FULL_SERVICE: 'Dostawa – pełna obsługa',
};

export const PrintServicesTable = ({ offer, upsellSelections }: PrintServicesTableProps) => {
  const services = offer.offer_services ?? [];
  const deliveryCost = Number(offer.delivery_cost ?? 0);
  const hasUpsells = upsellSelections && upsellSelections.length > 0;

  if (services.length === 0 && deliveryCost === 0 && !hasUpsells) return null;

  let servicesTotal = 0;

  return (
    <div className="print-section">
      <h2 style={{ fontSize: '14pt', marginBottom: '12pt' }}>Usługi i logistyka</h2>
      <table className="print-table">
        <thead>
          <tr>
            <th>Usługa</th>
            <th style={{ textAlign: 'center', width: '80pt' }}>Ilość</th>
            <th style={{ textAlign: 'right', width: '100pt' }}>Cena jedn.</th>
            <th style={{ textAlign: 'right', width: '100pt' }}>Wartość</th>
          </tr>
        </thead>
        <tbody>
          {services.map((os) => {
            const name = os.services?.name ?? 'Usługa';
            const price = os.custom_price != null ? Number(os.custom_price) : Number(os.services?.price ?? 0);
            const qty = os.quantity ?? 1;
            const total = price * qty;
            servicesTotal += total;
            return (
              <tr key={os.id}>
                <td>
                  {name}
                  {os.notes && <div style={{ fontSize: '8pt', color: '#666' }}>{os.notes}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>{qty}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(price)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(total)}</td>
              </tr>
            );
          })}
          {deliveryCost > 0 && (
            <tr>
              <td>{DELIVERY_LABELS[offer.delivery_type ?? ''] ?? 'Dostawa'}</td>
              <td style={{ textAlign: 'center' }}>1</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(deliveryCost)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(deliveryCost)}</td>
            </tr>
          )}
          {hasUpsells && (
            <>
              <tr className="print-category-row">
                <td colSpan={4}>Dodatki (dosprzedaż)</td>
              </tr>
              {upsellSelections!.map((sel) => (
                <tr key={sel.id}>
                  <td>Dodatek #{sel.upsell_item_id.slice(0, 6)}</td>
                  <td style={{ textAlign: 'center' }}>{sel.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(Number(sel.unit_price))}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(Number(sel.total_price))}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};
