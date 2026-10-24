import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TeamMember } from '../../team/entities/team-member.entity';
import { SsoProvider } from '../sso/sso-provider.enum';

@Entity('ExternalIdentities')
@Index(['provider', 'subject'], { unique: true })
export class ExternalIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'Provider', type: 'nvarchar', length: 20 })
  provider: SsoProvider;

  @Column({ name: 'Subject', length: 255 })
  subject: string;

  @Index()
  @Column({ name: 'MemberId', type: 'int' })
  memberId: number;

  @ManyToOne(() => TeamMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MemberId' })
  member: TeamMember;

  @Column({ name: 'Email', length: 255 })
  email: string;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date;
}
