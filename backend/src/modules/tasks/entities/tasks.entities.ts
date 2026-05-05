import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import {TeamMember} from "../../team/entities/team.entities";

@Entity('AssignedTasks')
export class TaskEntity  {
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

    @Column({ type: 'smallint', default: 0 }) // 0: General, 1: Feature, 2: Bug Fix, 3: Hot Fix, 4: Release
    TaskType: number;

    @ManyToOne(() => TeamMember)
    @JoinColumn({ name: 'CreatedBy' })
    creator: TeamMember;

    @Column({ type: 'int', default: 1 })
    CreatedBy: number;

    @ManyToOne(() => TeamMember)
    @JoinColumn({ name: 'TeamMemberId' })
    assignee: TeamMember;

    @Column({ type: 'int', nullable: true }) // Nullable para sa unassigned tickets
    TeamMemberId: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    EstimatedHours: number;

    @Column({ type: 'datetime2', nullable: true })
    DueDate: Date;

    @CreateDateColumn()
    DateCreated: Date;

    @UpdateDateColumn()
    DateUpdated: Date; // Para malaman kung kailan huling binago ang status
}