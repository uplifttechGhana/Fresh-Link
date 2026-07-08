import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
  cors: {
    origin: (origin: string, cb: (e: Error | null, ok?: boolean) => void) => {
      const allowed = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /^capacitor:\/\/localhost$/,
        /^ionic:\/\/localhost$/,
        /^https:\/\/.*\.vercel\.app$/,
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      if (!origin || allowed.some((p) => (p instanceof RegExp ? p.test(origin) : p === origin))) {
        cb(null, true);
      } else {
        cb(new Error(`WS CORS: ${origin} not allowed`));
      }
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.notificationsService.setWsServer(server);
    this.logger.log('WebSocket gateway initialised');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) throw new Error('No token');
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_ACCESS_SECRET });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Connected: ${client.id} user=${payload.sub}`);
    } catch {
      this.logger.warn(`Unauthenticated WS: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:conversation')
  joinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.join(`conv:${conversationId}`);
  }

  @SubscribeMessage('send:message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      body?: string;
      imageUrl?: string;
      audioUrl?: string;
      audioDuration?: number;
    },
  ) {
    const message = await this.chatService.sendMessage(
      client.data.userId,
      payload.conversationId,
      payload.body ?? '',
      payload.imageUrl,
      payload.audioUrl,
      payload.audioDuration,
    );

    // Push to people currently in the chat room
    this.server.to(`conv:${payload.conversationId}`).emit('new:message', message);

    // Also push an inbox update to each participant's personal room
    // so the conversations list updates in real-time even when not in the chat
    const conv = await this.chatService.getConversationById(payload.conversationId);
    if (conv) {
      const inboxPayload = { conversationId: payload.conversationId, message };
      this.server.to(`user:${conv.buyerId}`).emit('inbox:update', inboxPayload);
      this.server.to(`user:${conv.farmerId}`).emit('inbox:update', inboxPayload);

      if (conv.orderId) {
        const job = await this.chatService.getAssignedTransporterUserId(conv.orderId);
        if (job) this.server.to(`user:${job}`).emit('inbox:update', inboxPayload);
      }
    }

    return message;
  }

  @SubscribeMessage('mark:read')
  async markRead(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    await this.chatService.markConversationRead(conversationId, client.data.userId);
    this.server
      .to(`conv:${conversationId}`)
      .emit('messages:read', { conversationId, userId: client.data.userId });
  }

  /** Broadcast typing start to the other party in the conversation */
  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.to(`conv:${conversationId}`).emit('user:typing', {
      conversationId,
      userId: client.data.userId,
      isTyping: true,
    });
  }

  /** Broadcast typing stop to the other party */
  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
    client.to(`conv:${conversationId}`).emit('user:typing', {
      conversationId,
      userId: client.data.userId,
      isTyping: false,
    });
  }

  emitOrderUpdate(userId: string, payload: object) {
    this.server.to(`user:${userId}`).emit('order:update', payload);
  }

  emitJobUpdate(userId: string, payload: object) {
    this.server.to(`user:${userId}`).emit('job:update', payload);
  }
}
