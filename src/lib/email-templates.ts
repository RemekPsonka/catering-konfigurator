export const OFFER_EMAIL_TEMPLATE = `Szanowna/y {clientName},

Przygotowaliśmy dla Państwa ofertę cateringową {offerNumber}.

Kliknij poniższy link aby zobaczyć szczegóły:
{offerLink}

Jeśli link nie działa, możesz też wejść na:
{findLink}
i wpisać:
  Email: {clientEmail}
  Numer oferty: {offerNumber}

Oferta ważna do: {validUntil}

Pozdrawiamy,
Catering Śląski
tel. +48 123 456 789 | kontakt@cateringsl.pl`;

export const buildOfferEmailText = (params: {
  clientName: string;
  offerNumber: string;
  publicToken: string;
  clientEmail: string;
  validUntil: string;
  baseUrl?: string;
}): string => {
  const base = params.baseUrl ?? window.location.origin;
  return OFFER_EMAIL_TEMPLATE
    .replace(/{clientName}/g, params.clientName)
    .replace(/{offerNumber}/g, params.offerNumber)
    .replace(/{offerLink}/g, `${base}/offer/${params.publicToken}`)
    .replace(/{findLink}/g, `${base}/offer/find`)
    .replace(/{clientEmail}/g, params.clientEmail)
    .replace(/{validUntil}/g, params.validUntil);
};
