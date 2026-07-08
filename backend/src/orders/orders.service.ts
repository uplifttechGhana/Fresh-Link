import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, CreateReviewDto } from './dto/order.dto';
import { OrderStatus, ReviewTargetType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(buyerId: string, dto: CreateOrderDto) {
    // Resolve all produce items and their farmers
    const produceIds = dto.items.map((i) => i.produceId);
    const produceList = await this.prisma.produceListing.findMany({
      where: { id: { in: produceIds }, status: 'active' },
      include: { farmer: true },
    });

    if (produceList.length !== produceIds.length) {
      throw new BadRequestException('One or more produce items are unavailable');
    }

    // All items must be from the same farmer (one order per farmer)
    const farmerIds = [...new Set(produceList.map((p) => p.farmerId))];
    if (farmerIds.length > 1) {
      throw new BadRequestException('All items in an order must be from the same farmer');
    }

    const farmer = produceList[0].farmer;

    // Build order items + calculate totals
    const orderItems = dto.items.map((item) => {
      const produce = produceList.find((p) => p.id === item.produceId)!;
      if (produce.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${produce.title}`);
      }
      return {
        produceId: item.produceId,
        quantity: item.quantity,
        unitPrice: produce.price,
        total: produce.price * item.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.total, 0);
    const deliveryFee = this.getDeliveryFee();
    const deliveryAddress = dto.deliveryAddress?.trim() ?? '';
    if (!deliveryAddress) {
      throw new BadRequestException('Delivery address is required.');
    }
    const total = subtotal + deliveryFee;

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        farmerId: farmer.id,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress,
        notes: dto.notes,
        items: { create: orderItems },
      },
      include: { items: { include: { produce: true } }, buyer: true },
    });

    // Decrement stock; auto-flag as out_of_stock when it hits 0
    for (const item of dto.items) {
      const current = produceList.find((p) => p.id === item.produceId)!;
      const newStock = current.stock - item.quantity;
      await this.prisma.produceListing.update({
        where: { id: item.produceId },
        data: {
          stock: { decrement: item.quantity },
          ...(newStock <= 0 && { status: 'out_of_stock' }),
        },
      });
    }

    // Notify the farmer about new order
    this.notifications.createNotification(
      farmer.userId,
      'order_update',
      'New Order Received',
      `You have a new order worth ₵${total.toFixed(2)} from ${order.buyer.name}`,
      { orderId: order.id },
    ).catch(() => undefined);

    return order;
  }

  async findBuyerOrders(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { produce: { select: { title: true, images: true } } } },
        farmer: { include: { user: { select: { name: true, avatarUrl: true } } } },
        transportJob: true,
        invoice: true,
      },
    });
  }

  async findFarmerOrders(userId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) throw new NotFoundException();
    return this.prisma.order.findMany({
      where: { farmerId: farmer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { produce: { select: { title: true, unit: true } } } },
        buyer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        transportJob: true,
      },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { produce: true } },
        buyer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        farmer: {
          include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
        },
        transportJob: true,
        invoice: true,
        conversation: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Enforce ownership
    if (
      userRole !== 'admin' &&
      order.buyerId !== userId &&
      order.farmer.userId !== userId
    ) {
      throw new ForbiddenException();
    }

    return order;
  }

  async updateStatus(orderId: string, userId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { farmer: true, transportJob: true },
    });
    if (!order) throw new NotFoundException();
    if (order.farmer.userId !== userId) throw new ForbiddenException();

    if (dto.status === 'delivered') {
      const job = order.transportJob;
      if (job && job.status !== 'delivered') {
        throw new BadRequestException(
          'A driver must complete this delivery before you can mark it delivered.',
        );
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status as OrderStatus },
      include: { transportJob: true },
    });

    if (dto.status === 'ready_for_pickup') {
      await this.ensureTransportJobForOrder({
        id: updated.id,
        deliveryAddress: updated.deliveryAddress,
        deliveryFee: updated.deliveryFee,
        farmer: order.farmer,
      });
    }

    // Notify the buyer of the status change
    const statusLabels: Record<string, string> = {
      confirmed: 'confirmed your order',
      packed: 'packed your order — ready for pickup',
      in_transit: 'Your order is on its way',
      delivered: 'Your order has been delivered',
      cancelled: 'cancelled your order',
    };
    const label = statusLabels[dto.status];
    if (label) {
      this.notifications.createNotification(
        order.buyerId,
        'order_update',
        'Order Update',
        label.startsWith('Your') ? label : `The farmer has ${label}`,
        { orderId },
      ).catch(() => undefined);
    }

    if (dto.status === 'ready_for_pickup') {
      return this.prisma.order.findUnique({
        where: { id: orderId },
        include: { transportJob: true },
      });
    }

    return updated;
  }

  private getDeliveryFee(): number {
    return 15;
  }

  private async ensureTransportJobForOrder(
    order: {
      id: string;
      deliveryAddress: string | null;
      deliveryFee: number;
      farmer: { location: string | null; farmName: string | null };
    },
  ) {
    const existing = await this.prisma.transportJob.findUnique({
      where: { orderId: order.id },
    });
    if (existing) return existing;

    const dropoff = order.deliveryAddress?.trim();
    if (!dropoff) {
      throw new BadRequestException(
        'This order has no delivery address. Ask the buyer to add one before drivers can accept it.',
      );
    }

    const pickup =
      order.farmer.location?.trim() ||
      order.farmer.farmName?.trim() ||
      'Farm pickup';
    const fee = order.deliveryFee > 0 ? order.deliveryFee : this.getDeliveryFee();

    return this.prisma.transportJob.create({
      data: {
        orderId: order.id,
        pickup,
        dropoff,
        fee,
        status: 'pending',
      },
    });
  }

  async cancelOrder(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (!['pending', 'accepted'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    // Restore stock; if it was auto-flagged out_of_stock, flip back to active
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { produce: true },
    });
    for (const item of items) {
      const newStock = item.produce.stock + item.quantity;
      await this.prisma.produceListing.update({
        where: { id: item.produceId },
        data: {
          stock: { increment: item.quantity },
          ...(item.produce.status === 'out_of_stock' && newStock > 0 && { status: 'active' }),
        },
      });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });
  }

  async createOrGetInvoice(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true },
    });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== buyerId) throw new ForbiddenException();

    if (order.invoice) return order.invoice;

    const count = await this.prisma.invoice.count();
    const number = `INV-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.invoice.create({
      data: { orderId, number },
    });
  }

  async addReview(orderId: string, authorId: string, targetType: ReviewTargetType, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { farmer: true, transportJob: true },
    });
    if (!order) throw new NotFoundException();

    let targetId: string;
    if (targetType === 'farmer') {
      if (order.buyerId !== authorId) throw new ForbiddenException();
      targetId = order.farmer.userId;
    } else {
      if (!order.transportJob?.transporterId) {
        throw new BadRequestException('No assigned transporter for this order');
      }
      const transporter = await this.prisma.transportProfile.findUnique({
        where: { id: order.transportJob.transporterId },
      });
      if (!transporter) throw new BadRequestException('Transporter not found');
      targetId = transporter.userId;
    }

    const review = await this.prisma.review.create({
      data: { targetType, targetId, orderId, authorId, rating: dto.rating, comment: dto.comment },
    });

    // Update aggregated rating on profile
    const reviews = await this.prisma.review.findMany({ where: { targetId, targetType } });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    if (targetType === 'farmer') {
      await this.prisma.farmerProfile.update({
        where: { userId: targetId },
        data: { rating: avg, totalReviews: reviews.length },
      });
    } else {
      await this.prisma.transportProfile.update({
        where: { userId: targetId },
        data: { rating: avg, totalReviews: reviews.length },
      });
    }

    return review;
  }

  async getReviews(targetType: ReviewTargetType, targetId: string) {
    return this.prisma.review.findMany({
      where: { targetType, targetId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDemandAnalytics(userId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) return [];

    const fourWeeksAgo = new Date(Date.now() - 28 * 86_400_000);
    const items = await this.prisma.orderItem.findMany({
      where: {
        produce: { farmerId: farmer.id },
        order: { createdAt: { gte: fourWeeksAgo } },
      },
      include: { order: { select: { createdAt: true } } },
    });

    const weekMs = 7 * 86_400_000;
    const now = Date.now();
    const weeks: Record<string, number> = {
      'Week 1': 0,
      'Week 2': 0,
      'Week 3': 0,
      'Week 4': 0,
    };
    for (const item of items) {
      const age = now - new Date(item.order.createdAt).getTime();
      if (age < weekMs) weeks['Week 4'] += item.quantity;
      else if (age < 2 * weekMs) weeks['Week 3'] += item.quantity;
      else if (age < 3 * weekMs) weeks['Week 2'] += item.quantity;
      else if (age < 4 * weekMs) weeks['Week 1'] += item.quantity;
    }

    return Object.entries(weeks).map(([name, demand]) => ({ name, demand }));
  }

  getConfig() {
    return { deliveryFee: this.getDeliveryFee(), currency: 'GHS' };
  }
}
