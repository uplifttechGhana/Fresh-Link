import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Normalize: NestJS getResponse() returns a string or { message, error, statusCode }
    // Always expose a flat `message` (string or string[]) so clients don't need to unwrap.
    const message: string | string[] =
      typeof raw === 'string'
        ? raw
        : Array.isArray((raw as any).message)
          ? (raw as any).message
          : String((raw as any).message ?? 'An error occurred');

    if (status >= 500) {
      this.logger.error(exception);
      Sentry.captureException(exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
