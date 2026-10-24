import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { validateDatabaseEnv } from './config/env.validation';
import { NOTIFICATION_QUEUE } from './messaging/notification-events';
import { NotificationsWorkerModule } from './modules/notifications/worker/notifications-worker.module';

async function bootstrap(): Promise<void> {
  const env = validateDatabaseEnv(process.env);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsWorkerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [env.RABBITMQ_URL],
        queue: NOTIFICATION_QUEUE,
        queueOptions: { durable: true },
      },
    },
  );

  app.enableShutdownHooks();
  await app.listen();
  Logger.log('Notification worker is listening on RabbitMQ', 'Bootstrap');
}

bootstrap().catch((error: Error) => {
  Logger.error('Notification worker failed to start', error.stack, 'Bootstrap');
  process.exit(1);
});
