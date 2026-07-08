const STORAGE_KEY = 'freshlink-ussd-phone';

export function loadUssdPhone(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveUssdPhone(phone: string) {
  try {
    localStorage.setItem(STORAGE_KEY, phone.trim());
  } catch {
    // ignore quota errors
  }
}

/** Normalize Ghana numbers for display and API. */
export function formatUssdPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('233')) return `+${digits}`;
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return raw.trim().startsWith('+') ? raw.trim() : `+${digits}`;
}

export function isValidUssdPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 12 && digits.startsWith('233');
}
