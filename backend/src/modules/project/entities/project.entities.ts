import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn, Index
} from 'typeorm';
import {TeamMember} from "../../team/entities/team.entities";

@Entity('projects')
export class ProjectEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Index()
    @Column()
    ProjectName: string;

    @Column({ type: 'text', nullable: true })
    Description: string;

    @Column({ type: 'smallint', default: 0 }) // 0: Planning, 1: Active, 2: Completed
    Status: number;

    @Column({ type: 'smallint', default: 1 }) // 1: Low, 2: Medium, 3: High
    Priority: number;

    @Column({ type: 'int', nullable: true })
    TeamMemberId: number;

    @CreateDateColumn()
    DateCreated: Date;

    @UpdateDateColumn()
    DateUpdated: Date;
}