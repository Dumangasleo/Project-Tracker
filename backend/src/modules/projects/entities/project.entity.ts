import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Priority } from '../../../common/enums/priority.enum';
import { TeamMember } from '../../team/entities/team-member.entity';
import { ProjectStatus } from '../project-status.enum';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index()
  @Column({ name: 'ProjectName' })
  name: string;

  @Column({ name: 'Description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'Status', type: 'smallint', default: ProjectStatus.Planning })
  status: ProjectStatus;

  @Column({ name: 'Priority', type: 'smallint', default: Priority.Low })
  priority: Priority;

  @Column({ name: 'TeamMemberId', type: 'int', nullable: true })
  leadId: number | null;

  @Column({ name: 'Repository', type: 'nvarchar', length: 200, nullable: true })
  repository: string | null;

  @ManyToOne(() => TeamMember, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'TeamMemberId' })
  lead: TeamMember | null;

  @CreateDateColumn({ name: 'DateCreated' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'DateUpdated' })
  updatedAt: Date;
}
