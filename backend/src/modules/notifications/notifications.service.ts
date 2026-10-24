import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import type { MemberRegisteredEvent } from '../../messaging/events/member-registered.event';
import type { ProjectCreatedEvent } from '../../messaging/events/project-created.event';
import type { TaskAssignedEvent } from '../../messaging/events/task-assigned.event';
import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../tasks/task.enums';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './notification-type.enum';

const LIST_LIMIT = 50;
const REMINDER_COOLDOWN_MS = 20 * 60 * 60 * 1000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  findForMember(memberId: number, unreadOnly = false): Promise<Notification[]> {
    return this.notifications.find({
      where: unreadOnly
        ? { recipientId: memberId, isRead: false }
        : { recipientId: memberId },
      order: { createdAt: 'DESC' },
      take: LIST_LIMIT,
    });
  }

  async markAsRead(id: number, memberId: number): Promise<void> {
    const result = await this.notifications.update(
      { id, recipientId: memberId },
      { isRead: true },
    );
    if (!result.affected) {
      throw new NotFoundException({
        message: 'Notification not found.',
        code: ErrorCode.NotFound,
      });
    }
  }

  async markAllRead(memberId: number): Promise<{ updated: number }> {
    const result = await this.notifications.update(
      { recipientId: memberId, isRead: false },
      { isRead: true },
    );
    return { updated: result.affected ?? 0 };
  }

  async onTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    if (event.assigneeId == null) return;
    await this.create({
      recipientId: event.assigneeId,
      type: NotificationType.TaskAssigned,
      title: 'New task assigned to you',
      message: `You were assigned "${event.taskName}".`,
      referenceId: event.taskId,
    });
  }

  async onProjectCreated(event: ProjectCreatedEvent): Promise<void> {
    if (event.ownerId == null) return;
    await this.create({
      recipientId: event.ownerId,
      type: NotificationType.ProjectCreated,
      title: 'New project assigned to you',
      message: `You are the lead of "${event.projectName}".`,
      referenceId: event.projectId,
    });
  }

  async onMemberRegistered(event: MemberRegisteredEvent): Promise<void> {
    await this.create({
      recipientId: event.memberId,
      type: NotificationType.MemberRegistered,
      title: 'Welcome to the team',
      message: `Hi ${event.fullName}, your account (${event.email}) is ready.`,
      referenceId: event.memberId,
    });
  }

  /** Reminds assignees of open tasks, at most once per cooldown window per task. */
  async createOpenTaskReminders(): Promise<number> {
    const openTasks = await this.tasks.find({
      where: { status: Not(TaskStatus.Done), assigneeId: Not(IsNull()) },
      select: { id: true, name: true, assigneeId: true },
    });
    if (openTasks.length === 0) return 0;

    const recent = await this.notifications.find({
      where: {
        type: NotificationType.Reminder,
        createdAt: MoreThan(new Date(Date.now() - REMINDER_COOLDOWN_MS)),
      },
      select: { referenceId: true },
    });
    const reminded = new Set(recent.map((n) => n.referenceId));

    const reminders = openTasks
      .filter((task) => !reminded.has(task.id))
      .map((task) =>
        this.notifications.create({
          recipientId: task.assigneeId!,
          type: NotificationType.Reminder,
          title: 'Open task reminder',
          message: `You still have an open task: "${task.name}".`,
          referenceId: task.id,
        }),
      );

    if (reminders.length > 0) await this.notifications.save(reminders);
    return reminders.length;
  }

  private async create(data: Partial<Notification>): Promise<void> {
    await this.notifications.save(this.notifications.create(data));
    this.logger.log(`Notification ${data.type} -> member ${data.recipientId}`);
  }
}
