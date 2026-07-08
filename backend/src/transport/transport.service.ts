import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransportJobStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const JOB_STATUS_FLOW: Partial<Record<TransportJobStatus, TransportJobStatus[]>> = {
  accepted: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['delivered'],
};

@Injectable()
export class TransportService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ── Driver: available jobs ─────────────────────────────────────────────────

  async getProfile(userId: string) {
    const profile = await this.prisma.transportProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Transport profile not found');
    return profile;
  }

  async getAvailableJobs(userId: string) {
    await this.syncOrderTransportJobs();

    // Verify driver has a profile (not required to be available to browse)
    const profile = await this.prisma.transportProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Transport profile not found');

    // Return unassigned pending jobs
    return this.prisma.transportJob.findMany({
      where: { status: 'pending', transporterId: null },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            farmer: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
          },
        },
        request: {
          include: {
            farmer: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Driver: accept job ─────────────────────────────────────────────────────

  async acceptJob(jobId: string, userId: string) {
    const profile = await this.prisma.transportProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Transport profile not found');
    if (!profile.isAvailable) {
      throw new BadRequestException('Go online before accepting delivery jobs');
    }

    const job = await this.prisma.transportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'pending') throw new BadRequestException('Job is no longer available');
    if (job.transporterId !== null) throw new BadRequestException('Job already accepted by another driver');

    const accepted = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: { transporterId: profile.id, status: 'accepted', acceptedAt: new Date() },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            farmer: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
          },
        },
        request: {
          include: {
            farmer: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
          },
        },
      },
    });

    if (accepted.orderId) {
      await this.prisma.order.update({
        where: { id: accepted.orderId },
        data: { status: 'in_transit' },
      });
    }

    // Notify farmer/buyer that a driver accepted the job
    const recipientId =
      accepted.order?.buyer?.id ?? accepted.request?.farmer?.user?.id;
    if (recipientId) {
      this.notifications.createNotification(
        recipientId,
        'job_offer',
        'Driver Assigned',
        'A driver has accepted your transport request and is on the way.',
        { jobId },
      ).catch(() => undefined);
    }

    return accepted;
  }

  // ── Driver: update job status ──────────────────────────────────────────────

  async updateJobStatus(jobId: string, userId: string, status: TransportJobStatus) {
    const profile = await this.prisma.transportProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Transport profile not found');

    const job = await this.prisma.transportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.transporterId !== profile.id) {
      throw new ForbiddenException('You are not assigned to this delivery.');
    }
    if (job.status === 'delivered') {
      throw new BadRequestException('This delivery is already completed.');
    }
    if (job.status === 'cancelled') {
      throw new BadRequestException('This delivery was cancelled.');
    }

    const allowed = JOB_STATUS_FLOW[job.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot change status from ${job.status} to ${status}.`,
      );
    }

    const statusMessages: Partial<Record<TransportJobStatus, string>> = {
      picked_up: 'Cargo picked up. Head to the drop-off location.',
      in_transit: 'Delivery in transit. Customer is waiting.',
      delivered: `Job complete! ₵${job.fee.toFixed(2)} has been added to your wallet.`,
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const updates: {
        status: TransportJobStatus;
        pickedUpAt?: Date;
        deliveredAt?: Date;
      } = { status };
      if (status === 'picked_up') updates.pickedUpAt = new Date();
      if (status === 'delivered') updates.deliveredAt = new Date();

      const result = await tx.transportJob.update({
        where: { id: jobId },
        data: updates,
      });

      if (status === 'delivered') {
        let wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId } });
        }
        const newBalance = Math.round((wallet.balance + job.fee) * 100) / 100;
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            source: 'transport_fee',
            amount: job.fee,
            balance: newBalance,
            reference: job.id,
            note: `Transport job #${job.id.slice(0, 8)}`,
          },
        });

        if (job.orderId) {
          await tx.order.update({
            where: { id: job.orderId },
            data: { status: 'delivered' },
          });
        }
      }

      return result;
    });

    const msg = statusMessages[status];
    if (msg) {
      this.notifications.createNotification(
        userId,
        'payment',
        status === 'delivered' ? 'Payment Received' : 'Job Update',
        msg,
        { jobId },
      ).catch(() => undefined);
    }

    if (status === 'delivered' && job.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: job.orderId },
        select: { buyerId: true },
      });
      if (order) {
        this.notifications.createNotification(
          order.buyerId,
          'order_update',
          'Order Delivered',
          'Your order has been delivered.',
          { orderId: job.orderId },
        ).catch(() => undefined);
      }
    }

    return updated;
  }

  // ── Driver: own jobs ───────────────────────────────────────────────────────

  async getTransporterJobs(userId: string, status?: TransportJobStatus) {
    const profile = await this.prisma.transportProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Transport profile not found');

    return this.prisma.transportJob.findMany({
      where: {
        transporterId: profile.id,
        ...(status ? { status } : {}),
      },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            farmer: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
          },
        },
        request: {
          include: {
            farmer: { include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Driver: location + availability ───────────────────────────────────────

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return this.prisma.transportProfile.update({
      where: { userId },
      data: { latitude, longitude },
    });
  }

  async setAvailability(userId: string, isAvailable: boolean) {
    return this.prisma.transportProfile.update({
      where: { userId },
      data: { isAvailable },
    });
  }

  // ── Farmer: create request + unassigned job ────────────────────────────────

  async createTransportRequest(userId: string, dto: any) {
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) throw new NotFoundException('Farmer profile not found');

    const request = await this.prisma.transportRequest.create({
      data: {
        farmerId: farmer.id,
        pickup: dto.pickup,
        dropoff: dto.dropoff,
        distance: dto.distance,
        weight: dto.weight,
        notes: dto.notes,
      },
    });

    // Create an unassigned job so drivers can discover it
    await this.prisma.transportJob.create({
      data: {
        requestId: request.id,
        pickup: dto.pickup,
        dropoff: dto.dropoff,
        distance: dto.distance,
        fee: this.estimateFee(dto.distance, dto.weight),
        status: 'pending',
      },
    });

    return request;
  }

  private estimateFee(distance?: number, weight?: number): number {
    const base = 20;
    const distCharge = distance ? distance * 0.5 : 0;
    const weightCharge = weight ? Math.max(0, weight - 50) * 0.2 : 0;
    return Math.round((base + distCharge + weightCharge) * 100) / 100;
  }

  /** Backfill transport jobs for paid orders marked ready but never published to drivers. */
  private async syncOrderTransportJobs() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['ready_for_pickup', 'in_transit'] },
        transportJob: { is: null },
      },
      include: { farmer: true },
    });

    for (const order of orders) {
      const dropoff = order.deliveryAddress?.trim();
      if (!dropoff) continue;

      const pickup =
        order.farmer.location?.trim() ||
        order.farmer.farmName?.trim() ||
        'Farm pickup';
      const fee = order.deliveryFee > 0 ? order.deliveryFee : 15;

      await this.prisma.transportJob.create({
        data: {
          orderId: order.id,
          pickup,
          dropoff,
          fee,
          status: 'pending',
        },
      });
    }
  }
}
