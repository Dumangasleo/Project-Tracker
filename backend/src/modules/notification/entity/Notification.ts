import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

/**
 * A single in-app notification for one team member.
 *
 * Rows are WRITTEN only by the notification microservice (from RabbitMQ
 * events + the reminder cron) and READ by the main API's HTTP controller.
 */
@Entity('Notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    // The team member who should see this notification.
    @Index()
    @Column({ type: 'int' })
    RecipientId: number;

    // TASK_ASSIGNED | PROJECT_CREATED | MEMBER_REGISTERED | REMINDER
    @Column({ length: 40 })
    Type: string;

    @Column({ length: 200 })
    Title: string;

    @Column({ type: 'text' })
    Message: string;

    // Id of the related task / project / member, for deep-linking on the UI.
    @Column({ type: 'int', nullable: true })
    ReferenceId: number | null;

    @Column({ default: false })
    IsRead: boolean;

    @CreateDateColumn()
    CreatedAt: Date;
}
