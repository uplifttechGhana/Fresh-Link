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

const MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

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

  private readApiKey(): string | null {
    const raw = this.config.get<string>('GEMINI_API_KEY');
    if (!raw) return null;
    const trimmed = raw.trim().replace(/^["']|["']$/g, '');
    return trimmed || null;
  }

  private configuredModels(): string[] {
    const preferred = this.config.get<string>('GEMINI_MODEL')?.trim();
    if (preferred) return [preferred, ...MODEL_FALLBACKS.filter((m) => m !== preferred)];
    return [...MODEL_FALLBACKS];
  }

  async getStatus(verify = false) {
    const apiKey = this.readApiKey();
    const models = this.configuredModels();
    const model = models[0];

    const base = {
      configured: !!apiKey,
      model,
      modelsTried: models,
      keyFormatOk: apiKey ? apiKey.startsWith('AIza') : false,
      hint: apiKey
        ? apiKey.startsWith('AIza')
          ? 'Crop scan is ready. Farmers can upload photos from Knowledge Hub → Scan Crop.'
          : 'GEMINI_API_KEY is set but does not look like a Google AI Studio key (expected AIza…). Create one at https://aistudio.google.com/apikey'
        : 'Set GEMINI_API_KEY in Railway/backend .env (Google AI Studio).',
    };

    if (!verify || !apiKey) return base;

    const verification = await this.verifyConnection();
    return { ...base, ...verification };
  }

  async verifyConnection(): Promise<{
    verified: boolean;
    workingModel: string | null;
    error: string | null;
  }> {
    const apiKey = this.readApiKey();
    if (!apiKey) {
      return { verified: false, workingModel: null, error: 'GEMINI_API_KEY is not set' };
    }

    for (const model of this.configuredModels()) {
      try {
        await this.generateText(model, apiKey, 'Reply with exactly: ok');
        return { verified: true, workingModel: model, error: null };
      } catch (err) {
        const msg = this.extractErrorMessage(err);
        this.logger.warn(`Gemini verify failed for ${model}: ${msg}`);
        if (this.isAuthError(err)) {
          return {
            verified: false,
            workingModel: null,
            error: msg,
          };
        }
      }
    }

    return {
      verified: false,
      workingModel: null,
      error: 'No Gemini model responded. Check API key and enable Generative Language API.',
    };
  }

  async analyzeCropImage(
    imageBase64: string,
    mimeType: string,
  ): Promise<GeminiCropAnalysis> {
    const apiKey = this.readApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Crop scan is not configured. Ask an admin to set GEMINI_API_KEY.',
      );
    }

    if (!apiKey.startsWith('AIza')) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY looks invalid. Create a key at Google AI Studio (starts with AIza).',
      );
    }

    const errors: string[] = [];

    for (const model of this.configuredModels()) {
      try {
        const text = await this.generateWithImage(
          model,
          apiKey,
          SCAN_PROMPT,
          imageBase64,
          mimeType,
        );
        if (!text) throw new Error('Empty response from Gemini');
        return this.parseAnalysis(text);
      } catch (err) {
        const msg = this.extractErrorMessage(err);
        errors.push(`${model}: ${msg}`);
        this.logger.warn(`Gemini crop scan failed for ${model}: ${msg}`);
        if (this.isAuthError(err)) break;
      }
    }

    throw new ServiceUnavailableException(
      errors[0] ?? 'Crop scan failed. Try again with a clearer photo.',
    );
  }

  private async generateText(model: string, apiKey: string, prompt: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const { data } = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0 },
      },
      {
        headers: { 'x-goog-api-key': apiKey },
        timeout: 20000,
      },
    );

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('')
        .trim() ?? '';

    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  private async generateWithImage(
    model: string,
    apiKey: string,
    prompt: string,
    imageBase64: string,
    mimeType: string,
  ) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const { data } = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              { text: prompt },
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
        headers: { 'x-goog-api-key': apiKey },
        timeout: 45000,
      },
    );

    return (
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? '')
        .join('')
        .trim() ?? ''
    );
  }

  private extractErrorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const apiMsg = (err.response?.data as { error?: { message?: string } })?.error
        ?.message;
      return apiMsg ?? err.message;
    }
    return err instanceof Error ? err.message : 'Unknown error';
  }

  private isAuthError(err: unknown): boolean {
    if (!axios.isAxiosError(err)) return false;
    const status = err.response?.status;
    const reason = (
      err.response?.data as {
        error?: { details?: Array<{ reason?: string }> };
      }
    )?.error?.details?.[0]?.reason;
    return status === 401 || status === 403 || reason === 'API_KEY_INVALID';
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
