import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { TeamMember } from '../../team/entities/team-member.entity';
import {
  AnalysisStatus,
  PullRequestProvider,
  ReviewStatus,
} from '../review.enums';
import { ReviewComment } from './review-comment.entity';
import { ReviewReviewer } from './review-reviewer.entity';

@Entity('CodeReviews')
export class CodeReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'TaskId', type: 'int' })
  taskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'TaskId' })
  task: Task;

  @Index()
  @Column({ name: 'AuthorId', type: 'int' })
  authorId: number;

  @ManyToOne(() => TeamMember)
  @JoinColumn({ name: 'AuthorId' })
  author: TeamMember;

  @Column({ name: 'Provider', type: 'nvarchar', length: 20 })
  provider: PullRequestProvider;

  @Column({ name: 'PullRequestUrl', length: 500 })
  pullRequestUrl: string;

  @Column({ name: 'Repository', length: 200 })
  repository: string;

  @Column({ name: 'PullRequestNumber', type: 'int' })
  pullRequestNumber: number;

  @Column({ name: 'Title', length: 200 })
  title: string;

  @Column({ name: 'Message', type: 'nvarchar', length: 'MAX', nullable: true })
  message: string | null;

  @Index()
  @Column({ name: 'Status', type: 'smallint', default: ReviewStatus.Open })
  status: ReviewStatus;

  @Column({
    name: 'AnalysisStatus',
    type: 'smallint',
    default: AnalysisStatus.Pending,
  })
  analysisStatus: AnalysisStatus;

  @Column({
    name: 'AnalysisError',
    type: 'nvarchar',
    length: 500,
    nullable: true,
  })
  analysisError: string | null;

  @Column({
    name: 'AiSummary',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
  })
  aiSummary: string | null;

  @Column({ name: 'AiModel', type: 'nvarchar', length: 100, nullable: true })
  aiModel: string | null;

  @Column({ name: 'FilesChanged', type: 'int', nullable: true })
  filesChanged: number | null;

  @Column({ name: 'Additions', type: 'int', nullable: true })
  additions: number | null;

  @Column({ name: 'Deletions', type: 'int', nullable: true })
  deletions: number | null;

  @Column({ name: 'AnalyzedAt', type: 'datetime2', nullable: true })
  analyzedAt: Date | null;

  @Column({ name: 'HeadSha', type: 'nvarchar', length: 64, nullable: true })
  headSha: string | null;

  @OneToMany(() => ReviewReviewer, (reviewer) => reviewer.review)
  reviewers: ReviewReviewer[];

  @OneToMany(() => ReviewComment, (comment) => comment.review)
  comments: ReviewComment[];

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UpdatedAt' })
  updatedAt: Date;
}
