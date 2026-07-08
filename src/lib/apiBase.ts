import { Capacitor } from '@capacitor/core';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Primary backend origin for REST and WebSocket.
 * Returns undefined in local dev when unset — callers fall back to same-origin (Vite proxy).
 */
export function getPrimaryApiOrigin(): string | undefined {
  const native = (import.meta.env.VITE_API_BASE_URL_NATIVE as string | undefined)?.trim();
  const web = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  if (Capacitor.isNativePlatform()) {
    const url = native || web;
    return url ? stripTrailingSlash(url) : undefined;
  }

  return web ? stripTrailingSlash(web) : undefined;
}
