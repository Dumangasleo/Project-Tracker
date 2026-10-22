import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entity/Notification';
import { TaskEntity } from '../tasks/entities/tasks.entities';
import { NotificationService } from './NotificationService';
import { NotificationController } from './NotificationController';

/**
 * Feature module shared by BOTH processes:
 *  - the main API imports it for the HTTP read controller + service;
 *  - the notification microservice imports it for the service + entity.
 *
 * The RabbitMQ consumer and the cron scheduler are intentionally NOT here —
 * they belong only to the microservice (see NotificationServiceModule).
 */
@Module({
    imports: [TypeOrmModule.forFeature([Notification, TaskEntity])],
    providers: [NotificationService],
    controllers: [NotificationController],
    exports: [NotificationService],
})
export class NotificationModule {}
