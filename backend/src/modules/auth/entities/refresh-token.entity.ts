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

@Entity('RefreshTokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'TokenHash', type: 'char', length: 64 })
  tokenHash: string;

  @Index()
  @Column({ name: 'FamilyId', type: 'char', length: 36 })
  familyId: string;

  @Index()
  @Column({ name: 'MemberId', type: 'int' })
  memberId: number;

  @ManyToOne(() => TeamMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MemberId' })
  member: TeamMember;

  @Column({ name: 'ExpiresAt', type: 'datetime2' })
  expiresAt: Date;

  @Column({ name: 'RevokedAt', type: 'datetime2', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'UserAgent', type: 'nvarchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ name: 'IpAddress', type: 'nvarchar', length: 64, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date;
}
