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
import { CommentKind, type Severity } from '../review.enums';
import { CodeReview } from './code-review.entity';

@Entity('ReviewComments')
export class ReviewComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'ReviewId', type: 'int' })
  reviewId: number;

  @ManyToOne(() => CodeReview, (review) => review.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ReviewId' })
  review: CodeReview;

  @Column({ name: 'AuthorId', type: 'int', nullable: true })
  authorId: number | null;

  @ManyToOne(() => TeamMember, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'AuthorId' })
  author: TeamMember | null;

  @Column({ name: 'Kind', type: 'smallint', default: CommentKind.Comment })
  kind: CommentKind;

  @Column({ name: 'Body', type: 'nvarchar', length: 'MAX' })
  body: string;

  @Column({ name: 'FilePath', type: 'nvarchar', length: 500, nullable: true })
  filePath: string | null;

  @Column({ name: 'Line', type: 'int', nullable: true })
  line: number | null;

  @Column({ name: 'Severity', type: 'nvarchar', length: 10, nullable: true })
  severity: Severity | null;

  @Column({ name: 'Resolved', default: false })
  resolved: boolean;

  @CreateDateColumn({ name: 'CreatedAt' })
  createdAt: Date;
}
