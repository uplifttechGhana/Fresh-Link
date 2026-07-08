import { Module, forwardRef } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PaystackTransfersService } from './paystack-transfers.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, PaystackTransfersService],
  exports: [WalletService],
})
export class WalletModule {}
