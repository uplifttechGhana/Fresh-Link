/**
 * Thin fetch wrapper pointing at the NestJS backend.
 * Automatically retries 401 responses once using the stored refresh token.
 */

import { Capacitor } from '@capacitor/core';

function getApiBaseUrls(): string[] {
  const nativeUrl = import.meta.env.VITE_API_BASE_URL_NATIVE as string | undefined;
  const lanUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';
  if (Capacitor.isNativePlatform()) {
    return [...new Set([nativeUrl, lanUrl, 'http://127.0.0.1:3001'].filter(Boolean))] as string[];
  }
  return [lanUrl];
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Try to get a new access token using the stored refresh token. Returns the new token or null. */
async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await apiFetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
      return data.accessToken as string;
    }
    return null;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  const bases = getApiBaseUrls();
  let lastError: unknown;

  for (const base of bases) {
    try {
      return await fetch(`${base}/api/v1${path}`, init);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error('API request failed');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...extraHeaders,
  };

  const res = await apiFetch(path, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // On 401: attempt a token refresh once, then retry
  if (res.status === 401 && !isRetry) {
    const hadToken = !!localStorage.getItem('access_token');
    const newToken = await tryRefresh();
    if (newToken) {
      return request<T>(method, path, body, extraHeaders, true);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (hadToken) {
      window.dispatchEvent(new CustomEvent('freshlink:auth-expired'));
    }
  }

  if (!res.ok) {
    let errorBody: unknown;
    try { errorBody = await res.json(); } catch { errorBody = null; }
    throw new ApiError(res.status, errorBody, `API ${method} ${path} failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/** Extract a user-facing message from a failed API response. */
export function formatApiError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string | string[] } | null;
    if (Array.isArray(body?.message)) return body.message.join(', ');
    if (typeof body?.message === 'string') return body.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
