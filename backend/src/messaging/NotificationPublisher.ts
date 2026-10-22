import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_CLIENT } from './NotificationPattern';

/**
 * Thin wrapper around the RabbitMQ client.
 *
 * Producers (Tasks / Project / Team services) depend on this instead of the
 * raw ClientProxy so that publishing is fire-and-forget: if RabbitMQ is down,
 * we log a warning but never fail the originating HTTP request.
 */
@Injectable()
export class NotificationPublisher {
    private readonly logger = new Logger(NotificationPublisher.name);

    constructor(
        @Inject(NOTIFICATION_CLIENT) private readonly client: ClientProxy,
    ) {}

    publish(pattern: string, payload: unknown): void {
        this.client.emit(pattern, payload).subscribe({
            error: (err) =>
                this.logger.warn(
                    `Failed to publish "${pattern}": ${err?.message ?? err}`,
                ),
        });
    }
}
