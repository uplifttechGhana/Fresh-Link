import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateUserDto,
  UpdateFarmerProfileDto,
  UpdateTransportProfileDto,
  UpdateInvestorProfileDto,
  RegisterDeviceTokenDto,
} from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        farmerProfile: true,
        transportProfile: true,
        investorProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      include: {
        farmerProfile: true,
        transportProfile: true,
        investorProfile: true,
      },
    });
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new NotFoundException();
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new NotFoundException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password changed successfully' };
  }

  async updateFarmerProfile(userId: string, dto: UpdateFarmerProfileDto) {
    return this.prisma.farmerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async updateTransportProfile(userId: string, dto: UpdateTransportProfileDto) {
    return this.prisma.transportProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async updateInvestorProfile(userId: string, dto: UpdateInvestorProfileDto) {
    return this.prisma.investorProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async setTransportAvailability(userId: string, isAvailable: boolean) {
    return this.prisma.transportProfile.update({
      where: { userId },
      data: { isAvailable },
    });
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { userId },
      create: { userId, token: dto.token, platform: dto.platform },
    });
    return { message: 'Device token registered' };
  }

  // ── Saved / followed farmers ──────────────────────────────────────────────

  async getSavedFarmers(buyerId: string) {
    const rows = await this.prisma.savedFarmer.findMany({
      where: { buyerId },
      include: {
        farmer: {
          select: {
            id: true, name: true, avatarUrl: true,
            farmerProfile: { select: { location: true, rating: true, totalReviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ ...r.farmer, savedAt: r.createdAt }));
  }

  async saveFarmer(buyerId: string, farmerId: string) {
    await this.prisma.savedFarmer.upsert({
      where: { buyerId_farmerId: { buyerId, farmerId } },
      update: {},
      create: { buyerId, farmerId },
    });
    return { message: 'Farmer saved' };
  }

  async unsaveFarmer(buyerId: string, farmerId: string) {
    await this.prisma.savedFarmer.deleteMany({ where: { buyerId, farmerId } });
    return { message: 'Farmer removed' };
  }

  async listFarmers({ search, page, limit }: { search?: string; page: number; limit: number }) {
    const take = Math.min(limit, 200);
    const skip = (Math.max(1, page) - 1) * take;

    const where: any = {
      user: { role: 'farmer' },
      totalReviews: { gt: 0 },
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { location: { contains: search, mode: 'insensitive' } },
          { farmName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [profiles, total] = await Promise.all([
      this.prisma.farmerProfile.findMany({
        where,
        skip,
        take,
        orderBy: [{ rating: 'desc' }, { totalReviews: 'desc' }],
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { produce: { where: { status: 'active' } } } },
        },
      }),
      this.prisma.farmerProfile.count({ where }),
    ]);

    return {
      items: profiles,
      total,
      page: Math.max(1, page),
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async getFarmerPublicProfile(farmerId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId: farmerId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, phone: true, createdAt: true },
        },
        produce: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!profile) throw new NotFoundException('Farmer profile not found');
    return profile;
  }
}
