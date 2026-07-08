import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentMethodsService, CreatePaymentMethodDto } from './payment-methods.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payment-methods')
@ApiBearerAuth()
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private service: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: "List user's saved payment methods" })
  list(@CurrentUser() user: any) {
    return this.service.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new payment method' })
  create(@CurrentUser() user: any, @Body() dto: CreatePaymentMethodDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set a payment method as default' })
  setDefault(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.setDefault(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a payment method' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
