export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

const STORAGE_KEY = 'freshlink-buyer-saved-addresses';

export function loadSavedAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAddress[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAddress(entry: Omit<SavedAddress, 'id'> & { id?: string }): SavedAddress[] {
  const current = loadSavedAddresses();
  const saved: SavedAddress = {
    id: entry.id ?? crypto.randomUUID(),
    label: entry.label,
    address: entry.address,
    lat: entry.lat,
    lng: entry.lng,
  };

  const without = entry.id
    ? current.filter((a) => a.id !== entry.id)
    : current.filter(
        (a) => a.address.trim().toLowerCase() !== saved.address.trim().toLowerCase(),
      );
  const next = [saved, ...without].slice(0, 8);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteAddress(id: string): SavedAddress[] {
  const next = loadSavedAddresses().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
