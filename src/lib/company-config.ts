export const COMPANY = {
  name: 'Catering Śląski',
  legalName: 'NONO FOOD Sp. z o.o.',
  phone: '+48 793 001 900',
  email: 'zamowienia@cateringslaski.pl',
  managerName: 'Angelika Sadurska',
  managerEmail: 'a.sadurska@nono.pl',
  address: 'ul. Brynicy 24, 40-358 Katowice',
  nip: '9542879370',
  krs: '0001138376',
  regon: '540182342',
  website: 'https://cateringslaski.pl',
  instagram: '@cateringslaski',
  legalEmail: 'biuro@nono.pl',
  googleReviewUrl: '', // TODO: uzupełnij link do Google Maps review
} as const;

export const companySignature = `${COMPANY.name}\ntel. ${COMPANY.phone} | ${COMPANY.email}`;

export const companyLegalFooter = `${COMPANY.name} — marka ${COMPANY.legalName}\n${COMPANY.address} | NIP: ${COMPANY.nip} | KRS: ${COMPANY.krs}`;
