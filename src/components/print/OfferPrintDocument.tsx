import type { PublicOffer } from '@/hooks/use-public-offer';

export interface PrintCompanyInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  nip: string;
  website: string;
  instagram: string;
  facebook: string;
  logoUrl: string | null;
  legalName: string;
  regon: string;
}
import type { Tables } from '@/integrations/supabase/types';
import { PrintHeader } from './PrintHeader';
import { PrintVariantsComparison } from './PrintVariantsComparison';
import { PrintServicesTable } from './PrintServicesTable';
import { PrintCostSummary } from './PrintCostSummary';
import { PrintFooter } from './PrintFooter';
import './print-styles.css';

export interface OfferPrintDocumentProps {
  offer: PublicOffer;
  companyInfo: PrintCompanyInfo;
  offerTerms: Tables<'offer_terms'>[];
  upsellSelections?: Tables<'offer_upsell_selections'>[];
}

export const OfferPrintDocument = ({ offer, companyInfo, offerTerms, upsellSelections }: OfferPrintDocumentProps) => {
  return (
    <div className="print-document">
      {/* Section 1: Header + Event + Greeting */}
      <PrintHeader offer={offer} companyInfo={companyInfo} />

      {/* Section 2: Variants comparison */}
      <PrintVariantsComparison offer={offer} />

      {/* Section 3: Services + Upsell */}
      <PrintServicesTable offer={offer} upsellSelections={upsellSelections} />

      {/* Section 4: Cost summary + Terms */}
      <PrintCostSummary offer={offer} offerTerms={offerTerms} />

      {/* Section 5: Footer + Acceptance + Legal */}
      <div className="print-page-break">
        <PrintFooter offer={offer} companyInfo={companyInfo} />
      </div>
    </div>
  );
};
