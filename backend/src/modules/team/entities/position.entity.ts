import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TeamMember } from './team-member.entity';

@Entity('Positions')
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'Title', length: 100 })
  title: string;

  @Column({ name: 'Department', length: 50, default: 'Engineering' })
  department: string;

  @Column({ name: 'AccessLevel', default: 1 })
  accessLevel: number;

  @OneToMany(() => TeamMember, (member) => member.position)
  members: TeamMember[];
}
