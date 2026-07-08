import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvestorService } from './investor.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { IsNumber, IsString, Min } from 'class-validator';
import { CreateFundingRequestDto } from './dto/create-funding-request.dto';

class CreateInvestmentDto {
  @IsString() requestId: string;
  @IsNumber() @Min(1) amount: number;
}

@ApiTags('investor')
@Controller('investor')
export class InvestorController {
  constructor(private service: InvestorService) {}

  @Public()
  @Get('funding-requests')
  @ApiOperation({ summary: 'Browse open farmer funding requests' })
  getFundingRequests(@Query('status') status?: string) {
    return this.service.getFundingRequests(status);
  }

  // ── Static sub-routes must come BEFORE :id to avoid being swallowed ────────

  @Get('funding-requests/mine')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Farmer's own funding requests" })
  myFundingRequests(@CurrentUser() user: any) {
    return this.service.getMyFundingRequestsAsFarmer(user.id);
  }

  @Post('funding-requests')
  @Roles('farmer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Farmer creates a funding request' })
  createFundingRequest(@CurrentUser() user: any, @Body() dto: CreateFundingRequestDto) {
    return this.service.createFundingRequest(user.id, dto);
  }

  @Public()
  @Get('funding-requests/:id')
  @ApiOperation({ summary: 'Get a funding request detail' })
  getFundingRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getFundingRequest(id);
  }

  // ── Investments ─────────────────────────────────────────────────────────────

  @Get('investments')
  @Roles('investor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get investor\'s own investments' })
  myInvestments(@CurrentUser() user: any) {
    return this.service.getMyInvestments(user.id);
  }

  @Post('investments')
  @Roles('investor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an investment in a funding request' })
  invest(@CurrentUser() user: any, @Body() dto: CreateInvestmentDto) {
    return this.service.createInvestment(user.id, dto.requestId, dto.amount);
  }
}
