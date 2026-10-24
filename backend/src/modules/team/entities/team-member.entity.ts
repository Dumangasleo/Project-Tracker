import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { encryptedColumn } from '../../../common/security/field-encryption';
import { Position } from './position.entity';

@Entity('TeamMembers')
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'FirstName', length: 50 })
  firstName: string;

  @Column({ name: 'LastName', length: 50 })
  lastName: string;

  @Column({ name: 'MiddleName', type: 'nvarchar', length: 50, nullable: true })
  middleName: string | null;

  @Column({ name: 'Email', unique: true, transformer: encryptedColumn })
  email: string;

  @Index('UQ_TeamMembers_EmailHash', {
    unique: true,
    where: '[EmailHash] IS NOT NULL',
  })
  @Column({
    name: 'EmailHash',
    type: 'nvarchar',
    length: 64,
    nullable: true,
    select: false,
  })
  emailHash: string | null;

  @Column({
    name: 'Address',
    type: 'text',
    nullable: true,
    transformer: encryptedColumn,
  })
  address: string | null;

  @Column({
    name: 'ContactNumber',
    type: 'nvarchar',
    nullable: true,
    transformer: encryptedColumn,
  })
  contactNumber: string | null;

  @Column({ name: 'IsVerified', default: false })
  isVerified: boolean;

  @Column({
    name: 'PasswordHash',
    type: 'nvarchar',
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  @ManyToOne(() => Position, (position) => position.members)
  @JoinColumn({ name: 'PositionID' })
  position: Position;

  @Column({ name: 'PositionID' })
  positionId: number;

  @Column({ name: 'Avatar', type: 'nvarchar', nullable: true })
  avatar: string | null;

  @Column({ name: 'Status', default: 'offline' })
  status: string;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date;
}
