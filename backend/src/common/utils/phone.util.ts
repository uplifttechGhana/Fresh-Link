/** Normalize a Ghana phone number to +233XXXXXXXXX. */
export function normalizeGhanaPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('233') && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;

  return raw.trim().startsWith('+') ? raw.trim() : `+${digits}`;
}

/** Variants used when matching stored user phones. */
export function ghanaPhoneLookupVariants(raw: string): string[] {
  const normalized = normalizeGhanaPhone(raw);
  const digits = normalized.replace(/\D/g, '');
  const local = digits.startsWith('233') ? `0${digits.slice(3)}` : digits;

  return [...new Set([normalized, digits, `+${digits}`, local])].filter(Boolean);
}
