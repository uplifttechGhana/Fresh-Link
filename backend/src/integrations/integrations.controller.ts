import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AfricasTalkingSmsService } from '../sms/africas-talking-sms.service';
import { UssdService } from '../ussd/ussd.service';
import { GeminiService } from '../crop-scan/gemini.service';
import type { Request } from 'express';

function publicApiBase(req?: Request): string | null {
  const fromEnv =
    process.env.PUBLIC_API_URL?.trim() ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : '');
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const host = req?.get('host');
  if (!host || host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return null;
  }
  const proto = req?.get('x-forwarded-proto') ?? req?.protocol ?? 'https';
  return `${proto}://${host}`;
}

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private sms: AfricasTalkingSmsService,
    private ussd: UssdService,
    private gemini: GeminiService,
  ) {}

  @Public()
  @Get('africas-talking/status')
  @ApiOperation({ summary: "Africa's Talking integration status (SMS + USSD)" })
  getStatus(@Req() req: Request) {
    const sms = this.sms.getStatus();
    const apiBase = publicApiBase(req);
    const callbackPath = '/api/v1/ussd/callback';

    return {
      sms,
      ussd: {
        shortcode: this.ussd.getShortcode(),
        callbackPath,
        simulatePath: '/api/v1/ussd/simulate',
        callbackUrl: apiBase ? `${apiBase}${callbackPath}` : null,
        setupHint: apiBase
          ? `In AT Sandbox → USSD → your service code → set Callback URL to ${apiBase}${callbackPath}`
          : 'In AT dashboard set USSD Callback URL to https://YOUR_PUBLIC_DOMAIN/api/v1/ussd/callback (use ngrok for local dev).',
      },
    };
  }

  @Public()
  @Get('gemini/status')
  @ApiOperation({ summary: 'Google Gemini crop scan integration status' })
  getGeminiStatus() {
    return this.gemini.getStatus();
  }
}
