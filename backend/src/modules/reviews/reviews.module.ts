import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitModule } from '../git/git.module';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { AiReviewerService } from './analysis/ai-reviewer.service';
import { PullRequestClient } from './analysis/pull-request.client';
import { ReviewAnalysisService } from './analysis/review-analysis.service';
import { CodeReview } from './entities/code-review.entity';
import { ReviewComment } from './entities/review-comment.entity';
import { ReviewReviewer } from './entities/review-reviewer.entity';
import { GiteaWebhookController } from './gitea-webhook.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    GitModule,
    TypeOrmModule.forFeature([
      CodeReview,
      ReviewReviewer,
      ReviewComment,
      Task,
      TeamMember,
      Project,
    ]),
  ],
  controllers: [ReviewsController, GiteaWebhookController],
  providers: [
    ReviewsService,
    ReviewAnalysisService,
    PullRequestClient,
    AiReviewerService,
  ],
})
export class ReviewsModule {}
