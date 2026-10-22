import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationServiceModule } from './modules/notification/NotificationServiceModule';

/**
 * Standalone entry point for the notification microservice.
 * Runs as its OWN process, separate from the HTTP API:
 *
 *   yarn workspace backend start:notification:dev
 *
 * It has no HTTP server — it only listens to RabbitMQ and runs the cron.
 */
async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        NotificationServiceModule,
        {
            transport: Transport.RMQ,
            options: {
                urls: [
                    process.env.RABBITMQ_URL ??
                        'amqp://guest:guest@localhost:5672',
                ],
                queue: 'notifications_queue',
                queueOptions: { durable: true },
            },
        },
    );

    await app.listen();
    Logger.log(
        '📨 Notification microservice is listening on RabbitMQ',
        'NotificationMain',
    );
}

bootstrap().catch((err) => {
    Logger.error('Notification microservice failed to start', err);
    process.exit(1);
});
