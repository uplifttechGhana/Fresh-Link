import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePayoutAccountDto, WithdrawDto } from './dto/wallet.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private service: WalletService) {}

  @Get()
  @Roles('farmer', 'transport', 'investor')
  @ApiOperation({ summary: 'Get current user wallet balance and recent transactions' })
  getWallet(@CurrentUser() user: any) {
    return this.service.getWallet(user.id);
  }

  @Get('transactions')
  @Roles('farmer', 'transport', 'investor')
  @ApiOperation({ summary: 'Get paginated transaction history' })
  getTransactions(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.getTransactions(user.id, +page, +limit);
  }

  @Get('payout-providers')
  @Roles('farmer', 'transport', 'investor')
  @ApiOperation({ summary: 'List Paystack MoMo/bank providers for Ghana (test or live)' })
  listProviders(@Query('type') type: 'mobile_money' | 'bank' = 'mobile_money') {
    return this.service.listPayoutProviders(type);
  }

  @Get('payout-accounts')
  @Roles('farmer', 'transport', 'investor')
  @ApiOperation({ summary: 'List saved payout accounts for withdrawals' })
  listPayoutAccounts(@CurrentUser() user: any) {
    return this.service.listPayoutAccounts(user.id);
  }

  @Post('payout-accounts')
  @Roles('farmer', 'transport', 'investor')
  @ApiOperation({ summary: 'Register a MoMo or bank account with Paystack for payouts' })
  createPayoutAccount(@CurrentUser() user: any, @Body() dto: CreatePayoutAccountDto) {
    return this.service.createPayoutAccount(user.id, dto);
  }

  @Post('withdraw')
  @Roles('farmer', 'transport', 'investor')
  @ApiOperation({ summary: 'Withdraw wallet balance to saved payout account via Paystack' })
  withdraw(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return this.service.withdraw(user.id, dto);
  }
}
