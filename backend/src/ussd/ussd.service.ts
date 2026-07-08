import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ghanaPhoneLookupVariants, normalizeGhanaPhone } from '../common/utils/phone.util';

/**
 * Africa's Talking USSD session state machine.
 *
 * State graph:
 *   MAIN_MENU         → 1=Buyer Menu, 2=Farmer Menu, 3=Transport Menu,
 *                        4=My Orders, 5=Wallet Balance
 *   BUYER_MENU        → 1=Browse Produce, 2=My Orders, 3=Track Order, 0=Back
 *   FARMER_MENU       → 1=My Listings, 2=Order Requests, 3=My Wallet, 4=Track Order, 0=Back
 *   TRANSPORT_MENU    → 1=Available Jobs, 2=My Active Job, 3=Earnings, 0=Back
 *   TRACK_ORDER       → CON: prompt order ID → END: order detail
 */
@Injectable()
export class UssdService {
  private readonly logger = new Logger(UssdService.name);

  constructor(private prisma: PrismaService) {}

  getShortcode() {
    const raw = process.env.AFRICASTALKING_SHORTCODE?.trim() || '*384*45670#';
    return raw.endsWith('#') ? raw : `${raw}#`;
  }

  async handleRequest(params: {
    sessionId: string;
    serviceCode: string;
    phoneNumber: string;
    text: string;
  }): Promise<string> {
    const { sessionId, serviceCode, text } = params;
    const phoneNumber = normalizeGhanaPhone(params.phoneNumber);
    const inputs = text ? text.split('*').filter((s) => s !== '') : [];

    let session = await this.prisma.ussdSession.findUnique({ where: { sessionId } });
    const userId = await this.resolveUserId(phoneNumber);

    if (!session) {
      session = await this.prisma.ussdSession.create({
        data: {
          sessionId,
          phoneNumber,
          userId,
          state: 'MAIN_MENU',
          data: { serviceCode },
          status: 'active',
        },
      });
    } else {
      const updates: Record<string, unknown> = {};
      if (session.phoneNumber !== phoneNumber) updates.phoneNumber = phoneNumber;
      if (userId && session.userId !== userId) updates.userId = userId;
      if (session.status === 'completed') {
        updates.status = 'active';
        updates.state = 'MAIN_MENU';
      }
      if (Object.keys(updates).length > 0) {
        session = await this.prisma.ussdSession.update({
          where: { sessionId },
          data: updates,
        });
      }
    }

    const response = await this.processInput(session, inputs);

    if (response.startsWith('END')) {
      await this.prisma.ussdSession.update({
        where: { sessionId },
        data: { status: 'completed' },
      });
    } else if (response.startsWith('CON')) {
      await this.prisma.ussdSession.update({
        where: { sessionId },
        data: { status: 'active' },
      });
    }

    this.logger.debug(`USSD ${sessionId} [${phoneNumber}] text="${text}" → ${response.slice(0, 40)}…`);
    return response;
  }

