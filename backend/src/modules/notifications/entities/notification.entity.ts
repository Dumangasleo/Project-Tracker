import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationType } from '../notification-type.enum';

@Entity('Notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'RecipientId', type: 'int' })
  recipientId: number;

  @Column({ name: 'Type', type: 'nvarchar', length: 40 })
  type: NotificationType;

  @Column({ name: 'Title', length: 200 })
  title: string;

  @Column({ name: 'Message', type: 'text' })
  message: string;

  @Column({ name: 'ReferenceId', type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ name: 'IsRead', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date;
}
