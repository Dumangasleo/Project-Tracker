import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TeamMember } from './team.entities';

@Entity('Positions')
export class Position {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    Title: string;

    @Column({ length: 50, default: 'Engineering' })
    Department: string;

    @Column({ default: 1 })
    AccessLevel: number;


    @OneToMany(() => TeamMember, (member) => member.position)
    members: TeamMember[];
}