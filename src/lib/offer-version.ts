export const getOfferVersionLabel = (
  offerNumber: string | null | undefined,
  currentVersion: number | null | undefined,
): string => {
  const num = offerNumber ?? '—';
  const ver = currentVersion ?? 0;
  if (ver === 0) return `${num} (szkic)`;
  return `${num}/v${ver}`;
};
