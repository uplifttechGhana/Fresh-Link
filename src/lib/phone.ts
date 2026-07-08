/** Normalize a Ghana phone number to +233XXXXXXXXX. */
export function normalizeGhanaPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('233') && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;

  return raw.trim().startsWith('+') ? raw.trim() : `+${digits}`;
}
