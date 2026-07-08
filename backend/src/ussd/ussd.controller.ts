import { Controller, Post, Get, Body, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { UssdService } from './ussd.service';
import { Public } from '../common/decorators/public.decorator';
import { Response } from 'express';

/**
 * Africa's Talking USSD webhook endpoint.
 *
 * AT posts to this URL on every USSD session step.
 * The response MUST be plain text starting with CON (continue) or END (terminate).
 *
 * Setup in Africa's Talking dashboard:
 *   Callback URL: https://your-api-domain.com/api/v1/ussd/callback
 */

class SimulateUssdDto {
  @IsString()
  sessionId: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  serviceCode?: string;
}

@ApiTags('ussd')
@Controller('ussd')
export class UssdController {
  constructor(private service: UssdService) {}

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'USSD shortcode and simulator settings' })
  getConfig() {
    return {
      shortcode: this.service.getShortcode(),
      dialHint: 'Works on basic GSM — no mobile data required on a real phone.',
    };
  }

  /**
   * Real Africa's Talking webhook — used in production.
   * AT sends form-encoded body; we respond with plain text.
   */
  @Public()
  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: "Africa's Talking USSD webhook — receives session steps" })
  async handleCallback(
    @Body('sessionId') sessionId: string,
    @Body('serviceCode') serviceCode: string,
    @Body('phoneNumber') phoneNumber: string,
    @Body('text') text: string,
    @Res() res: Response,
  ) {
    const response = await this.service.handleRequest({
      sessionId,
      serviceCode: serviceCode ?? '',
      phoneNumber,
      text: text ?? '',
    });
    res.setHeader('Content-Type', 'text/plain');
    res.send(response);
  }

  /**
   * Development/testing endpoint — accepts JSON, returns JSON.
   * Used by the in-app USSD simulator on the frontend.
   */
  @Public()
  @Post('simulate')
  @HttpCode(200)
  @ApiOperation({ summary: 'USSD simulator for development/testing — accepts JSON' })
  @ApiBody({ type: SimulateUssdDto })
  async simulate(@Body() body: SimulateUssdDto) {
    const response = await this.service.handleRequest({
      sessionId: body.sessionId,
      serviceCode: body.serviceCode ?? this.service.getShortcode(),
      phoneNumber: body.phoneNumber,
      text: body.text ?? '',
    });
    const isCon = response.startsWith('CON ');
    return {
      type: isCon ? 'CON' : 'END',
      text: response.replace(/^(CON|END) /, ''),
      raw: response,
    };
  }
}
