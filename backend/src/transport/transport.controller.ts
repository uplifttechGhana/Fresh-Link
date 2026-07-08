import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TransportService } from './transport.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { TransportJobStatus } from '@prisma/client';
import { UpdateJobStatusDto } from './dto/transport.dto';

class UpdateLocationDto {
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
}
class SetAvailabilityDto { @IsBoolean() isAvailable: boolean; }
class RequestTransportDto {
  @IsString() pickup: string;
  @IsString() dropoff: string;
  @IsNumber() @IsOptional() distance?: number;
  @IsNumber() @IsOptional() weight?: number;
  @IsString() @IsOptional() notes?: string;
}

@ApiTags('transport')
@ApiBearerAuth()
@Controller('transport')
export class TransportController {
  constructor(private service: TransportService) {}

  @Get('profile')
  @Roles('transport')
  @ApiOperation({ summary: 'Get transporter profile (availability, vehicle, location)' })
  profile(@CurrentUser() user: any) {
    return this.service.getProfile(user.id);
  }

  @Get('jobs/available')
  @Roles('transport')
  @ApiOperation({ summary: 'Get available transport jobs in area' })
  availableJobs(@CurrentUser() user: any) {
    return this.service.getAvailableJobs(user.id);
  }

  @Get('jobs')
  @Roles('transport')
  @ApiOperation({ summary: 'Get transporter job history' })
  myJobs(@CurrentUser() user: any, @Query('status') status?: TransportJobStatus) {
    return this.service.getTransporterJobs(user.id, status);
  }

  @Patch('jobs/:id/accept')
  @Roles('transport')
  @ApiOperation({ summary: 'Accept a transport job' })
  acceptJob(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.acceptJob(id, user.id);
  }

  @Patch('jobs/:id/status')
  @Roles('transport')
  @ApiOperation({ summary: 'Update job status (picked_up, in_transit, delivered)' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.service.updateJobStatus(id, user.id, dto.status);
  }

  @Patch('location')
  @Roles('transport')
  @ApiOperation({ summary: 'Update transporter current location' })
  updateLocation(@CurrentUser() user: any, @Body() dto: UpdateLocationDto) {
    return this.service.updateLocation(user.id, dto.latitude, dto.longitude);
  }

  @Patch('availability')
  @Roles('transport')
  @ApiOperation({ summary: 'Toggle availability for new jobs' })
  setAvailability(@CurrentUser() user: any, @Body() dto: SetAvailabilityDto) {
    return this.service.setAvailability(user.id, dto.isAvailable);
  }

  @Post('requests')
  @Roles('farmer')
  @ApiOperation({ summary: 'Farmer creates a transport request' })
  createRequest(@CurrentUser() user: any, @Body() dto: RequestTransportDto) {
    return this.service.createTransportRequest(user.id, dto);
  }
}
