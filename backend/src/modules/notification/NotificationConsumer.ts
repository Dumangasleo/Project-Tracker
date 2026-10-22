import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './NotificationService';
import { NotificationPattern } from '../../messaging/NotificationPattern';
import { TaskAssignedEvent } from '../../messaging/event/TaskAssignedEvent';
import { ProjectCreatedEvent } from '../../messaging/event/ProjectCreatedEvent';
import { MemberRegisteredEvent } from '../../messaging/event/MemberRegisteredEvent';

/**
 * RabbitMQ consumer. Registered ONLY inside the notification microservice
 * process (NotificationMain.ts) — it turns domain events into notification
 * rows. The main API never loads this class.
 */
@Controller()
export class NotificationConsumer {
    constructor(private readonly notificationService: NotificationService) {}

    @EventPattern(NotificationPattern.TASK_ASSIGNED)
    async onTaskAssigned(@Payload() event: TaskAssignedEvent) {
        await this.notificationService.createFromTaskAssigned(event);
    }

    @EventPattern(NotificationPattern.PROJECT_CREATED)
    async onProjectCreated(@Payload() event: ProjectCreatedEvent) {
        await this.notificationService.createFromProjectCreated(event);
    }

    @EventPattern(NotificationPattern.MEMBER_REGISTERED)
    async onMemberRegistered(@Payload() event: MemberRegisteredEvent) {
        await this.notificationService.createFromMemberRegistered(event);
    }
}
