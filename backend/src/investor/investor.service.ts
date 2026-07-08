import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvestorService {
  constructor(private prisma: PrismaService) {}

  async getFundingRequests(status?: string) {
    return this.prisma.farmerFundingRequest.findMany({
      where: { ...(status ? { status: status as any } : { status: 'open' }) },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            farmerProfile: { select: { farmName: true, location: true, rating: true } },
          },
        },
        investments: {
          select: { id: true, amount: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFundingRequest(id: string) {
    const req = await this.prisma.farmerFundingRequest.findUnique({
      where: { id },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            farmerProfile: { select: { farmName: true, location: true, description: true, rating: true } },
          },
        },
        investments: {
          select: { id: true, amount: true, status: true, createdAt: true },
        },
      },
    });
    if (!req) throw new NotFoundException('Funding request not found');
    return req;
  }

  async createInvestment(investorId: string, requestId: string, amount: number) {
    const request = await this.prisma.farmerFundingRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Funding request not found');
    if (request.status !== 'open') throw new BadRequestException('This funding request is no longer open');
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const remaining = request.goal - request.raised;
    if (amount > remaining) throw new BadRequestException('Amount exceeds remaining funding target');

    const [investment] = await this.prisma.$transaction([
      this.prisma.investment.create({ data: { investorId, requestId, amount } }),
      this.prisma.farmerFundingRequest.update({
        where: { id: requestId },
        data: {
          raised: { increment: amount },
          // Auto-close when fully funded
          ...(request.raised + amount >= request.goal ? { status: 'funded' } : {}),
        },
      }),
    ]);
    return investment;
  }

  async getMyFundingRequestsAsFarmer(userId: string) {
    return this.prisma.farmerFundingRequest.findMany({
      where: { farmerId: userId },
      include: {
        investments: { select: { id: true, amount: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyInvestments(investorId: string) {
    return this.prisma.investment.findMany({
      where: { investorId },
      include: {
        request: {
          include: {
            farmer: { select: { name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFundingRequest(userId: string, dto: any) {
    return this.prisma.farmerFundingRequest.create({
      data: {
        farmerId: userId,
        title: dto.title,
        description: dto.description,
        goal: dto.goal,
        deadline: dto.deadline,
      },
    });
  }
}
