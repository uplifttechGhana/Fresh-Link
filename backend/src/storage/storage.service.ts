import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios, { isAxiosError } from 'axios';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

export type StorageProvider = 'cloudinary' | 's3' | 'local';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;
  private region: string;
  private provider: StorageProvider = 'local';
  private cloudinaryCloudName = '';
  private cloudinaryApiKey = '';
  private cloudinaryApiSecret = '';

  /** Absolute path to the local uploads folder (backend/public/uploads). */
  static readonly LOCAL_UPLOADS_DIR = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'public',
    'uploads',
  );

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET ?? 'freshlink';
    this.publicUrl = (process.env.STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '');
    this.region = process.env.STORAGE_REGION ?? 'us-east-1';

    if (this.initCloudinary()) {
      this.provider = 'cloudinary';
      this.logger.log('[Storage] Cloudinary configured');
    } else if (this.initS3()) {
      this.provider = 's3';
      this.logger.log(
        `[Storage] S3 configured (bucket: ${this.bucket}, region: ${this.region})`,
      );
    } else {
      this.provider = 'local';
      this.logger.log(
        '[Storage] Cloud storage not configured — using local disk (backend/public/uploads)',
      );
      fs.mkdirSync(StorageService.LOCAL_UPLOADS_DIR, { recursive: true });
    }
  }

  get activeProvider(): StorageProvider {
    return this.provider;
  }

  /** @deprecated Use activeProvider === 's3' */
  get isS3Configured(): boolean {
    return this.s3 !== null;
  }

  get isCloudConfigured(): boolean {
    return this.provider === 'cloudinary' || this.provider === 's3';
  }

  private initCloudinary(): boolean {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) return false;

    this.cloudinaryCloudName = cloudName;
    this.cloudinaryApiKey = apiKey;
    this.cloudinaryApiSecret = apiSecret;
    return true;
  }

  private initS3(): boolean {
    if (!process.env.STORAGE_ACCESS_KEY_ID) return false;

    this.s3 = new S3Client({
      ...(process.env.STORAGE_ENDPOINT ? { endpoint: process.env.STORAGE_ENDPOINT } : {}),
      region: this.region,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',
      },
    });
    return true;
  }

  async save(
    buffer: Buffer,
    originalName: string,
    folder = 'produce',
    contentType = 'image/jpeg',
  ): Promise<string> {
    const isAudio = contentType.startsWith('audio/') || /\.(webm|m4a|mp4|ogg|wav)$/i.test(originalName);

    // Voice notes are stored locally in dev — Cloudinary image endpoint rejects audio.
    if (isAudio) {
      return this.saveLocally(buffer, originalName, folder);
    }

    if (this.provider === 'cloudinary') {
      return this.uploadToCloudinary(buffer, folder, contentType);
    }
    if (this.provider === 's3') {
      return this.uploadToS3(buffer, originalName, folder, contentType);
    }
    return this.saveLocally(buffer, originalName, folder);
  }

  saveLocally(
    buffer: Buffer,
    originalName: string,
    folder = 'produce',
  ): string {
    const ext = path.extname(originalName) || '.webm';
    const filename = `${uuidv4()}${ext}`;
    const dir = path.join(StorageService.LOCAL_UPLOADS_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
    return `/uploads/${folder}/${filename}`;
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    contentType: string,
  ): Promise<string> {
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = uuidv4();
    const cloudFolder = `freshlink/${folder}`;

    const params: Record<string, string | number> = {
      folder: cloudFolder,
      public_id: publicId,
      timestamp,
    };

    const signature = this.signCloudinaryParams(params);
    const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;

    const body = new URLSearchParams({
      file: dataUri,
      api_key: this.cloudinaryApiKey,
      timestamp: String(timestamp),
      signature,
      folder: cloudFolder,
      public_id: publicId,
    });

    try {
      const { data } = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/image/upload`,
        body.toString(),
        {
          timeout: 45000,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      if (!data?.secure_url) {
        const msg = data?.error?.message ?? 'Cloudinary upload failed: no URL returned';
        this.logger.error(`Cloudinary upload failed: ${msg}`);
        throw new BadRequestException(msg);
      }

      return data.secure_url as string;
    } catch (err) {
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message ??
          err.message;
        this.logger.error(`Cloudinary upload failed: ${msg}`);
        throw new BadRequestException(msg);
      }
      throw err;
    }
  }

  private signCloudinaryParams(params: Record<string, string | number>): string {
    const toSign = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return createHash('sha1')
      .update(toSign + this.cloudinaryApiSecret)
      .digest('hex');
  }

  async uploadToS3(
    buffer: Buffer,
    originalName: string,
    folder: string,
    contentType: string,
  ): Promise<string> {
    if (!this.s3) throw new Error('S3 not configured');

    const ext = path.extname(originalName) || '.jpg';
    const key = `${folder}/${uuidv4()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return this.buildPublicUrl(key);
  }

  async getPresignedUploadUrl(
    folder: string,
    extension: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; objectUrl: string; key: string }> {
    if (!this.s3) {
      throw new Error('S3 not configured');
    }

    const key = `${folder}/${uuidv4()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const objectUrl = this.buildPublicUrl(key);

    return { uploadUrl, objectUrl, key };
  }

  private buildPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    if (process.env.STORAGE_ENDPOINT) {
      return key;
    }
    const host =
      this.region === 'us-east-1'
        ? `${this.bucket}.s3.amazonaws.com`
        : `${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `https://${host}/${key}`;
  }

  async deleteObject(key: string) {
    if (!this.s3) return;
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.error(`Failed to delete object ${key}`, err);
    }
  }
}
