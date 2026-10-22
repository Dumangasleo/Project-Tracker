import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NOTIFICATION_CLIENT } from './NotificationPattern';
import { NotificationPublisher } from './NotificationPublisher';

/**
 * Global producer-side module.
 *
 * Provides a RabbitMQ ClientProxy (+ the NotificationPublisher wrapper) so any
 * service can publish domain events without knowing who consumes them. This is
 * the seam that lets the notification service run as a separate deployable.
 */
@Global()
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: NOTIFICATION_CLIENT,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            config.get<string>('RABBITMQ_URL') ??
                                'amqp://guest:guest@localhost:5672',
                        ],
                        queue: 'notifications_queue',
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    providers: [NotificationPublisher],
    exports: [ClientsModule, NotificationPublisher],
})
export class MessagingModule {}
