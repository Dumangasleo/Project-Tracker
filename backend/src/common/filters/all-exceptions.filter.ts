import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorCode } from '../constants/error-codes';

const SQL_UNIQUE_VIOLATION = new Set([2601, 2627]);
const SQL_FOREIGN_KEY_VIOLATION = 547;

interface ErrorBody {
  statusCode: number;
  code?: string;
  message: string | string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const body = this.toErrorBody(exception);

    if (body.statusCode >= 500) {
      this.logger.error(
        `[${request.requestId}] ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(body.statusCode).json({
      ...body,
      requestId: request.requestId,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') return { statusCode, message: payload };

      const { message, code } = payload as {
        message?: string | string[];
        code?: string;
      };
      return { statusCode, code, message: message ?? exception.message };
    }

    if (exception instanceof QueryFailedError) {
      const sqlNumber = (exception.driverError as { number?: number }).number;

      if (sqlNumber !== undefined && SQL_UNIQUE_VIOLATION.has(sqlNumber)) {
        return {
          statusCode: HttpStatus.CONFLICT,
          code: ErrorCode.Conflict,
          message: 'A record with the same value already exists.',
        };
      }
      if (sqlNumber === SQL_FOREIGN_KEY_VIOLATION) {
        return {
          statusCode: HttpStatus.CONFLICT,
          code: ErrorCode.Conflict,
          message: 'This record is still referenced by other data.',
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error.',
    };
  }
}
