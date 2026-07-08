import { Global, Module } from '@nestjs/common';
import { AfricasTalkingSmsService } from './africas-talking-sms.service';

@Global()
@Module({
  providers: [AfricasTalkingSmsService],
  exports: [AfricasTalkingSmsService],
})
export class SmsModule {}
