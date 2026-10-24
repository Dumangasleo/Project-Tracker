import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TeamMember } from '../../team/entities/team-member.entity';
import { ReviewDecision } from '../review.enums';
import { CodeReview } from './code-review.entity';

@Entity('ReviewReviewers')
@Index(['reviewId', 'memberId'], { unique: true })
export class ReviewReviewer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ReviewId', type: 'int' })
  reviewId: number;

  @ManyToOne(() => CodeReview, (review) => review.reviewers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ReviewId' })
  review: CodeReview;

  @Index()
  @Column({ name: 'MemberId', type: 'int' })
  memberId: number;

  @ManyToOne(() => TeamMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MemberId' })
  member: TeamMember;

  @Column({ name: 'Decision', type: 'smallint', nullable: true })
  decision: ReviewDecision | null;

  @Column({ name: 'DecidedAt', type: 'datetime2', nullable: true })
  decidedAt: Date | null;
}
