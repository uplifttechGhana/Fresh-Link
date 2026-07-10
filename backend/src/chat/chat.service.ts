import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private assertConversationAccess(
    conv: { id: string; buyerId: string; farmerId: string; orderId: string | null },
    userId: string,
  ) {
    // Only the two direct participants of a conversation may access it.
    // Transporters now have their own separate 1-on-1 conversation with the
    // buyer (created by getOrCreateDeliveryConversation) so they no longer
    // need piggy-back access to the buyer-farmer thread.
    if (conv.buyerId === userId || conv.farmerId === userId) return;
    throw new ForbiddenException();
  }

  async getOrCreateConversation(buyerId: string, farmerId: string, orderId?: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { buyerId, farmerId, ...(orderId ? { orderId } : {}) },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: { buyerId, farmerId, orderId },
    });
  }

  /** Open (or reuse) the in-app thread for an active delivery job.
   *
   * Each delivery creates a dedicated 1-on-1 between the transporter and the
   * buyer.  The farmer's separate buyer-farmer thread remains private.
   */
  async getOrCreateDeliveryConversation(transporterUserId: string, jobId: string) {
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId },
      include: {
        transporter: true,
        order: {
          include: {
            buyer: { select: { id: true } },
          },
        },
        request: { include: { farmer: { include: { user: { select: { id: true } } } } } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.transporter?.userId !== transporterUserId) {
      throw new ForbiddenException('You are not assigned to this delivery');
    }

    if (job.order) {
      // Transporter ↔ Buyer: use buyerId=transporter, farmerId=buyer so each
      // side can find the conversation via their own userId, and the actual
      // farmer's private thread is untouched.
      const buyerId = transporterUserId;
      const farmerId = job.order.buyer.id;
      const existing = await this.prisma.conversation.findFirst({
        where: { buyerId, farmerId, orderId: job.orderId },
      });
      if (existing) return existing;
      return this.prisma.conversation.create({
        data: { buyerId, farmerId, orderId: job.orderId },
      });
    }

    if (job.request) {
      // Transporter ↔ Farmer (transport request, no order involved)
      const farmerUserId = job.request.farmer.user.id;
      const existing = await this.prisma.conversation.findFirst({
        where: { buyerId: transporterUserId, farmerId: farmerUserId, orderId: null },
      });
      if (existing) return existing;
      return this.prisma.conversation.create({
        data: { buyerId: transporterUserId, farmerId: farmerUserId },
      });
    }

    throw new BadRequestException('This job has no chat contact');
  }

  async getConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({ where: { id: conversationId } });
  }

  async getAssignedTransporterUserId(orderId: string) {
    const job = await this.prisma.transportJob.findFirst({
      where: { orderId, transporterId: { not: null } },
      include: { transporter: true },
    });
    return job?.transporter?.userId ?? null;
  }

  async getUserConversations(userId: string, _role?: string) {
    // Each user can only see conversations they are a direct participant of
    // (either buyerId or farmerId).  Transporters access their delivery chats
    // through the same columns because getOrCreateDeliveryConversation stores
    // the transporter as buyerId and the buyer/farmer as farmerId.
    const orConditions: any[] = [{ buyerId: userId }, { farmerId: userId }];

    const convs = await this.prisma.conversation.findMany({
      where: { OR: orConditions },
      include: {
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        farmer: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const unreadRows = await this.prisma.message.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: convs.map((c) => c.id) },
        readAt: null,
        senderId: { not: userId },
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, r._count.id]));

    return convs
      .map((conv) => ({ ...conv, unreadCount: unreadMap.get(conv.id) ?? 0 }))
      .sort((a, b) => {
        const at = a.messages[0]?.createdAt?.getTime() ?? a.createdAt.getTime();
        const bt = b.messages[0]?.createdAt?.getTime() ?? b.createdAt.getTime();
        return bt - at;
      });
  }

  async getMessages(conversationId: string, userId: string, cursor?: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException();
    await this.assertConversationAccess(conv, userId);

    return this.prisma.message.findMany({
      where: {
        conversationId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async sendMessage(
    senderId: string,
    conversationId: string,
    body = '',
    imageUrl?: string,
    audioUrl?: string,
    audioDuration?: number,
  ) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException();
    await this.assertConversationAccess(conv, senderId);

    const trimmed = body.trim();
    if (!trimmed && !imageUrl && !audioUrl) {
      throw new BadRequestException('Message must include text, an image, or a voice note');
    }

    return this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        body: trimmed || (audioUrl ? 'Voice message' : ''),
        imageUrl,
        audioUrl,
        audioDuration,
      },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async getConversationContact(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: { select: { id: true, name: true, avatarUrl: true, phone: true, role: true } },
        farmer: { select: { id: true, name: true, avatarUrl: true, phone: true, role: true } },
      },
    });
    if (!conv) throw new NotFoundException();
    await this.assertConversationAccess(conv, userId);

    const other =
      userId === conv.buyerId
        ? conv.farmer
        : userId === conv.farmerId
          ? conv.buyer
          : conv.buyer;

    const farmerProfile = await this.prisma.farmerProfile.findUnique({
      where: { userId: conv.farmerId },
      select: { userId: true },
    });

    return {
      id: other.id,
      name: other.name,
      avatarUrl: other.avatarUrl,
      phone: other.phone,
      role: other.role,
      isFarmer: other.id === conv.farmerId && !!farmerProfile,
      farmerUserId: conv.farmerId,
    };
  }

  async markConversationRead(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException();
    await this.assertConversationAccess(conv, userId);

    await this.prisma.message.updateMany({
      where: { conversationId, readAt: null, senderId: { not: userId } },
      data: { readAt: new Date() },
    });
  }
}
