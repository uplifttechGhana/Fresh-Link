import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AfricasTalkingSmsService } from '../sms/africas-talking-sms.service';
import { UssdService } from '../ussd/ussd.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private sms: AfricasTalkingSmsService,
    private ussd: UssdService,
  ) {}

  @Public()
  @Get('africas-talking/status')
  @ApiOperation({ summary: "Africa's Talking integration status (SMS + USSD)" })
  getStatus() {
    const sms = this.sms.getStatus();
    return {
      sms,
      ussd: {
        shortcode: this.ussd.getShortcode(),
        callbackPath: '/api/v1/ussd/callback',
        simulatePath: '/api/v1/ussd/simulate',
        setupHint:
          'In AT dashboard set USSD Callback URL to https://YOUR_PUBLIC_DOMAIN/api/v1/ussd/callback (use ngrok for local dev).',
      },
    };
  }
}
