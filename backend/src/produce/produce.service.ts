import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProduceDto, UpdateProduceDto, ProduceQueryDto } from './dto/produce.dto';
import { DEFAULT_PRODUCE_CATEGORIES } from './produce.constants';

@Injectable()
export class ProduceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProduceDto) {
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) throw new ForbiddenException('Farmer profile not found');

    const produce = await this.prisma.produceListing.create({
      data: { ...dto, farmerId: farmer.id },
    });

    // Record initial price
    await this.prisma.priceHistory.create({
      data: { produceId: produce.id, price: produce.price },
    });

    return produce;
  }

  async findAll(query: ProduceQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'active',
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.category && { category: { equals: query.category, mode: 'insensitive' } }),
      ...(query.farmerId && { farmer: { userId: query.farmerId } }),
      ...(query.minPrice !== undefined && { price: { gte: Number(query.minPrice) } }),
      ...(query.maxPrice !== undefined && { price: { lte: Number(query.maxPrice) } }),
    };

    const orderBy: any =
      query.sort === 'popular'
        ? { orderItems: { _count: 'desc' } }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.produceListing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          farmer: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.produceListing.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPriceTrends(userId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) return [];

    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

    const history = await this.prisma.priceHistory.findMany({
      where: {
        produce: { farmerId: farmer.id, status: 'active' },
        recordedAt: { gte: sevenDaysAgo },
      },
      include: { produce: { select: { title: true } } },
      orderBy: { recordedAt: 'asc' },
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const byDay: Record<string, { sum: number; count: number }> = {};
    for (const h of history) {
      const day = days[new Date(h.recordedAt).getDay()];
      if (!byDay[day]) byDay[day] = { sum: 0, count: 0 };
      byDay[day].sum += h.price;
      byDay[day].count += 1;
    }

    return Object.entries(byDay).map(([name, { sum, count }]) => ({
      name,
      price: Math.round((sum / count) * 100) / 100,
    }));
  }

  async getCategories() {
    const rows = await this.prisma.produceListing.groupBy({
      by: ['category'],
      where: { status: 'active', category: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const countByName = new Map<string, number>();
    const defaultSet = new Set<string>(DEFAULT_PRODUCE_CATEGORIES);
    for (const name of DEFAULT_PRODUCE_CATEGORIES) {
      countByName.set(name, 0);
    }
    for (const row of rows) {
      if (row.category) countByName.set(row.category, row._count.id);
    }

    const orderedNames = [
      ...DEFAULT_PRODUCE_CATEGORIES,
      ...[...countByName.keys()]
        .filter((name) => !defaultSet.has(name))
        .sort((a, b) => (countByName.get(b) ?? 0) - (countByName.get(a) ?? 0)),
    ];

    return orderedNames.map((name) => ({
      name,
      count: countByName.get(name) ?? 0,
    }));
  }

  async findOne(id: string) {
    const produce = await this.prisma.produceListing.findUnique({
      where: { id },
      include: {
        farmer: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        priceHistory: { orderBy: { recordedAt: 'asc' }, take: 30 },
      },
    });
    if (!produce || produce.status === 'deleted') throw new NotFoundException('Produce not found');
    return produce;
  }

  async findByFarmer(userId: string) {
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) throw new NotFoundException('Farmer profile not found');

    return this.prisma.produceListing.findMany({
      where: { farmerId: farmer.id, status: { not: 'deleted' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, produceId: string, dto: UpdateProduceDto) {
    const produce = await this.prisma.produceListing.findUnique({
      where: { id: produceId },
      include: { farmer: true },
    });
    if (!produce) throw new NotFoundException('Produce not found');
    if (produce.farmer.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.produceListing.update({
      where: { id: produceId },
      data: dto,
    });

    // Record price change
    if (dto.price !== undefined && dto.price !== produce.price) {
      await this.prisma.priceHistory.create({
        data: { produceId, price: dto.price },
      });
    }

    return updated;
  }

  async remove(userId: string, produceId: string) {
    const produce = await this.prisma.produceListing.findUnique({
      where: { id: produceId },
      include: { farmer: true },
    });
    if (!produce) throw new NotFoundException('Produce not found');
    if (produce.farmer.userId !== userId) throw new ForbiddenException();

    return this.prisma.produceListing.update({
      where: { id: produceId },
      data: { status: 'deleted' },
    });
  }

  async getPriceComparison(title: string) {
    return this.prisma.produceListing.findMany({
      where: {
        title: { contains: title, mode: 'insensitive' },
        status: 'active',
      },
      include: {
        farmer: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { price: 'asc' },
    });
  }

  // ── Favorites ───────────────────────────────────────────────────────────────

  async getFavorites(buyerId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { buyerId },
      include: {
        produce: {
          include: {
            farmer: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.produce);
  }

  async addFavorite(buyerId: string, produceId: string) {
    return this.prisma.favorite.upsert({
      where: { buyerId_produceId: { buyerId, produceId } },
      create: { buyerId, produceId },
      update: {},
    });
  }

  async removeFavorite(buyerId: string, produceId: string) {
    await this.prisma.favorite.deleteMany({ where: { buyerId, produceId } });
    return { removed: true };
  }

  async getFavoriteIds(buyerId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { buyerId },
      select: { produceId: true },
    });
    return rows.map((r) => r.produceId);
  }
}
