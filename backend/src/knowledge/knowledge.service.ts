import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import {
  AGRICULTURE_CHANNEL_IDS,
  buildSearchQuery,
  CATEGORY_SEARCH_QUERIES,
  CURATED_AGRICULTURE_VIDEOS,
  decodeXmlEntities,
  YouTubeVideoDto,
} from './youtube.constants';

export interface CreateKnowledgeDto {
  title: string;
  body: string;
  category?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  isVideo?: boolean;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async list(isVideo?: boolean, category?: string) {
    return this.prisma.knowledgeArticle.findMany({
      where: {
        ...(isVideo !== undefined ? { isVideo } : {}),
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.knowledgeArticle.findUnique({ where: { id } });
  }

  async create(dto: CreateKnowledgeDto) {
    return this.prisma.knowledgeArticle.create({ data: dto });
  }

  async remove(id: string) {
    await this.prisma.knowledgeArticle.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async categories() {
    const rows = await this.prisma.knowledgeArticle.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return rows.filter((r) => r.category).map((r) => ({ name: r.category as string, count: r._count.id }));
  }

  async searchYouTubeVideos(category?: string, q?: string, maxResults = 12): Promise<YouTubeVideoDto[]> {
    const searchQuery = buildSearchQuery(category, q);
    const apiKey = this.config.get<string>('YOUTUBE_API_KEY');

    if (apiKey) {
      try {
        const videos = await this.fetchFromYouTubeApi(searchQuery, maxResults, apiKey);
        if (videos.length > 0) return videos;
      } catch (err) {
        this.logger.warn(`YouTube Data API search failed: ${(err as Error).message}`);
      }
    }

    try {
      const rssVideos = await this.fetchFromChannelRss(maxResults);
      const filtered = this.filterVideos(rssVideos, category, q);
      if (filtered.length > 0) return filtered.slice(0, maxResults);
    } catch (err) {
      this.logger.warn(`YouTube RSS fallback failed: ${(err as Error).message}`);
    }

    return this.filterVideos(CURATED_AGRICULTURE_VIDEOS, category, q).slice(0, maxResults);
  }

  async getYouTubeVideo(videoId: string): Promise<YouTubeVideoDto> {
    const apiKey = this.config.get<string>('YOUTUBE_API_KEY');

    if (apiKey) {
      try {
        const { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet', id: videoId, key: apiKey },
          timeout: 10000,
        });
        const item = data.items?.[0];
        if (item) return this.mapApiVideo(item);
      } catch (err) {
        this.logger.warn(`YouTube video lookup failed: ${(err as Error).message}`);
      }
    }

    const curated = CURATED_AGRICULTURE_VIDEOS.find((v) => v.id === videoId);
    if (curated) return curated;

    const rssVideos = await this.fetchFromChannelRss(50);
    const match = rssVideos.find((v) => v.id === videoId);
    if (match) return match;

    throw new NotFoundException('YouTube video not found');
  }

  private async fetchFromYouTubeApi(
    query: string,
    maxResults: number,
    apiKey: string,
  ): Promise<YouTubeVideoDto[]> {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        type: 'video',
        q: query,
        maxResults,
        key: apiKey,
        relevanceLanguage: 'en',
        regionCode: 'GH',
        safeSearch: 'moderate',
        videoEmbeddable: 'true',
      },
      timeout: 10000,
    });

    return (data.items ?? [])
      .filter((item: { id?: { videoId?: string } }) => item.id?.videoId)
      .map((item: { id: { videoId: string }; snippet: Record<string, unknown> }) =>
        this.mapSearchItem(item.id.videoId, item.snippet),
      );
  }

  private async fetchFromChannelRss(maxResults: number): Promise<YouTubeVideoDto[]> {
    const perChannel = Math.ceil(maxResults / AGRICULTURE_CHANNEL_IDS.length);
    const batches = await Promise.all(
      AGRICULTURE_CHANNEL_IDS.map((channelId) => this.fetchSingleChannelRss(channelId, perChannel)),
    );
    return batches.flat();
  }

  private async fetchSingleChannelRss(channelId: string, limit: number): Promise<YouTubeVideoDto[]> {
    const { data } = await axios.get<string>(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { timeout: 10000, responseType: 'text' },
    );

    return data
      .split('<entry>')
      .slice(1, limit + 1)
      .map((entry) => {
        const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        const title = entry.match(/<title>([^<]*)<\/title>/)?.[1];
        if (!videoId || !title) return null;

        const description =
          entry.match(/<media:description>([^<]*)<\/media:description>/)?.[1] ?? '';
        const channelTitle = entry.match(/<name>([^<]*)<\/name>/)?.[1] ?? 'YouTube';
        const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? new Date().toISOString();
        const thumbnailUrl =
          entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] ??
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title: decodeXmlEntities(title),
          description: decodeXmlEntities(description),
          thumbnailUrl,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          channelTitle: decodeXmlEntities(channelTitle),
          publishedAt,
        } satisfies YouTubeVideoDto;
      })
      .filter((video): video is YouTubeVideoDto => video !== null);
  }

  private mapSearchItem(videoId: string, snippet: Record<string, unknown>): YouTubeVideoDto {
    const thumbs = snippet.thumbnails as Record<string, { url?: string }> | undefined;
    const thumbnailUrl =
      thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ??
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      id: videoId,
      title: String(snippet.title ?? 'Untitled'),
      description: String(snippet.description ?? ''),
      thumbnailUrl,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      channelTitle: String(snippet.channelTitle ?? 'YouTube'),
      publishedAt: String(snippet.publishedAt ?? new Date().toISOString()),
    };
  }

  private mapApiVideo(item: { id: string; snippet: Record<string, unknown> }): YouTubeVideoDto {
    return this.mapSearchItem(item.id, item.snippet);
  }

  private filterVideos(videos: YouTubeVideoDto[], category?: string, q?: string): YouTubeVideoDto[] {
    const terms = [
      ...(q?.trim().toLowerCase().split(/\s+/) ?? []),
      ...(category ? (CATEGORY_SEARCH_QUERIES[category] ?? category).toLowerCase().split(/\s+/) : []),
    ].filter((term) => term.length > 2);

    if (terms.length === 0) return videos;

    return videos.filter((video) => {
      const haystack = `${video.title} ${video.description} ${video.channelTitle}`.toLowerCase();
      return terms.some((term) => haystack.includes(term));
    });
  }
}
