import { useMutation } from '@tanstack/react-query';
import { compressImageFile } from '../compressImage';

const UPLOAD_TIMEOUT_MS = 60_000;

function getApiBase(): string {
  return (
    (import.meta.env.VITE_API_BASE_URL as string) ||
    `${window.location.protocol}//${window.location.hostname}:3001`
  ).replace(/\/$/, '');
}

function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${getApiBase()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
    if (!data.accessToken) return null;
    localStorage.setItem('access_token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/** Turn a relative /uploads/... path into a full URL for audio/image playback. */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const base = getApiBase();
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Upload a File to the backend via multipart/form-data.
 * Returns a persistable Cloudinary or /uploads URL.
 */
export async function uploadFile(file: File, folder = 'produce'): Promise<string> {
  const prepared = await compressImageFile(file);

  const doUpload = async (token: string | null) => {
    const form = new FormData();
    form.append('folder', folder);
    form.append('file', prepared);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      return await fetch(
        `${getApiBase()}/api/v1/storage/upload?folder=${encodeURIComponent(folder)}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }
  };

  let token = getAuthToken();
  let res: Response;

  try {
    res = await doUpload(token);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Upload timed out. Check your connection and try again.');
    }
    throw err;
  }

  if (res.status === 401) {
    token = await refreshAuthToken();
    if (token) {
      try {
        res = await doUpload(token);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error('Upload timed out. Check your connection and try again.');
        }
        throw err;
      }
    }
  }

  if (!res.ok) {
    let msg = 'Upload failed — please try again';
    try {
      const data = await res.json();
      msg = (data as { message?: string | string[] })?.message
        ? Array.isArray((data as { message: string[] }).message)
          ? (data as { message: string[] }).message.join(', ')
          : String((data as { message: string }).message)
        : msg;
    } catch {
      msg = (await res.text().catch(() => msg)) || msg;
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as { url: string };
  if (!data.url || data.url.startsWith('blob:') || data.url.startsWith('data:')) {
    throw new Error('Upload did not return a valid image URL');
  }
  return data.url;
}

/** TanStack mutation wrapper for uploading a single file */
export function useUploadFile(folder = 'produce') {
  return useMutation({
    mutationFn: (file: File) => uploadFile(file, folder),
  });
}
