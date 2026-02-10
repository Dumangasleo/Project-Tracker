import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import {Position} from "./position.entities";

@Entity('TeamMembers')
export class TeamMember {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50 })
    FirstName: string;

    @Column({ length: 50 })
    LastName: string;

    @Column({ length: 50, nullable: true })
    MiddleName: string;

    @Column({ unique: true })
    Email: string;

    @Column('text')
    Address: string;

    @Column()
    ContactNumber: string;

    @Column({ default: false })
    IsVerified: boolean;

    @ManyToOne(() => Position, (position) => position.members)
    @JoinColumn({ name: 'PositionID' })
    position: Position;

    @Column()
    PositionID: number;


    @Column({ nullable: true })
    Avatar: string;

    @Column({ default: 'offline' })
    Status: string;

    @CreateDateColumn()
    CreatedAt: Date;
}