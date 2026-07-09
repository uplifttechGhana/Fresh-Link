import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { Server } from 'socket.io';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private wsServer: Server | null = null;

  constructor(private prisma: PrismaService) {}

  /** Called by ChatGateway.afterInit() to share the socket.io server instance */
  setWsServer(server: Server) {
    this.wsServer = server;
  }

  async sendTestPush(userId: string) {
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) {
      return {
        ok: false,
        message: 'No device token registered for this account. Enable push notifications first.',
      };
    }

    await this.createNotification(
      userId,
      'system' as NotificationType,
      '🌱 Push notifications working!',
      'Your FreshLink push notifications are set up correctly. You\'re all set.',
    );

    return { ok: true, message: 'Test notification sent!', tokenCount: tokens.length };
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    payload?: object,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, payload: payload ?? {} },
    });

    // Push to connected WebSocket client instantly
    this.wsServer?.to(`user:${userId}`).emit('notification:new', notification);

    // Attempt FCM push
    await this.pushToDevice(userId, title, body, payload);

    return notification;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, total, page: p, limit: l, unreadCount };
  }

  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }

  private async pushToDevice(userId: string, title: string, body: string, data?: object) {
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      this.logger.warn(`[Push stub] To ${userId}: ${title} — ${body}`);
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ?? 'https://fresh-link-weld.vercel.app';
    const iconUrl  = `${frontendUrl}/app-icon-192.png`;
    const imageUrl = `${frontendUrl}/freshlink-logo.png`;
    const stringData = data
      ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
      : undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const admin = require('firebase-admin') as any;
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
          }),
        });
      }

      await Promise.allSettled(
        tokens.map((t) =>
          admin.messaging().send({
            token: t.token,
            notification: { title, body, imageUrl },
            data: stringData,
            webpush: {
              notification: {
                icon:               iconUrl,
                badge:              iconUrl,
                image:              imageUrl,
                requireInteraction: false,
                vibrate:            [200, 100, 200],
              },
              fcmOptions: { link: frontendUrl },
            },
            android: {
              notification: {
                imageUrl,
                channelId: 'freshlink_default',
              },
            },
          }),
        ),
      );
    } catch (err) {
      this.logger.error('Push notification failed (firebase-admin not installed or misconfigured)', err);
    }
  }
}
