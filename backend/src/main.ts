import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpHeader } from './common/constants/http-headers';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { requestContext } from './common/middleware/request-context.middleware';
import { NodeEnv, type ApiEnv } from './config/env.validation';
import { setupSwagger } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<ApiEnv, true>>(ConfigService);
  const isProduction =
    config.get('NODE_ENV', { infer: true }) === NodeEnv.Production;

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
  app.use(cookieParser());
  app.use(requestContext);

  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      HttpHeader.ClientId,
      HttpHeader.ClientTimestamp,
      HttpHeader.RequestId,
    ],
    exposedHeaders: [HttpHeader.RequestId, HttpHeader.ServerTimestamp],
    maxAge: 600,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (!isProduction) setupSwagger(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap().catch((error: Error) => {
  Logger.error('API failed to start', error.stack, 'Bootstrap');
  process.exit(1);
});
