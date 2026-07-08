import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard stats' })
  stats() {
    return this.service.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with filters' })
  users(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getUsers(+page, +limit, role, search);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user account' })
  suspend(@Param('id') id: string) {
    return this.service.suspendUser(id);
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate a suspended user account' })
  activate(@Param('id') id: string) {
    return this.service.activateUser(id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  orders(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.service.getAllOrders(+page, +limit, status);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List all wallet transactions' })
  transactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.getAllTransactions(+page, +limit);
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Revenue time-series for Reports page' })
  revenue(@Query('range') range: 'this_week' | 'last_week' = 'this_week') {
    return this.service.getRevenueSeries(range);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes' })
  disputes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.service.getDisputes(+page, +limit, status);
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  resolveDispute(@Param('id') id: string) {
    return this.service.resolveDispute(id);
  }

  @Post('disputes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Report a dispute (any authenticated user)' })
  createDispute(
    @CurrentUser() user: any,
    @Body() body: { orderId: string; reason: string; description?: string },
  ) {
    return this.service.createDispute(user.id, body.orderId, body.reason, body.description);
  }
}
