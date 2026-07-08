import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { UssdModule } from '../ussd/ussd.module';

@Module({
  imports: [UssdModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
