import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notifications: NotificationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async remindOpenTasks(): Promise<void> {
    const created = await this.notifications.createOpenTaskReminders();
    this.logger.log(`Reminder sweep created ${created} reminder(s).`);
  }
}
