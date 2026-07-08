import './instrument'; // Sentry must be imported first
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global exception filter (logs + Sentry)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve uploaded files directly via Express (before the global prefix kicks in)
  const uploadsDir = join(__dirname, '..', '..', 'public');
  app.use('/uploads', express.static(uploadsDir + '/uploads'));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — allow the Vite dev server (any port) and Capacitor WebView
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /^capacitor:\/\/localhost$/,
        /^ionic:\/\/localhost$/,
        /^https:\/\/.*\.vercel\.app$/,
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      if (!origin || allowed.some((p) => (p instanceof RegExp ? p.test(origin) : p === origin))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe — strip unknown props, transform types
  app.use(express.urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger / OpenAPI docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FreshLink API')
    .setDescription('Ghana agricultural marketplace — REST API v1')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 FreshLink API running on http://0.0.0.0:${port}/api/v1`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);

  const atKey = process.env.AFRICASTALKING_API_KEY?.trim();
  const atUser = process.env.AFRICASTALKING_USERNAME?.trim() || 'sandbox';
  if (atKey) {
    logger.log(`📱 Africa's Talking SMS: ${atUser === 'sandbox' ? 'SANDBOX' : 'LIVE'} (username=${atUser})`);
  } else {
    logger.warn(`📱 Africa's Talking SMS: STUB MODE — set AFRICASTALKING_API_KEY in .env for real SMS`);
  }
}

bootstrap();
