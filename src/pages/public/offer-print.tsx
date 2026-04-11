import { useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { OfferPrintDocument } from '@/components/print/OfferPrintDocument';
import { useOfferPrintDataByToken } from '@/hooks/use-offer-print-data';
import { trackOfferEvent } from '@/lib/tracking';

export const OfferPrintPage = () => {
  const { publicToken } = useParams<{ publicToken: string }>();
  const { offer, companyInfo, offerTerms, upsellSelections, isLoading } = useOfferPrintDataByToken(publicToken);
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (offer && companyInfo && !hasPrinted.current) {
      hasPrinted.current = true;
      trackOfferEvent(offer.id, 'pdf_downloaded');
      setTimeout(() => window.print(), 500);
    }
  }, [offer, companyInfo]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <p>Przygotowywanie dokumentu...</p>
      </div>
    );
  }

  if (!offer || !companyInfo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <p>Nie znaleziono oferty</p>
      </div>
    );
  }

  return (
    <OfferPrintDocument
      offer={offer}
      companyInfo={companyInfo}
      offerTerms={offerTerms}
      upsellSelections={upsellSelections}
    />
  );
};
