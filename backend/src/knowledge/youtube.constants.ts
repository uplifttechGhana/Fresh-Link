export interface YouTubeVideoDto {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  channelTitle: string;
  publishedAt: string;
}

/** Agriculture YouTube channels used when the Data API key is not configured. */
export const AGRICULTURE_CHANNEL_IDS = [
  'UCGTWKdViJewysTa-wn29rpQ', // The Ghanaian Farmer
  'UC-aFpv4m_qog6GoIEF3uVNw', // The Chartered Farmer
];

export const CATEGORY_SEARCH_QUERIES: Record<string, string> = {
  'Farming Practices': 'Ghana sustainable farming practices tutorial',
  Fertilizers: 'organic fertilizer preparation compost agriculture',
  'Crop Protection': 'crop pest disease control organic farming Africa',
};

export const DEFAULT_SEARCH_QUERY = 'Ghana agriculture farming tutorial';

/** Offline fallback when both API and RSS are unavailable. */
export const CURATED_AGRICULTURE_VIDEOS: YouTubeVideoDto[] = [
  {
    id: 'u7d9I7RuSVM',
    title: 'The Ghanaian Farmer — Bringing African Agriculture to Light',
    description:
      'Enyonam Manye shares how The Ghanaian Farmer platform educates audiences on Ghanaian agriculture and connects farmers with opportunities.',
    thumbnailUrl: 'https://img.youtube.com/vi/u7d9I7RuSVM/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=u7d9I7RuSVM',
    channelTitle: 'The Ghanaian Farmer',
    publishedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Introduction to Small-Scale Farming in West Africa',
    description: 'Overview of small-scale farming techniques suited to West African climates and soils.',
    thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    channelTitle: 'Agriculture Africa',
    publishedAt: '2022-06-15T00:00:00.000Z',
  },
];

export function buildSearchQuery(category?: string, q?: string): string {
  if (q?.trim()) {
    const base = q.trim();
    return category && CATEGORY_SEARCH_QUERIES[category]
      ? `${base} ${CATEGORY_SEARCH_QUERIES[category]}`
      : `${base} Ghana agriculture`;
  }
  if (category && CATEGORY_SEARCH_QUERIES[category]) {
    return CATEGORY_SEARCH_QUERIES[category];
  }
  return DEFAULT_SEARCH_QUERY;
}

export function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
