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
