import { useParams } from 'react-router-dom';
import { OfferWizard } from '@/components/features/offers/offer-wizard';

export const OfferEditPage = () => {
  const { id } = useParams<{ id: string }>();
  return <OfferWizard offerId={id} />;
};
