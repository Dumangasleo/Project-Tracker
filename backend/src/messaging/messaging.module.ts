import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { DatabaseEnv } from '../config/env.validation';
import { NOTIFICATION_CLIENT, NOTIFICATION_QUEUE } from './notification-events';
import { NotificationPublisher } from './notification.publisher';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService<DatabaseEnv, true>) => {
          const url: string = config.get('RABBITMQ_URL', { infer: true });
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: NOTIFICATION_QUEUE,
              queueOptions: { durable: true },
            },
          };
        },
      },
    ]),
  ],
  providers: [NotificationPublisher],
  exports: [NotificationPublisher],
})
export class MessagingModule {}
