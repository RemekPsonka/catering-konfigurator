export const COMPANY = {
  name: 'Catering Śląski',
  phone: '+48 XXX XXX XXX',
  email: 'biuro@cateringsl.pl',
  address: 'ul. Przykładowa 1, 44-100 Gliwice',
  nip: '000-000-00-00',
  website: 'https://cateringsl.pl',
  googleReviewUrl: '', // TODO: uzupełnij link do Google Maps review
} as const;

export const companySignature = `${COMPANY.name}\ntel. ${COMPANY.phone} | ${COMPANY.email}`;