  private async resolveUserId(phoneNumber: string): Promise<string | null> {
    const variants = ghanaPhoneLookupVariants(phoneNumber);
    const user = await this.prisma.user.findFirst({
      where: { phone: { in: variants } },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  private async processInput(session: any, inputs: string[]): Promise<string> {
    const lastInput = inputs[inputs.length - 1] ?? '';

    if (inputs.length === 0) {
      await this.updateState(session.sessionId, 'MAIN_MENU');
      return this.con(this.mainMenu());
    }

    if (inputs.length === 1) {
      switch (lastInput) {
        case '1':
          await this.updateState(session.sessionId, 'BUYER_MENU');
          return this.con(this.buyerMenu());
        case '2':
          await this.updateState(session.sessionId, 'FARMER_MENU');
          return this.con(this.farmerMenu());
        case '3':
          await this.updateState(session.sessionId, 'TRANSPORT_MENU');
          return this.con(this.transportMenu());
        case '4':
          await this.updateState(session.sessionId, 'MY_ORDERS');
          return await this.buildOrderList(session.userId);
        case '5':
          await this.updateState(session.sessionId, 'WALLET_BALANCE');
          return await this.buildWalletBalance(session.userId);
        default:
          return this.con(this.mainMenu('Invalid choice. '));
      }
    }

    if (inputs[0] === '1') {
      if (inputs.length === 2) {
        switch (lastInput) {
          case '1':
            await this.updateState(session.sessionId, 'BROWSE_PRODUCE');
            return await this.buildBrowseProduce();
          case '2':
            await this.updateState(session.sessionId, 'MY_ORDERS');
            return await this.buildOrderList(session.userId);
          case '3':
            await this.updateState(session.sessionId, 'TRACK_ORDER');
            return this.con('Enter your Order ID (last 6 chars OK):');
          case '0':
            await this.updateState(session.sessionId, 'MAIN_MENU');
            return this.con(this.mainMenu());
          default:
            return this.con(this.buyerMenu('Invalid choice. '));
        }
      }
      if (inputs.length === 3 && inputs[1] === '3') {
        return await this.buildOrderDetail(lastInput, session.userId);
      }
    }

    if (inputs[0] === '2') {
      if (inputs.length === 2) {
        switch (lastInput) {
          case '1':
            await this.updateState(session.sessionId, 'FARMER_LISTINGS');
            return await this.buildFarmerListings(session.userId);
          case '2':
            await this.updateState(session.sessionId, 'FARMER_ORDERS');
            return await this.buildFarmerOrders(session.userId);
          case '3':
            await this.updateState(session.sessionId, 'WALLET_BALANCE');
            return await this.buildWalletBalance(session.userId);
          case '4':
            await this.updateState(session.sessionId, 'TRACK_ORDER');
            return this.con('Enter Order ID (last 6 chars OK):');
          case '0':
            await this.updateState(session.sessionId, 'MAIN_MENU');
            return this.con(this.mainMenu());
          default:
            return this.con(this.farmerMenu('Invalid choice. '));
        }
      }
      if (inputs.length === 3 && inputs[1] === '4') {
        return await this.buildOrderDetail(lastInput, session.userId);
      }
    }

    if (inputs[0] === '3') {
      if (inputs.length === 2) {
        switch (lastInput) {
          case '1':
            await this.updateState(session.sessionId, 'TRANSPORT_JOBS');
            return await this.buildAvailableJobs();
          case '2':
            await this.updateState(session.sessionId, 'TRANSPORT_ACTIVE');
            return await this.buildActiveJob(session.userId);
          case '3':
            await this.updateState(session.sessionId, 'TRANSPORT_EARNINGS');
            return await this.buildWalletBalance(session.userId);
          case '0':
            await this.updateState(session.sessionId, 'MAIN_MENU');
            return this.con(this.mainMenu());
          default:
            return this.con(this.transportMenu('Invalid choice. '));
        }
      }
    }

    await this.updateState(session.sessionId, 'MAIN_MENU');
    return this.con(this.mainMenu('Invalid input. '));
  }

  private mainMenu(prefix = '') {
    return `${prefix}FreshLink\n1. Buyer Menu\n2. Farmer Menu\n3. Transport Menu\n4. My Orders\n5. Wallet Balance`;
  }

  private buyerMenu(prefix = '') {
    return `${prefix}Buyer Menu\n1. Browse Produce\n2. My Orders\n3. Track Order\n0. Back`;
  }

  private farmerMenu(prefix = '') {
    return `${prefix}Farmer Menu\n1. My Listings\n2. Order Requests\n3. My Wallet\n4. Track Order\n0. Back`;
  }

  private transportMenu(prefix = '') {
    return `${prefix}Transport Menu\n1. Available Jobs\n2. My Active Job\n3. Earnings\n0. Back`;
  }

  private async buildBrowseProduce(): Promise<string> {
    const items = await this.prisma.produceListing.findMany({
      where: { status: 'active' },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    if (!items.length) return this.end('No produce available right now.');
    const lines = items.map((p, i) => `${i + 1}. ${p.title} GHS${p.price}/${p.unit}`).join('\n');
    return this.end(`Fresh Produce:\n${lines}\n\nOrder via the FreshLink app.`);
  }

  private async buildOrderList(userId?: string | null): Promise<string> {
    if (!userId) return this.end('Link your phone to a FreshLink account to view orders.');
    const orders = await this.prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    if (!orders.length) return this.end('No orders found.');
    const lines = orders
      .map((o) => `#${o.id.slice(-6).toUpperCase()} ${o.status} GHS${Number(o.total).toFixed(0)}`)
      .join('\n');
    return this.end(`Recent Orders:\n${lines}`);
  }

  private async buildOrderDetail(orderId: string, userId?: string | null): Promise<string> {
    if (!userId) return this.end('Link your phone to a FreshLink account first.');
    const token = orderId.trim().toLowerCase();
    if (!token) return this.end('Order ID required.');

    const candidates = await this.prisma.order.findMany({
      where: {
        OR: [{ buyerId: userId }, { farmer: { userId } }],
      },
      include: { items: { include: { produce: { select: { title: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const order = candidates.find(
      (o) =>
        o.id.toLowerCase() === token ||
        (token.length <= 8 && o.id.toLowerCase().endsWith(token)),
    );

    if (!order) return this.end('Order not found. Check your order ID.');
    const items = order.items.map((i) => `${i.produce.title}x${i.quantity}`).join(', ');
    return this.end(
      `Order #${order.id.slice(-6).toUpperCase()}\nStatus: ${order.status}\nTotal: GHS${Number(order.total).toFixed(2)}\nItems: ${items}`,
    );
  }

  private async buildWalletBalance(userId?: string | null): Promise<string> {
    if (!userId) return this.end('Link your phone to a FreshLink account first.');
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return this.end('No wallet found. Open the app to set up your wallet.');
    return this.end(`Wallet Balance\nGHS ${Number(wallet.balance).toFixed(2)}`);
  }

  private async buildFarmerListings(userId?: string | null): Promise<string> {
    if (!userId) return this.end('Link your phone to a FreshLink account first.');
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) return this.end('No farmer profile found. Complete your profile in the app.');
    const listings = await this.prisma.produceListing.findMany({
      where: { farmerId: farmer.id, status: 'active' },
      take: 5,
    });
    if (!listings.length) return this.end('No active listings.');
    const lines = listings
      .map((l) => `${l.title} GHS${Number(l.price).toFixed(0)} (${l.stock}${l.unit} left)`)
      .join('\n');
    return this.end(`My Listings:\n${lines}`);
  }

  private async buildFarmerOrders(userId?: string | null): Promise<string> {
    if (!userId) return this.end('Link your phone to a FreshLink account first.');
    const farmer = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!farmer) return this.end('No farmer profile found.');
    const orders = await this.prisma.order.findMany({
      where: {
        farmerId: farmer.id,
        status: { in: ['pending', 'accepted', 'ready_for_pickup', 'in_transit'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    if (!orders.length) return this.end('No pending orders right now.');
    const lines = orders
      .map((o) => `#${o.id.slice(-6).toUpperCase()} ${o.status} GHS${Number(o.total).toFixed(0)}`)
      .join('\n');
    return this.end(`Order Requests:\n${lines}`);
  }

  private async buildAvailableJobs(): Promise<string> {
    await this.syncOrderTransportJobs();

    const jobs = await this.prisma.transportJob.findMany({
      where: { status: 'pending', transporterId: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    if (!jobs.length) return this.end('No jobs available right now. Check back later.');
    const lines = jobs
      .map(
        (j, i) =>
          `${i + 1}. #${j.id.slice(-6).toUpperCase()} GHS${Number(j.fee).toFixed(0)}\n   ${j.pickup.slice(0, 28)}`,
      )
      .join('\n');
    return this.end(`Available Jobs:\n${lines}\n\nAccept jobs in the FreshLink app.`);
  }

  private async buildActiveJob(userId?: string | null): Promise<string> {
    if (!userId) return this.end('Link your phone to a FreshLink account first.');
    const profile = await this.prisma.transportProfile.findUnique({ where: { userId } });
    if (!profile) return this.end('No transport profile. Complete your profile in the app.');
    const job = await this.prisma.transportJob.findFirst({
      where: { transporterId: profile.id, status: { in: ['accepted', 'picked_up', 'in_transit'] } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!job) return this.end('No active job. Pick up available jobs from the app.');
    return this.end(
      `Active Job #${job.id.slice(-6).toUpperCase()}\nStatus: ${job.status}\nFee: GHS${Number(job.fee).toFixed(2)}\nPickup: ${job.pickup}\nDrop-off: ${job.dropoff.slice(0, 40)}`,
    );
  }

  /** Backfill transport jobs for orders ready but missing a job record. */
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

  private async updateState(sessionId: string, state: string) {
    await this.prisma.ussdSession.update({ where: { sessionId }, data: { state } });
  }

  private con(text: string) {
    return `CON ${text}`;
  }

  private end(text: string) {
    return `END ${text}`;
  }
}
