import { Module } from '@nestjs/common';
import { CropScanController } from './crop-scan.controller';
import { CropScanService } from './crop-scan.service';
import { GeminiService } from './gemini.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [KnowledgeModule],
  controllers: [CropScanController],
  providers: [CropScanService, GeminiService],
  exports: [GeminiService],
})
export class CropScanModule {}
