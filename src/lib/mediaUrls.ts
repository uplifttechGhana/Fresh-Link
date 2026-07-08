/** URLs that can be stored in the database and loaded by other users/devices. */
export function isPersistableMediaUrl(url: string): boolean {
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith('/uploads/')
  );
}

export function filterPersistableMediaUrls(urls?: string[]): string[] {
  return (urls ?? []).filter(isPersistableMediaUrl);
}
