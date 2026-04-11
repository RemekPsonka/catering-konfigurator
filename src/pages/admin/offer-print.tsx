import { useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { OfferPrintDocument } from '@/components/print/OfferPrintDocument';
import { useOfferPrintData, useOfferPrintDataFromSnapshot } from '@/hooks/use-offer-print-data';

export const AdminOfferPrintPage = () => {
  const { id, versionNumber } = useParams<{ id: string; versionNumber?: string }>();
  const versionNum = versionNumber ? parseInt(versionNumber, 10) : undefined;

  const liveData = useOfferPrintData(versionNum ? undefined : id);
  const snapshotData = useOfferPrintDataFromSnapshot(
    versionNum ? id : undefined,
    versionNum,
  );

  const { offer, companyInfo, offerTerms, upsellSelections, isLoading } = versionNum
    ? snapshotData
    : liveData;

  const hasPrinted = useRef(false);

  useEffect(() => {
    if (offer && companyInfo && !hasPrinted.current) {
      hasPrinted.current = true;
      const safeName = (offer.offer_number ?? 'oferta').replace(/[^a-zA-Z0-9-]/g, '_');
      const version = versionNum ?? offer.current_version ?? 0;
      document.title = `Oferta_${safeName}_v${version}_Catering_Slaski`;
      setTimeout(() => window.print(), 500);
    }
  }, [offer, companyInfo, versionNum]);

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
