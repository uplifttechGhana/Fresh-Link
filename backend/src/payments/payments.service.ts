import { Injectable, BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { createHmac } from 'crypto';
import axios, { isAxiosError } from 'axios';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  private get headers() {
    const key = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Paystack is not configured. Add PAYSTACK_SECRET_KEY to backend/.env and restart the server.',
      );
    }
    return {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  private frontendBase() {
    return (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  }

  /** HashRouter routes must include `/#/` or Paystack redirects 404 on Vercel. */
  private frontendCallback(path: string) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.frontendBase()}/#${normalized}`;
  }

  private async paystackInitialize(payload: Record<string, unknown>) {
    try {
      const res = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        payload,
        { headers: this.headers },
      );
      return res.data.data;
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const paystackMsg =
          (err.response?.data as { message?: string } | undefined)?.message ??
          err.message;
        this.logger.error(`Paystack initialize failed (${status ?? 'network'}): ${paystackMsg}`);
        throw new BadRequestException(
          status === 401
            ? 'Paystack rejected the secret key. Check PAYSTACK_SECRET_KEY in backend/.env (use sk_test_... for test mode).'
            : `Payment could not be started: ${paystackMsg}`,
        );
      }
      throw err;
    }
  }

  async initializeOrderPayment(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });
    if (!order) throw new BadRequestException('Order not found');
    if (order.buyerId !== buyerId) throw new BadRequestException('Forbidden');

    const email = order.buyer.email ?? `${order.buyer.phone.replace('+', '')}@freshlink.app`;

    const data = await this.paystackInitialize({
      email,
      amount: Math.round(order.total * 100), // pesewas
      reference: `FL-ORDER-${orderId}-${Date.now()}`,
      metadata: { orderId, buyerId, type: 'order' },
      callback_url: this.frontendCallback(`/buyer/tracking/${orderId}`),
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paystackRef: data.reference },
    });

    return { authorizationUrl: data.authorization_url, reference: data.reference };
  }

  async initializeInvestmentPayment(investmentId: string, investorId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: { investor: true },
    });
    if (!investment) throw new BadRequestException('Investment not found');
    if (investment.investorId !== investorId) throw new BadRequestException('Forbidden');

    const email =
      investment.investor.email ??
      `${investment.investor.phone.replace('+', '')}@freshlink.app`;

    const data = await this.paystackInitialize({
      email,
      amount: Math.round(investment.amount * 100),
      reference: `FL-INV-${investmentId}-${Date.now()}`,
      metadata: { investmentId, investorId, type: 'investment' },
      callback_url: this.frontendCallback('/investor/portfolio'),
    });

    await this.prisma.investment.update({
      where: { id: investmentId },
      data: { paystackRef: data.reference },
    });

    return { authorizationUrl: data.authorization_url, reference: data.reference };
  }

  async verifyOrderPayment(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { farmer: true },
    });
    if (!order) throw new BadRequestException('Order not found');
    if (order.buyerId !== buyerId) throw new BadRequestException('Forbidden');
    if (!order.paystackRef) throw new BadRequestException('No payment started for this order');

    const existingTx = await this.prisma.transaction.findFirst({
      where: { reference: order.paystackRef, source: 'order_payment' },
    });
    if (order.paymentStatus === 'success' && existingTx) {
      return { status: 'already_paid' as const };
    }

    try {
      const res = await axios.get(
        `${this.paystackBaseUrl}/transaction/verify/${encodeURIComponent(order.paystackRef)}`,
        { headers: this.headers },
      );
      const data = res.data?.data;
      if (data?.status === 'success') {
        await this.reconcilePayment({
          reference: data.reference ?? order.paystackRef,
          metadata: data.metadata ?? { orderId, buyerId, type: 'order' },
        });
        return { status: 'verified' as const };
      }
      return { status: data?.status ?? 'pending' };
    } catch (err) {
      if (isAxiosError(err)) {
        const paystackMsg =
          (err.response?.data as { message?: string } | undefined)?.message ?? err.message;
        this.logger.error(`Paystack verify failed: ${paystackMsg}`);
        throw new BadRequestException(`Could not verify payment: ${paystackMsg}`);
      }
      throw err;
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    // Paystack signs webhooks with the same Secret Key (no separate webhook secret).
    const secret =
      process.env.PAYSTACK_WEBHOOK_SECRET?.trim() ||
      process.env.PAYSTACK_SECRET_KEY?.trim() ||
      '';
    if (!secret) {
      this.logger.warn(
        'PAYSTACK_SECRET_KEY is not set — webhook rejected. Add it to Railway env vars.',
      );
      throw new BadRequestException('Paystack secret key not configured');
    }

    const hash = createHmac('sha512', secret).update(rawBody).digest('hex');

    if (hash !== signature) {
      this.logger.warn('Invalid Paystack webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody.toString());
    this.logger.log(`Paystack webhook: ${event.event}`);

    if (event.event === 'charge.success') {
      await this.reconcilePayment(event.data);
    }

    if (event.event === 'transfer.success') {
      const reference = event.data?.reference as string | undefined;
      const transferCode = event.data?.transfer_code as string | undefined;
      if (reference?.startsWith('FL-WD-')) {
        await this.walletService.finalizeWithdrawal(reference, transferCode);
      }
    }

    if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const reference = event.data?.reference as string | undefined;
      const reason = event.data?.reason as string | undefined;
      if (reference?.startsWith('FL-WD-')) {
        await this.walletService.failWithdrawal(reference, reason);
      }
    }
  }

  private async reconcilePayment(data: any) {
    const { reference, metadata } = data;

    if (metadata?.type === 'order') {
      const order = await this.prisma.order.findFirst({
        where: { paystackRef: reference },
        include: { farmer: true },
      });
      if (!order) return;

      const existingTx = await this.prisma.transaction.findFirst({
        where: { reference, source: 'order_payment' },
      });
      if (existingTx) {
        if (order.paymentStatus !== 'success') {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'success', status: 'accepted' },
          });
        }
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'success', status: 'accepted' },
      });

      let wallet = await this.prisma.wallet.findUnique({
        where: { userId: order.farmer.userId },
      });
      if (!wallet) {
        wallet = await this.prisma.wallet.create({ data: { userId: order.farmer.userId } });
      }

      const creditAmount = order.total * 0.95; // 5% platform fee
      const newBalance = wallet.balance + creditAmount;
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });
      await this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          source: 'order_payment',
          amount: creditAmount,
          balance: newBalance,
          reference,
          note: `Order #${order.id.slice(0, 8)}`,
        },
      });

      this.logger.log(`Order ${order.id} payment reconciled — farmer credited ₵${creditAmount.toFixed(2)}`);
    }

    if (metadata?.type === 'investment') {
      const investment = await this.prisma.investment.findFirst({
        where: { paystackRef: reference },
        include: { request: true, investor: true },
      });
      if (!investment) return;

      await this.prisma.investment.update({
        where: { id: investment.id },
        data: { status: 'active' },
      });

      await this.prisma.farmerFundingRequest.update({
        where: { id: investment.requestId },
        data: { raised: { increment: investment.amount } },
      });

      // Credit investor wallet (placeholder — actual returns handled separately)
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: investment.investorId },
      });
      if (!wallet) {
        await this.prisma.wallet.create({ data: { userId: investment.investorId } });
      }

      this.logger.log(`Investment ${investment.id} payment reconciled`);
    }
  }
}
