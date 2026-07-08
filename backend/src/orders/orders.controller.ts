import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreateReviewDto } from './dto/order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ReviewTargetType } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Post()
  @Roles('buyer')
  @ApiOperation({ summary: 'Place a new order' })
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.service.create(user.id, dto);
  }

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Checkout config: delivery fee etc.' })
  config() {
    return this.service.getConfig();
  }

  @Get('demand-analytics')
  @Roles('farmer')
  @ApiOperation({ summary: 'Weekly demand (order quantity) for farmer produce' })
  demandAnalytics(@CurrentUser() user: any) {
    return this.service.getDemandAnalytics(user.id);
  }

  @Get('buyer')
  @Roles('buyer')
  @ApiOperation({ summary: 'Get buyer order history' })
  buyerOrders(@CurrentUser() user: any) {
    return this.service.findBuyerOrders(user.id);
  }

  @Get('farmer')
  @Roles('farmer')
  @ApiOperation({ summary: 'Get farmer order requests' })
  farmerOrders(@CurrentUser() user: any) {
    return this.service.findFarmerOrders(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  @Roles('farmer')
  @ApiOperation({ summary: 'Update order status (farmer only)' })
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, user.id, dto);
  }

  @Patch(':id/cancel')
  @Roles('buyer')
  @ApiOperation({ summary: 'Cancel an order (buyer only)' })
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.cancelOrder(id, user.id);
  }

  @Get(':id/invoice')
  @Roles('buyer')
  @ApiOperation({ summary: 'Get or generate invoice for order' })
  invoice(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.createOrGetInvoice(id, user.id);
  }

  @Post(':id/reviews/farmer')
  @Roles('buyer')
  @ApiOperation({ summary: 'Leave a review for the farmer' })
  reviewFarmer(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.service.addReview(id, user.id, ReviewTargetType.farmer, dto);
  }

  @Post(':id/reviews/transport')
  @Roles('buyer')
  @ApiOperation({ summary: 'Leave a review for the transporter' })
  reviewTransport(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.service.addReview(id, user.id, ReviewTargetType.transport, dto);
  }

  @Get('reviews/farmer/:farmerId')
  @ApiOperation({ summary: 'Get reviews for a farmer' })
  farmerReviews(@Param('farmerId') farmerId: string) {
    return this.service.getReviews(ReviewTargetType.farmer, farmerId);
  }

  @Get('reviews/transport/:transporterId')
  @ApiOperation({ summary: 'Get reviews for a transporter' })
  transportReviews(@Param('transporterId') transporterId: string) {
    return this.service.getReviews(ReviewTargetType.transport, transporterId);
  }

}
