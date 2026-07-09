import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CropScanService } from './crop-scan.service';
import { GeminiService } from './gemini.service';
import { ScanCropDto } from './dto/scan-crop.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('crops')
@Controller('crops')
export class CropScanController {
  constructor(
    private service: CropScanService,
    private gemini: GeminiService,
  ) {}

  @Post('scan')
  @Roles('farmer')
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 3600000, limit: 15 } })
  @ApiOperation({ summary: 'Analyze a crop photo with Gemini AI' })
  scan(@CurrentUser() user: { id: string }, @Body() dto: ScanCropDto) {
    return this.service.scan(user.id, dto.imageUrl);
  }

  @Post('chat')
  @Roles('farmer')
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Chat with Gemini AI agricultural assistant' })
  async chatWithGemini(@Body() dto: ChatMessageDto) {
    const reply = await this.gemini.chat(dto.message);
    return { reply };
  }

  @Get('scans')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my recent crop scans' })
  listMine(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? parseInt(limit, 10) : 20;
    return this.service.listMine(user.id, Number.isNaN(parsed) ? 20 : parsed);
  }

  @Get('scans/:id')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one crop scan with related knowledge' })
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(user.id, id);
  }
}
