import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GeminiDiseaseFinding {
  name: string;
  confidence: number;
  notes?: string;
}

export type GeminiHealthStatus =
  | 'healthy'
  | 'possible_disease'
  | 'possible_pest'
  | 'unclear';

export interface GeminiCropAnalysis {
  crop: string;
  confidence: number;
  healthStatus: GeminiHealthStatus;
  diseases: GeminiDiseaseFinding[];
  advice: string;
  disclaimer: string;
}

const SCAN_PROMPT = `You are an agricultural assistant for farmers in Ghana. Analyze this crop or plant photo.

Respond ONLY with valid JSON matching this schema (no markdown):
{
  "crop": "best guess crop or plant name",
  "confidence": 0.0 to 1.0,
  "healthStatus": "healthy" | "possible_disease" | "possible_pest" | "unclear",
  "diseases": [{"name": "issue name", "confidence": 0.0 to 1.0, "notes": "brief observation"}],
  "advice": "short practical next steps for a Ghana farmer",
  "disclaimer": "This is AI guidance, not a substitute for inspection by an agronomist or extension officer."
}

If the image is not a plant or crop, set healthStatus to "unclear", crop to "unknown", and explain in advice.
Focus on common Ghana crops: maize, cassava, tomato, pepper, cocoa, plantain, yam, rice, groundnut, cowpea, okra.`;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private config: ConfigService) {}

  getStatus() {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    const model =
      this.config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-2.0-flash';
    return {
      configured: !!apiKey,
      model,
      hint: apiKey
        ? 'Crop scan is ready. Farmers can upload photos from Knowledge Hub → Scan Crop.'
        : 'Set GEMINI_API_KEY in Railway/backend .env (Google AI Studio).',
    };
  }

  async analyzeCropImage(
    imageBase64: string,
    mimeType: string,
  ): Promise<GeminiCropAnalysis> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Crop scan is not configured. Ask an admin to set GEMINI_API_KEY.',
      );
    }

    const model =
      this.config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const { data } = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                { text: SCAN_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        },
        {
          params: { key: apiKey },
          timeout: 45000,
        },
      );

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? '')
          .join('')
          .trim() ?? '';

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return this.parseAnalysis(text);
    } catch (err) {
      this.logger.error(`Gemini crop scan failed: ${(err as Error).message}`);
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { error?: { message?: string } })?.error
            ?.message ?? err.message;
        throw new ServiceUnavailableException(`Crop scan failed: ${msg}`);
      }
      throw err;
    }
  }

  private parseAnalysis(raw: string): GeminiCropAnalysis {
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let parsed: Partial<GeminiCropAnalysis>;
    try {
      parsed = JSON.parse(jsonText) as Partial<GeminiCropAnalysis>;
    } catch {
      throw new ServiceUnavailableException(
        'Could not read crop scan results. Try another photo with better lighting.',
      );
    }

    const healthStatus = this.normalizeHealthStatus(parsed.healthStatus);
    const diseases = Array.isArray(parsed.diseases)
      ? parsed.diseases
          .filter((d) => d && typeof d.name === 'string')
          .map((d) => ({
            name: d.name.trim(),
            confidence: this.clamp01(Number(d.confidence) || 0),
            notes: typeof d.notes === 'string' ? d.notes : undefined,
          }))
      : [];

    return {
      crop: typeof parsed.crop === 'string' ? parsed.crop.trim() : 'unknown',
      confidence: this.clamp01(Number(parsed.confidence) || 0),
      healthStatus,
      diseases,
      advice:
        typeof parsed.advice === 'string'
          ? parsed.advice.trim()
          : 'Take a clearer close-up photo of affected leaves or fruit and consult your local extension officer.',
      disclaimer:
        typeof parsed.disclaimer === 'string'
          ? parsed.disclaimer.trim()
          : 'This is AI guidance, not a substitute for inspection by an agronomist or extension officer.',
    };
  }

  private normalizeHealthStatus(value: unknown): GeminiHealthStatus {
    const allowed: GeminiHealthStatus[] = [
      'healthy',
      'possible_disease',
      'possible_pest',
      'unclear',
    ];
    if (typeof value === 'string' && allowed.includes(value as GeminiHealthStatus)) {
      return value as GeminiHealthStatus;
    }
    return 'unclear';
  }

  private clamp01(n: number): number {
    if (Number.isNaN(n)) return 0;
    return Math.min(1, Math.max(0, n));
  }
}
