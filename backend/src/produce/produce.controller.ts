import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProduceService } from './produce.service';
import { CreateProduceDto, UpdateProduceDto, ProduceQueryDto } from './dto/produce.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('produce')
@Controller('produce')
export class ProduceController {
  constructor(private service: ProduceService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse all active produce listings' })
  findAll(@Query() query: ProduceQueryDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Distinct produce categories sorted by listing count' })
  getCategories() {
    return this.service.getCategories();
  }

  @Public()
  @Get('compare')
  @ApiOperation({ summary: 'Price comparison for a produce type' })
  compare(@Query('title') title: string) {
    return this.service.getPriceComparison(title);
  }

  @Get('my/listings')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get farmer\'s own listings' })
  myListings(@CurrentUser() user: any) {
    return this.service.findByFarmer(user.id);
  }

  @Get('my/price-trends')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Last 7-day average price trend across active listings' })
  priceTrends(@CurrentUser() user: any) {
    return this.service.getPriceTrends(user.id);
  }

  // ── Favorites (buyer) ──────────────────────────────────────────────────────

  @Get('favorites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated buyer\'s favorite produce' })
  getFavorites(@CurrentUser() user: any) {
    return this.service.getFavorites(user.id);
  }

  @Get('favorites/ids')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get IDs of favorites (for quick lookup)' })
  getFavoriteIds(@CurrentUser() user: any) {
    return this.service.getFavoriteIds(user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single produce listing' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('favorites/:produceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add produce to favorites' })
  addFavorite(@CurrentUser() user: any, @Param('produceId') produceId: string) {
    return this.service.addFavorite(user.id, produceId);
  }

  @Delete('favorites/:produceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove produce from favorites' })
  removeFavorite(@CurrentUser() user: any, @Param('produceId') produceId: string) {
    return this.service.removeFavorite(user.id, produceId);
  }

  // ───────────────────────────────────────────────────────────────────────────

  @Post()
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new produce listing' })
  create(@CurrentUser() user: any, @Body() dto: CreateProduceDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update produce listing' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProduceDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete (soft) a produce listing' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
