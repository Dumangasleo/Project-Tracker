import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_CLIENT, NotificationEvent } from './notification-events';

/** Fire-and-forget: a broker outage is logged but never fails the HTTP request. */
@Injectable()
export class NotificationPublisher {
  private readonly logger = new Logger(NotificationPublisher.name);

  constructor(
    @Inject(NOTIFICATION_CLIENT) private readonly client: ClientProxy,
  ) {}

  publish(event: NotificationEvent, payload: object): void {
    this.client.emit(event, payload).subscribe({
      error: (error: Error) =>
        this.logger.warn(`Failed to publish "${event}": ${error.message}`),
    });
  }
}
