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

    @Column({ type: 'text', nullable: true })
    Address: string;

    @Column({ nullable: true })
    ContactNumber: string;

    @Column({ default: false })
    IsVerified: boolean;

    // Auth credential (bcrypt hash). select:false so it is never returned
    // by ordinary queries — login pulls it in explicitly via addSelect().
    @Column({ nullable: true, select: false })
    PasswordHash: string;

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