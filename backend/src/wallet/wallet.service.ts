import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackTransfersService } from './paystack-transfers.service';
import { CreatePayoutAccountDto, WithdrawDto } from './dto/wallet.dto';
import { randomUUID } from 'crypto';

function maskAccount(num: string) {
  if (num.length <= 4) return num;
  return `**** ${num.slice(-4)}`;
}

function isPaystackTestKey(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim() ?? '';
  return key.startsWith('sk_test_');
}

/** Paystack starter/test accounts cannot send real transfers — simulate locally in dev. */
function shouldSimulateWithdrawal(paystackMessage: string): boolean {
  if (process.env.WALLET_SIMULATE_WITHDRAWALS === 'true') return true;
  if (!isPaystackTestKey()) return false;

  const msg = paystackMessage.toLowerCase();
  const paystackBlocked =
    msg.includes('starter business') ||
    msg.includes('third party payout') ||
    msg.includes('cannot initiate') ||
    msg.includes('transfer is not allowed') ||
    msg.includes('not allowed to initiate transfers');

  const networkFailure =
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('socket hang up') ||
    msg.includes('network error') ||
    msg.includes('timeout') ||
    msg.includes('aborted');

  return paystackBlocked || networkFailure;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prisma: PrismaService,
    private paystack: PaystackTransfersService,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.transaction.count({ where: { walletId: wallet.id } }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async listPayoutProviders(type: 'mobile_money' | 'bank') {
    return this.paystack.listProviders(type);
  }

  async listPayoutAccounts(userId: string) {
    const accounts = await this.prisma.payoutAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return accounts.map((a) => ({
      ...a,
      maskedAccountNumber: maskAccount(a.accountNumber),
      accountNumber: undefined,
    }));
  }

  async createPayoutAccount(userId: string, dto: CreatePayoutAccountDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const accountNumber = dto.accountNumber.replace(/\s/g, '');
    const existing = await this.prisma.payoutAccount.findUnique({
      where: {
        userId_type_accountNumber: {
          userId,
          type: dto.type,
          accountNumber,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('This payout account is already saved.');
    }

    const recipientCode = await this.paystack.createRecipient({
      type: dto.type,
      name: dto.accountName.trim(),
      accountNumber,
      bankCode: dto.bankCode,
    });

    const makeDefault = dto.setDefault ?? true;
    if (makeDefault) {
      await this.prisma.payoutAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const account = await this.prisma.payoutAccount.create({
      data: {
        userId,
        type: dto.type,
        provider: dto.provider,
        accountNumber,
        accountName: dto.accountName.trim(),
        paystackRecipientCode: recipientCode,
        isDefault: makeDefault,
      },
    });

    // Keep farmer profile bank fields in sync for legacy screens
    if (user.role === 'farmer' && dto.type === 'bank') {
      await this.prisma.farmerProfile.updateMany({
        where: { userId },
        data: { bankName: dto.provider, bankAccount: accountNumber },
      });
    }

    return {
      ...account,
      maskedAccountNumber: maskAccount(account.accountNumber),
      accountNumber: undefined,
    };
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const amount = Math.round(dto.amount * 100) / 100;
    if (amount < 1) throw new BadRequestException('Minimum withdrawal is ₵1.00');
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance.');
    }

    const payoutAccount = dto.payoutAccountId
      ? await this.prisma.payoutAccount.findFirst({
          where: { id: dto.payoutAccountId, userId },
        })
      : await this.prisma.payoutAccount.findFirst({
          where: { userId, isDefault: true },
        });

    if (!payoutAccount) {
      throw new BadRequestException('Add a payout account before withdrawing.');
    }

    const pending = await this.prisma.withdrawalRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'processing'] },
      },
    });
    if (pending) {
      throw new BadRequestException('You already have a withdrawal in progress.');
    }

    const reference = `FL-WD-${randomUUID()}`;
    const withdrawal = await this.prisma.withdrawalRequest.create({
      data: {
        userId,
        walletId: wallet.id,
        payoutAccountId: payoutAccount.id,
        amount,
        status: 'processing',
        paystackReference: reference,
      },
    });

    try {
      const transfer = await this.paystack.initiateTransfer({
        amountGhs: amount,
        recipientCode: payoutAccount.paystackRecipientCode,
        reference,
        reason: 'FreshLink wallet withdrawal',
      });

      if (transfer.status === 'success') {
        await this.finalizeWithdrawal(reference, transfer.transferCode);
      } else {
        await this.prisma.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: {
            paystackTransferCode: transfer.transferCode ?? null,
            status: 'processing',
          },
        });
      }

      return this.prisma.withdrawalRequest.findUnique({
        where: { id: withdrawal.id },
        include: {
          payoutAccount: true,
        },
      });
    } catch (err) {
      const message =
        err instanceof BadRequestException
          ? err.message
          : 'Withdrawal could not be processed.';

      if (shouldSimulateWithdrawal(message)) {
        this.logger.warn(
          `Paystack blocked transfer (${message}) — simulating withdrawal in test mode.`,
        );
        await this.finalizeWithdrawal(reference, `SIM-${reference.slice(0, 20)}`);
        const result = await this.prisma.withdrawalRequest.findUnique({
          where: { id: withdrawal.id },
          include: { payoutAccount: true },
        });
        return { ...result, simulated: true };
      }

      await this.prisma.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: {
          status: 'failed',
          failureReason: message,
        },
      });
      throw err;
    }
  }

  async finalizeWithdrawal(reference: string, transferCode?: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { paystackReference: reference },
    });
    if (!withdrawal || withdrawal.status === 'success') return;

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.withdrawalRequest.findUnique({
        where: { paystackReference: reference },
      });
      if (!current || current.status === 'success') return;

      const wallet = await tx.wallet.findUnique({ where: { id: current.walletId } });
      if (!wallet) {
        await tx.withdrawalRequest.update({
          where: { id: current.id },
          data: { status: 'failed', failureReason: 'Wallet not found' },
        });
        return;
      }

      if (wallet.balance < current.amount) {
        await tx.withdrawalRequest.update({
          where: { id: current.id },
          data: { status: 'failed', failureReason: 'Insufficient balance' },
        });
        return;
      }

      const newBalance = Math.round((wallet.balance - current.amount) * 100) / 100;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          source: 'withdrawal',
          amount: current.amount,
          balance: newBalance,
          reference,
          note: 'Withdrawal to payout account',
        },
      });
      await tx.withdrawalRequest.update({
        where: { id: current.id },
        data: {
          status: 'success',
          paystackTransferCode: transferCode ?? current.paystackTransferCode,
          failureReason: null,
        },
      });
    });
  }

  async failWithdrawal(reference: string, reason?: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { paystackReference: reference },
    });
    if (!withdrawal || withdrawal.status === 'success') return;

    await this.prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: {
        status: 'failed',
        failureReason: reason ?? 'Transfer failed',
      },
    });
  }
}
