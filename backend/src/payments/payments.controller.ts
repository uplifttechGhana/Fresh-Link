import { Controller, Post, Body, Param, Req, RawBodyRequest, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post('orders/:orderId/initialize')
  @Roles('buyer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize Paystack payment for an order' })
  initOrderPayment(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.service.initializeOrderPayment(orderId, user.id);
  }

  @Post('investments/:investmentId/initialize')
  @Roles('investor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize Paystack payment for an investment' })
  initInvestmentPayment(@CurrentUser() user: any, @Param('investmentId') id: string) {
    return this.service.initializeInvestmentPayment(id, user.id);
  }

  @Public()
  @Post('webhook/paystack')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.service.handleWebhook(req.rawBody!, signature);
  }
}
