import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CropHealthStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { GeminiService, GeminiCropAnalysis } from './gemini.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class CropScanService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
    private knowledge: KnowledgeService,
    private config: ConfigService,
  ) {}

  async scan(userId: string, imageUrl: string) {
    const resolvedUrl = this.resolveImageUrl(imageUrl);
    const { base64, mimeType } = await this.fetchImageAsBase64(resolvedUrl);
    const analysis = await this.gemini.analyzeCropImage(base64, mimeType);

    const relatedArticles = await this.knowledge.findRelated(
      analysis.crop,
      analysis.diseases.map((d) => d.name),
      5,
    );
    const relatedVideos = await this.knowledge.searchYouTubeVideos(
      analysis.crop !== 'unknown' ? analysis.crop : undefined,
      analysis.diseases[0]?.name,
      4,
    );

    const record = await this.prisma.cropScan.create({
      data: {
        userId,
        imageUrl: resolvedUrl,
        crop: analysis.crop,
        confidence: analysis.confidence,
        healthStatus: this.toPrismaHealthStatus(analysis.healthStatus),
        diseasesJson: analysis.diseases as object,
        advice: analysis.advice,
        rawResponse: analysis as object,
      },
    });

    return this.formatScanResult(record, analysis, relatedArticles, relatedVideos);
  }

  async listMine(userId: string, limit = 20) {
    const rows = await this.prisma.cropScan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
    });
    return rows.map((row) => this.formatScanSummary(row));
  }

  async findOne(userId: string, id: string) {
    const row = await this.prisma.cropScan.findFirst({
      where: { id, userId },
    });
    if (!row) throw new NotFoundException('Scan not found');

    const diseases = this.parseDiseases(row.diseasesJson);
    const analysis: GeminiCropAnalysis = {
      crop: row.crop ?? 'unknown',
      confidence: row.confidence ?? 0,
      healthStatus: (row.healthStatus ?? 'unclear') as GeminiCropAnalysis['healthStatus'],
      diseases,
      advice: row.advice ?? '',
      disclaimer:
        'This is AI guidance, not a substitute for inspection by an agronomist or extension officer.',
    };

    const relatedArticles = await this.knowledge.findRelated(
      analysis.crop,
      diseases.map((d) => d.name),
      5,
    );
    const relatedVideos = await this.knowledge.searchYouTubeVideos(
      analysis.crop !== 'unknown' ? analysis.crop : undefined,
      diseases[0]?.name,
      4,
    );

    return this.formatScanResult(row, analysis, relatedArticles, relatedVideos);
  }

  private resolveImageUrl(imageUrl: string): string {
    const trimmed = imageUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const base =
      this.config.get<string>('PUBLIC_API_URL')?.trim() ||
      (this.config.get<string>('RAILWAY_PUBLIC_DOMAIN')
        ? `https://${this.config.get<string>('RAILWAY_PUBLIC_DOMAIN')}`
        : `http://localhost:${this.config.get<string>('PORT') ?? '3000'}`);
    return `${base.replace(/\/$/, '')}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }

  private async fetchImageAsBase64(url: string): Promise<{
    base64: string;
    mimeType: string;
  }> {
    let response;
    try {
      response = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        maxContentLength: MAX_IMAGE_BYTES,
        maxBodyLength: MAX_IMAGE_BYTES,
      });
    } catch {
      throw new BadRequestException(
        'Could not download the photo. Upload again and retry.',
      );
    }

    const contentType = String(response.headers['content-type'] ?? 'image/jpeg');
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('File must be an image (JPEG, PNG, or WebP).');
    }

    const buffer = Buffer.from(response.data);
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image is too large. Use a photo under 5 MB.');
    }

    return {
      base64: buffer.toString('base64'),
      mimeType: contentType.split(';')[0],
    };
  }

  private toPrismaHealthStatus(
    status: GeminiCropAnalysis['healthStatus'],
  ): CropHealthStatus {
    return status as CropHealthStatus;
  }

  private parseDiseases(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((d) => d && typeof d === 'object' && 'name' in d)
      .map((d) => ({
        name: String((d as { name: unknown }).name),
        confidence: Number((d as { confidence?: unknown }).confidence) || 0,
        notes:
          typeof (d as { notes?: unknown }).notes === 'string'
            ? (d as { notes: string }).notes
            : undefined,
      }));
  }

  private formatScanSummary(row: {
    id: string;
    imageUrl: string;
    crop: string | null;
    confidence: number | null;
    healthStatus: CropHealthStatus | null;
    advice: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      imageUrl: row.imageUrl,
      crop: row.crop,
      confidence: row.confidence,
      healthStatus: row.healthStatus,
      advice: row.advice,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private formatScanResult(
    row: { id: string; imageUrl: string; createdAt: Date },
    analysis: GeminiCropAnalysis,
    relatedArticles: Awaited<ReturnType<KnowledgeService['findRelated']>>,
    relatedVideos: Awaited<ReturnType<KnowledgeService['searchYouTubeVideos']>>,
  ) {
    return {
      id: row.id,
      imageUrl: row.imageUrl,
      crop: analysis.crop,
      confidence: analysis.confidence,
      healthStatus: analysis.healthStatus,
      diseases: analysis.diseases,
      advice: analysis.advice,
      disclaimer: analysis.disclaimer,
      relatedArticles,
      relatedVideos,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
