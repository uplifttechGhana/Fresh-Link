import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService, CreateKnowledgeDto } from './knowledge.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private service: KnowledgeService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List knowledge articles / videos' })
  list(
    @Query('isVideo') isVideo?: string,
    @Query('category') category?: string,
  ) {
    const videoFilter = isVideo === 'true' ? true : isVideo === 'false' ? false : undefined;
    return this.service.list(videoFilter, category);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Distinct knowledge categories' })
  categories() {
    return this.service.categories();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single article / video' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Create knowledge content (admin)' })
  create(@Body() dto: CreateKnowledgeDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles('admin')
  @ApiOperation({ summary: 'Delete knowledge content (admin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
