const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000';

/** Resolve relative /uploads paths; leave Cloudinary and other absolute URLs as-is. */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) {
    const base = API_BASE.replace(/\/$/, '');
    return `${base}${url}`;
  }
  return url;
}

export function resolveMediaUrls(urls?: string[] | null): string[] {
  if (!urls?.length) return [];
  return urls.map((u) => resolveMediaUrl(u)).filter((u): u is string => !!u);
}
