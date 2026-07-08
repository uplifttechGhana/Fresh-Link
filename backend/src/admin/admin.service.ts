import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [users, orders, produce, transactions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.produceListing.count({ where: { status: 'active' } }),
      this.prisma.transaction.aggregate({ _sum: { amount: true } }),
    ]);

    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return {
      totalUsers: users,
      totalOrders: orders,
      activeProduce: produce,
      totalVolume: Number(transactions._sum.amount ?? 0),
      ordersByStatus: Object.fromEntries(
        ordersByStatus.map((row) => [row.status, row._count]),
      ),
      usersByRole: Object.fromEntries(
        usersByRole.map((row) => [row.role, row._count]),
      ),
    };
  }

  async getUsers(page = 1, limit = 20, role?: string, search?: string) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    const where: any = {
      ...(role ? { role: role as any } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, phone: true, email: true, role: true,
          isActive: true, isVerified: true, createdAt: true, avatarUrl: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async changeUserRole(userId: string, role: string) {
    const validRoles = ['buyer', 'farmer', 'transport', 'investor', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, name: true, phone: true, role: true },
    });
  }

  async suspendUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  async activateUser(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  }

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    const where = status ? { status: status as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { name: true, phone: true } },
          farmer: { include: { user: { select: { name: true } } } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page: p, limit: l };
  }

  async getAllTransactions(page = 1, limit = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: { wallet: { include: { user: { select: { name: true, role: true } } } } },
      }),
      this.prisma.transaction.count(),
    ]);
    return { items, total, page: p, limit: l };
  }

  async getRevenueSeries(range: 'this_week' | 'last_week') {
    const now = new Date();
    const dayMs = 86_400_000;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const offsetDays = range === 'last_week' ? 7 : 0;
    const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() + offsetDays) * dayMs);
    const weekEnd = new Date(weekStart.getTime() + 7 * dayMs);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: weekStart, lt: weekEnd },
        paymentStatus: 'success',
      },
      select: { total: true, createdAt: true },
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * dayMs);
      map[days[d.getDay()]] = 0;
    }
    for (const o of orders) {
      const day = days[new Date(o.createdAt).getDay()];
      map[day] = (map[day] ?? 0) + o.total;
    }

    const data = Object.entries(map).map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }));
    const total = orders.reduce((s, o) => s + o.total, 0);
    const prevOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(weekStart.getTime() - 7 * dayMs), lt: weekStart },
        paymentStatus: 'success',
      },
      select: { total: true },
    });
    const prevTotal = prevOrders.reduce((s, o) => s + o.total, 0);
    const delta = prevTotal > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) : null;

    return {
      total,
      delta,
      data,
      label: range === 'this_week' ? 'This Week' : 'Last Week',
    };
  }

  async getDisputes(page = 1, limit = 20, status?: string) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Number(limit) || 20);
    const skip = (p - 1) * l;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { name: true, phone: true } },
          order: { select: { id: true, total: true, status: true } },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);
    return { items, total, page: p, limit: l };
  }

  async resolveDispute(id: string) {
    return this.prisma.dispute.update({
      where: { id },
      data: { status: 'resolved', resolvedAt: new Date() },
    });
  }

  async createDispute(reporterId: string, orderId: string, reason: string, description?: string) {
    return this.prisma.dispute.create({
      data: { reporterId, orderId, reason, description },
    });
  }
}
