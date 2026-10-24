import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MemberRegisteredEvent } from '../../../messaging/events/member-registered.event';
import { ProjectCreatedEvent } from '../../../messaging/events/project-created.event';
import {
  ReviewCommentedEvent,
  ReviewDecidedEvent,
  ReviewRequestedEvent,
} from '../../../messaging/events/review.events';
import { TaskAssignedEvent } from '../../../messaging/events/task-assigned.event';
import { NotificationEvent } from '../../../messaging/notification-events';
import { NotificationsService } from '../notifications.service';

@Controller()
export class NotificationsConsumer {
  constructor(private readonly notifications: NotificationsService) {}

  @EventPattern(NotificationEvent.TaskAssigned)
  onTaskAssigned(@Payload() event: TaskAssignedEvent): Promise<void> {
    return this.notifications.onTaskAssigned(event);
  }

  @EventPattern(NotificationEvent.ProjectCreated)
  onProjectCreated(@Payload() event: ProjectCreatedEvent): Promise<void> {
    return this.notifications.onProjectCreated(event);
  }

  @EventPattern(NotificationEvent.MemberRegistered)
  onMemberRegistered(@Payload() event: MemberRegisteredEvent): Promise<void> {
    return this.notifications.onMemberRegistered(event);
  }

  @EventPattern(NotificationEvent.ReviewRequested)
  onReviewRequested(@Payload() event: ReviewRequestedEvent): Promise<void> {
    return this.notifications.onReviewRequested(event);
  }

  @EventPattern(NotificationEvent.ReviewCommented)
  onReviewCommented(@Payload() event: ReviewCommentedEvent): Promise<void> {
    return this.notifications.onReviewCommented(event);
  }

  @EventPattern(NotificationEvent.ReviewDecided)
  onReviewDecided(@Payload() event: ReviewDecidedEvent): Promise<void> {
    return this.notifications.onReviewDecided(event);
  }
}
