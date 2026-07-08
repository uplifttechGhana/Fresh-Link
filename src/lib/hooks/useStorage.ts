import { useMutation } from '@tanstack/react-query';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

/** Turn a relative /uploads/... path into a full URL for audio/image playback. */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const base = API_BASE.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Upload a File to the backend via multipart/form-data.
 * The server saves it to disk (dev) or S3 (prod) and returns the public URL.
 */
export async function uploadFile(file: File, folder = 'produce'): Promise<string> {
  const token = localStorage.getItem('access_token');

  const form = new FormData();
  form.append('folder', folder);
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/storage/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let msg = 'Upload failed';
    try {
      const data = await res.json();
      msg = data?.message ?? JSON.stringify(data);
    } catch {
      msg = await res.text().catch(() => msg);
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}

/** TanStack mutation wrapper for uploading a single file */
export function useUploadFile(folder = 'produce') {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file, folder),
  });
}
