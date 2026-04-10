import { PUBLIC_BASE_URL, buildPublicOfferUrl } from '@/lib/constants';
import { companySignature } from '@/lib/company-config';

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
${companySignature}`;

export const buildOfferEmailText = (params: {
  clientName: string;
  offerNumber: string;
  publicToken: string;
  clientEmail: string;
  validUntil: string;
  baseUrl?: string;
}): string => {
  const base = params.baseUrl ?? PUBLIC_BASE_URL;
  return OFFER_EMAIL_TEMPLATE
    .replace(/{clientName}/g, params.clientName)
    .replace(/{offerNumber}/g, params.offerNumber)
    .replace(/{offerLink}/g, buildPublicOfferUrl(params.publicToken))
    .replace(/{findLink}/g, `${base}/offer/find`)
    .replace(/{clientEmail}/g, params.clientEmail)
    .replace(/{validUntil}/g, params.validUntil);
};

export const OFFER_EMAIL_RICH_TEMPLATE = `Szanowna/y {clientName},

Przygotowaliśmy dla Państwa ofertę cateringową nr {offerNumber}.

📋 Szczegóły:
- Typ wydarzenia: {eventType}
- Data: {eventDate}
- Liczba osób: {peopleCount}

🍽️ Menu:
{variantsSummary}

{servicesSummary}

💰 Wartość oferty: {totalValue}

👉 Kliknij aby zobaczyć pełną ofertę:
{offerLink}

✨ Po otwarciu linku możesz:
- Przeglądać szczegółowe menu z opisami dań
- Proponować zmiany — zamienić dania na alternatywne
- Zaakceptować ofertę online jednym kliknięciem

Jeśli link nie działa, wejdź na {findLink} i wpisz swój email oraz numer oferty.

Oferta ważna do: {validUntil}

Pozdrawiamy,
${companySignature}`;

export const buildRichOfferEmail = (params: {
  clientName: string;
  offerNumber: string;
  publicToken: string;
  clientEmail: string;
  validUntil: string;
  eventType: string;
  eventDate: string;
  peopleCount: number;
  variantsSummary: string;
  servicesSummary: string;
  totalValue: string;
  baseUrl?: string;
}): string => {
  const base = params.baseUrl ?? PUBLIC_BASE_URL;
  return OFFER_EMAIL_RICH_TEMPLATE
    .replace(/{clientName}/g, params.clientName)
    .replace(/{offerNumber}/g, params.offerNumber)
    .replace(/{offerLink}/g, buildPublicOfferUrl(params.publicToken))
    .replace(/{findLink}/g, `${base}/offer/find`)
    .replace(/{clientEmail}/g, params.clientEmail)
    .replace(/{validUntil}/g, params.validUntil)
    .replace(/{eventType}/g, params.eventType)
    .replace(/{eventDate}/g, params.eventDate)
    .replace(/{peopleCount}/g, String(params.peopleCount))
    .replace(/{variantsSummary}/g, params.variantsSummary)
    .replace(/{servicesSummary}/g, params.servicesSummary)
    .replace(/{totalValue}/g, params.totalValue);
};
