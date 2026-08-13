import { BadRequestException } from '@nestjs/common';

/** Reject blob/data URLs — only Cloudinary, other HTTPS, or server upload paths. */
export function sanitizeMediaUrls(urls?: string[]): string[] {
  return (urls ?? []).filter((url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('blob:') || url.startsWith('data:')) return false;
    return /^https?:\/\//i.test(url) || url.startsWith('/uploads/');
  });
}

export function assertPersistableMediaUrls(urls: string[] | undefined, field = 'images') {
  const invalid = (urls ?? []).filter(
    (url) => url.startsWith('blob:') || url.startsWith('data:'),
  );
  if (invalid.length > 0) {
    throw new BadRequestException(
      `${field} must be uploaded to the server first. Temporary browser preview URLs cannot be saved.`,
    );
  }
}

/** Reject blob/data URLs for a single optional media field (e.g. a video). */
export function sanitizeMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('blob:') || url.startsWith('data:')) return undefined;
  return /^https?:\/\//i.test(url) || url.startsWith('/uploads/') ? url : undefined;
}

export function assertPersistableMediaUrl(url: string | undefined, field = 'video') {
  if (url && (url.startsWith('blob:') || url.startsWith('data:'))) {
    throw new BadRequestException(
      `${field} must be uploaded to the server first. Temporary browser preview URLs cannot be saved.`,
    );
  }
}
