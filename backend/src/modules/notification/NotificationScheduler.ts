import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './NotificationService';

/**
 * Proactive reminders. Registered ONLY inside the notification microservice.
 * Every morning it scans open delegated tickets and creates a reminder for
 * each assignee (deduped so nobody gets spammed).
 */
@Injectable()
export class NotificationScheduler {
    private readonly logger = new Logger(NotificationScheduler.name);

    constructor(private readonly notificationService: NotificationService) {}

    // For local testing, temporarily swap to CronExpression.EVERY_30_SECONDS.
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async remindDelegatedTasks(): Promise<void> {
        const created = await this.notificationService.scanDelegatedTasks();
        this.logger.log(`Reminder sweep complete: created ${created} reminder(s).`);
    }
}
