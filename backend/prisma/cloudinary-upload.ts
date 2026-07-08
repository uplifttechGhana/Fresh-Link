import axios from 'axios';
import { createHash } from 'crypto';

export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}

async function fetchImageAsDataUri(sourceUrl: string): Promise<string> {
  const { data, headers } = await axios.get(sourceUrl, {
    responseType: 'arraybuffer',
    timeout: 45000,
    maxRedirects: 5,
    headers: { 'User-Agent': 'FreshLink-Seed/1.0' },
  });

  const contentType = (headers['content-type'] as string) || 'image/jpeg';
  const base64 = Buffer.from(data).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

export async function uploadImageUrlToCloudinary(options: {
  sourceUrl: string;
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  publicId: string;
}): Promise<string> {
  const dataUri = await fetchImageAsDataUri(options.sourceUrl);
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = {
    folder: options.folder,
    public_id: options.publicId,
    timestamp,
    overwrite: 1,
  };

  const signature = signCloudinaryParams(params, options.apiSecret);

  const body = new URLSearchParams({
    file: dataUri,
    api_key: options.apiKey,
    timestamp: String(timestamp),
    signature,
    folder: options.folder,
    public_id: options.publicId,
    overwrite: '1',
  });

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${options.cloudName}/image/upload`,
    body.toString(),
    {
      timeout: 120000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  if (!data?.secure_url) {
    throw new Error(`Cloudinary upload failed for ${options.publicId}`);
  }

  return data.secure_url as string;
}

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET');
  }

  return { cloudName, apiKey, apiSecret };
}
