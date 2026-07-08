import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePaymentMethodDto {
  provider: string;
  accountNumber: string;
}

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(userId: string, dto: CreatePaymentMethodDto) {
    const last4 = dto.accountNumber.replace(/\D/g, '').slice(-4) || dto.accountNumber.trim().slice(-4);
    const label = `**** ${last4}`;

    const existing = await this.prisma.paymentMethod.count({ where: { userId } });

    return this.prisma.paymentMethod.create({
      data: {
        userId,
        provider: dto.provider,
        accountNumber: dto.accountNumber,
        label,
        isDefault: existing === 0,
      },
    });
  }

  async setDefault(userId: string, id: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.userId !== userId) throw new ForbiddenException();

    await this.prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async remove(userId: string, id: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.userId !== userId) throw new ForbiddenException();

    await this.prisma.paymentMethod.delete({ where: { id } });

    if (method.isDefault) {
      const next = await this.prisma.paymentMethod.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
      if (next) await this.prisma.paymentMethod.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return { message: 'Removed' };
  }
}
