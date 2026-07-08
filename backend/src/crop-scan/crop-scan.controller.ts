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
import { ScanCropDto } from './dto/scan-crop.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('crops')
@Controller('crops')
export class CropScanController {
  constructor(private service: CropScanService) {}

  @Post('scan')
  @Roles('farmer')
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 3600000, limit: 15 } })
  @ApiOperation({ summary: 'Analyze a crop photo with Gemini AI' })
  scan(@CurrentUser() user: { id: string }, @Body() dto: ScanCropDto) {
    return this.service.scan(user.id, dto.imageUrl);
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
