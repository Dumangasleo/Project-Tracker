import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { Notification } from './entity/Notification';
import { TaskEntity } from '../tasks/entities/tasks.entities';
import { TaskAssignedEvent } from '../../messaging/event/TaskAssignedEvent';
import { ProjectCreatedEvent } from '../../messaging/event/ProjectCreatedEvent';
import { MemberRegisteredEvent } from '../../messaging/event/MemberRegisteredEvent';

/** Notification types, kept together so the strings never drift. */
export const NotificationType = {
    TASK_ASSIGNED: 'TASK_ASSIGNED',
    PROJECT_CREATED: 'PROJECT_CREATED',
    MEMBER_REGISTERED: 'MEMBER_REGISTERED',
    REMINDER: 'REMINDER',
} as const;

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(TaskEntity)
        private readonly taskRepository: Repository<TaskEntity>,
    ) {}

    // ---- Write side: called by the RabbitMQ consumer -----------------------

    async createFromTaskAssigned(event: TaskAssignedEvent): Promise<void> {
        // Unassigned tickets have nobody to notify.
        if (event.assigneeId == null) return;

        await this.save({
            RecipientId: event.assigneeId,
            Type: NotificationType.TASK_ASSIGNED,
            Title: 'New ticket assigned to you',
            Message: `You were assigned the ticket "${event.taskName}".`,
            ReferenceId: event.taskId,
        });
    }

    async createFromProjectCreated(event: ProjectCreatedEvent): Promise<void> {
        // Notify the project owner. (Broadcasting to the whole team is a
        // future option — one row per member — but skipped here for now.)
        if (event.ownerId == null) return;

        await this.save({
            RecipientId: event.ownerId,
            Type: NotificationType.PROJECT_CREATED,
            Title: 'New project registered',
            Message: `The project "${event.projectName}" was registered and assigned to you.`,
            ReferenceId: event.projectId,
        });
    }

    async createFromMemberRegistered(event: MemberRegisteredEvent): Promise<void> {
        // Welcome the new member.
        await this.save({
            RecipientId: event.memberId,
            Type: NotificationType.MEMBER_REGISTERED,
            Title: 'Welcome to the team 🎉',
            Message: `Hi ${event.fullName}, your account (${event.email}) is now registered.`,
            ReferenceId: event.memberId,
        });
    }

    // ---- Read side: called by the HTTP controller (main API) ---------------

    findForMember(memberId: number, unreadOnly = false): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: unreadOnly
                ? { RecipientId: memberId, IsRead: false }
                : { RecipientId: memberId },
            order: { CreatedAt: 'DESC' },
            take: 100,
        });
    }

    async markAsRead(id: number): Promise<Notification> {
        const notification = await this.notificationRepository.findOneBy({ id });
        if (!notification) throw new NotFoundException('Notification not found');

        notification.IsRead = true;
        return this.notificationRepository.save(notification);
    }

    async markAllRead(memberId: number): Promise<{ updated: number }> {
        const result = await this.notificationRepository.update(
            { RecipientId: memberId, IsRead: false },
            { IsRead: true },
        );
        return { updated: result.affected ?? 0 };
    }

    // ---- Proactive reminders: called by the scheduler (microservice) -------

    /**
     * Create a REMINDER for every open, delegated ticket. Deduped so a dev
     * is not reminded about the same ticket more than once per ~20 hours.
     * Two queries + one bulk insert — cheap even at 50-100 devs.
     */
    async scanDelegatedTasks(): Promise<number> {
        const openTasks = await this.taskRepository.find({
            where: { Status: Not(2), TeamMemberId: Not(IsNull()) }, // 2 = Done
        });
        if (openTasks.length === 0) return 0;

        const since = new Date(Date.now() - 20 * 60 * 60 * 1000);
        const recentReminders = await this.notificationRepository.find({
            where: { Type: NotificationType.REMINDER, CreatedAt: MoreThan(since) },
            select: ['ReferenceId'],
        });
        const alreadyReminded = new Set(
            recentReminders.map((reminder) => reminder.ReferenceId),
        );

        const toCreate = openTasks
            .filter((task) => !alreadyReminded.has(task.id))
            .map((task) =>
                this.notificationRepository.create({
                    RecipientId: task.TeamMemberId,
                    Type: NotificationType.REMINDER,
                    Title: 'Open ticket reminder',
                    Message: `Reminder: you still have an open ticket "${task.TaskName}".`,
                    ReferenceId: task.id,
                    IsRead: false,
                }),
            );

        if (toCreate.length > 0) {
            await this.notificationRepository.save(toCreate);
        }
        return toCreate.length;
    }

    // ---- internal ----------------------------------------------------------

    private async save(data: Partial<Notification>): Promise<void> {
        const notification = this.notificationRepository.create(data);
        await this.notificationRepository.save(notification);
        this.logger.log(
            `Notification [${data.Type}] -> member ${data.RecipientId}`,
        );
    }
}
