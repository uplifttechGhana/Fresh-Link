import { Controller, Get, Patch, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import {
  UpdateUserDto,
  UpdateFarmerProfileDto,
  UpdateTransportProfileDto,
  UpdateInvestorProfileDto,
  RegisterDeviceTokenDto,
} from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get full current user profile' })
  getMe(@CurrentUser() user: any) {
    return this.users.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch('me/farmer-profile')
  @Roles('farmer')
  @ApiOperation({ summary: 'Update farmer profile details' })
  updateFarmerProfile(@CurrentUser() user: any, @Body() dto: UpdateFarmerProfileDto) {
    return this.users.updateFarmerProfile(user.id, dto);
  }

  @Patch('me/transport-profile')
  @Roles('transport')
  @ApiOperation({ summary: 'Update transport profile details' })
  updateTransportProfile(@CurrentUser() user: any, @Body() dto: UpdateTransportProfileDto) {
    return this.users.updateTransportProfile(user.id, dto);
  }

  @Patch('me/investor-profile')
  @Roles('investor')
  @ApiOperation({ summary: 'Update investor profile details' })
  updateInvestorProfile(@CurrentUser() user: any, @Body() dto: UpdateInvestorProfileDto) {
    return this.users.updateInvestorProfile(user.id, dto);
  }

  @Post('me/device-token')
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  registerDeviceToken(@CurrentUser() user: any, @Body() dto: RegisterDeviceTokenDto) {
    return this.users.registerDeviceToken(user.id, dto);
  }

  @Public()
  @Get('farmers')
  @ApiOperation({ summary: 'List / search all farmers' })
  listFarmers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.users.listFarmers({
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Public()
  @Get('farmers/:id')
  @ApiOperation({ summary: 'Get public farmer profile' })
  getFarmerProfile(@Param('id') id: string) {
    return this.users.getFarmerPublicProfile(id);
  }

  @Get('saved-farmers')
  @ApiOperation({ summary: 'Get all farmers saved/followed by current buyer' })
  getSavedFarmers(@CurrentUser() user: any) {
    return this.users.getSavedFarmers(user.id);
  }

  @Post('saved-farmers/:farmerId')
  @ApiOperation({ summary: 'Save / follow a farmer' })
  saveFarmer(@CurrentUser() user: any, @Param('farmerId') farmerId: string) {
    return this.users.saveFarmer(user.id, farmerId);
  }

  @Delete('saved-farmers/:farmerId')
  @ApiOperation({ summary: 'Unsave / unfollow a farmer' })
  unsaveFarmer(@CurrentUser() user: any, @Param('farmerId') farmerId: string) {
    return this.users.unsaveFarmer(user.id, farmerId);
  }
}
