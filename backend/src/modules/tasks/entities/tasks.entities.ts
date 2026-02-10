import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('assigned_tasks')
export class AssignedTask {
    @PrimaryGeneratedColumn('increment') // O 'uuid' para sa advanced setup
    id: number;

    @Column()
    TaskName: string;

    @Column({ type: 'text', nullable: true })
    Description: string;

    @Column({ type: 'smallint', default: 0 }) // 0: Todo, 1: In Progress, 2: Done
    Status: number;

    @Column({ type: 'smallint', default: 1 }) // 1: Low, 2: Medium, 3: High
    Priority: number;

    @Column({ type: 'bigint' })
    ProjectId: number;

    @Column({ type: 'bigint' })
    TeamMemberId: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    EstimatedHours: number;

    @Column({ type: 'timestamp', nullable: true })
    DueDate: Date;

    @CreateDateColumn()
    DateCreated: Date;

    @UpdateDateColumn()
    DateUpdated: Date; // Para malaman kung kailan huling binago ang status
}