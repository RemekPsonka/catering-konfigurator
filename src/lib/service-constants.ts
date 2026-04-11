export const SERVICE_TYPE_LABELS: Record<string, string> = {
  STAFF: 'Obsługa',
  EQUIPMENT: 'Sprzęt',
  LOGISTICS: 'Logistyka',
};

export const PRICE_TYPE_LABELS: Record<string, string> = {
  PER_HOUR: 'Za godzinę',
  PER_EVENT: 'Za event',
  PER_PIECE: 'Za sztukę',
  PER_PERSON: 'Za osobę',
  PER_BLOCK: 'Za blok czasowy',
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  PRIVATE: 'Prywatny',
  BUSINESS: 'Firma',
  INSTITUTION: 'Instytucja',
  AGENCY: 'Agencja',
  RETURNING: 'Powracający',
};

export const calculateBlockTotal = (
  basePrice: number,
  extraBlockPrice: number | null,
  quantity: number,
): number => {
  if (quantity <= 0) return 0;
  if (quantity === 1) return basePrice;
  const extraPrice = extraBlockPrice ?? basePrice;
  return basePrice + (quantity - 1) * extraPrice;
};

export const formatBlockLabel = (
  quantity: number,
  unitLabel: string | null,
  durationHours: number | null,
): string => {
  const unit = unitLabel ?? 'blok';
  const duration = durationHours ? ` (${durationHours}h)` : '';
  return `${quantity} × ${unit}${duration}`;
};
