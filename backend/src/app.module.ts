import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProduceModule } from './produce/produce.module';
import { OrdersModule } from './orders/orders.module';
import { TransportModule } from './transport/transport.module';
import { WalletModule } from './wallet/wallet.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { PaymentsModule } from './payments/payments.module';
import { InvestorModule } from './investor/investor.module';
import { AdminModule } from './admin/admin.module';
import { UssdModule } from './ussd/ussd.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { SmsModule } from './sms/sms.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    // Serve backend/public/ as static files — uploaded images are at /uploads/...
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProduceModule,
    OrdersModule,
    TransportModule,
    WalletModule,
    ChatModule,
    NotificationsModule,
    StorageModule,
    PaymentsModule,
    InvestorModule,
    AdminModule,
    UssdModule,
    PaymentMethodsModule,
    KnowledgeModule,
    SmsModule,
    IntegrationsModule,
  ],
})
export class AppModule {}
