import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { UssdModule } from '../ussd/ussd.module';
import { CropScanModule } from '../crop-scan/crop-scan.module';

@Module({
  imports: [UssdModule, CropScanModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
