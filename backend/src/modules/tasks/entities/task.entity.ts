import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Priority } from '../../../common/enums/priority.enum';
import { Project } from '../../projects/entities/project.entity';
import { TeamMember } from '../../team/entities/team-member.entity';
import { TaskStatus, TaskType } from '../task.enums';

@Entity('AssignedTasks')
export class Task {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'TaskName' })
  name: string;

  @Column({ name: 'Description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'Status', type: 'smallint', default: TaskStatus.Todo })
  status: TaskStatus;

  @Column({ name: 'Priority', type: 'smallint', default: Priority.Low })
  priority: Priority;

  @Column({ name: 'TaskType', type: 'smallint', default: TaskType.General })
  type: TaskType;

  @ManyToOne(() => TeamMember)
  @JoinColumn({ name: 'CreatedBy' })
  creator: TeamMember;

  @Column({ name: 'CreatedBy', type: 'int', default: 1 })
  createdById: number;

  @ManyToOne(() => TeamMember)
  @JoinColumn({ name: 'TeamMemberId' })
  assignee: TeamMember | null;

  @Column({ name: 'TeamMemberId', type: 'int', nullable: true })
  assigneeId: number | null;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'ProjectId' })
  project: Project | null;

  @Column({ name: 'ProjectId', type: 'int', nullable: true })
  projectId: number | null;

  @Column({
    name: 'EstimatedHours',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  estimatedHours: number | null;

  @Column({ name: 'DueDate', type: 'datetime2', nullable: true })
  dueDate: Date | null;

  @CreateDateColumn({ name: 'DateCreated' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'DateUpdated' })
  updatedAt: Date;
}
