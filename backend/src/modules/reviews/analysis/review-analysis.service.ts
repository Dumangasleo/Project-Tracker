import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GiteaClient } from '../../git/gitea.client';
import { CodeReview } from '../entities/code-review.entity';
import { ReviewComment } from '../entities/review-comment.entity';
import {
  AnalysisStatus,
  CommentKind,
  PullRequestProvider,
  SEVERITIES,
} from '../review.enums';
import { AiReviewerService } from './ai-reviewer.service';
import { diffStats, parseDiff } from './diff';
import { findWarnings, type Finding } from './diff-warnings';
import {
  PullRequestClient,
  type PullRequestSnapshot,
} from './pull-request.client';
import {
  defaultReviewTitle,
  parsePullRequestUrl,
  repositoryName,
  type PullRequestRef,
} from './pull-request-url';

/** Runs the free pattern checks and the optional AI review, then stores both as review comments. */
@Injectable()
export class ReviewAnalysisService {
  private readonly logger = new Logger(ReviewAnalysisService.name);
  private readonly running = new Set<number>();

  constructor(
    @InjectRepository(CodeReview)
    private readonly reviews: Repository<CodeReview>,
    @InjectRepository(ReviewComment)
    private readonly comments: Repository<ReviewComment>,
    private readonly pullRequests: PullRequestClient,
    private readonly ai: AiReviewerService,
    private readonly gitea: GiteaClient,
  ) {}

  isRunning(reviewId: number): boolean {
    return this.running.has(reviewId);
  }

  /** Fire-and-forget: the caller gets an immediate response and the UI polls for the result. */
  start(reviewId: number): void {
    if (this.running.has(reviewId)) return;
    this.running.add(reviewId);
    void this.analyze(reviewId)
      .catch(async (error: Error) => {
        this.logger.error(
          `Analysis of review ${reviewId} crashed`,
          error.stack,
        );
        await this.fail(
          reviewId,
          `The checks stopped unexpectedly: ${error.message}`,
        ).catch(() => undefined);
      })
      .finally(() => this.running.delete(reviewId));
  }

  private async analyze(reviewId: number): Promise<void> {
    const review = await this.reviews.findOneBy({ id: reviewId });
    const ref =
      review && parsePullRequestUrl(review.pullRequestUrl, { gitea: true });
    if (!review || !ref) return;

    await this.reviews.update(reviewId, {
      analysisStatus: AnalysisStatus.Running,
      analysisError: null,
    });

    let snapshot: PullRequestSnapshot;
    try {
      snapshot = await this.pullRequests.fetch(ref);
    } catch (error) {
      await this.fail(reviewId, (error as Error).message);
      return;
    }

    if (snapshot.title && review.title === defaultReviewTitle(ref)) {
      await this.reviews.update(reviewId, {
        title: snapshot.title.slice(0, 200),
      });
    }

    const files = parseDiff(snapshot.diff);
    const warnings = findWarnings(files);
    const notes: string[] = [];
    if (snapshot.truncated)
      notes.push('The diff was very large; only the first part was checked.');

    let aiSummary: string | null = null;
    let aiModel: string | null = null;
    let aiFindings: Finding[] = [];
    if (this.ai.enabled) {
      try {
        const result = await this.ai.review(snapshot.diff, files);
        aiSummary = result.summary;
        aiModel = result.model;
        aiFindings = result.findings;
        if (result.skippedFiles.length > 0) {
          notes.push(
            `AI skipped ${result.skippedFiles.length} file(s) because the diff is large: ${result.skippedFiles.join(', ')}.`,
          );
        }
      } catch (error) {
        notes.push(`AI review did not run: ${(error as Error).message}`);
      }
    } else {
      notes.push(
        'AI review is off. Add a free GEMINI_API_KEY to backend/.env to turn it on.',
      );
    }

    await this.comments.delete({
      reviewId,
      kind: In([CommentKind.Warning, CommentKind.AiFinding]),
    });
    await this.comments.save([
      ...warnings.map((finding) =>
        this.toComment(reviewId, CommentKind.Warning, finding),
      ),
      ...aiFindings.map((finding) =>
        this.toComment(reviewId, CommentKind.AiFinding, finding),
      ),
    ]);

    if (ref.provider === PullRequestProvider.Gitea) {
      try {
        await this.publishToGitea(ref, snapshot.headSha, aiSummary, [
          ...warnings,
          ...aiFindings,
        ]);
      } catch (error) {
        notes.push(
          `Could not post the results to the Git server: ${(error as Error).message}`,
        );
      }
    }

    await this.reviews.update(reviewId, {
      ...diffStats(files),
      headSha: snapshot.headSha ?? review.headSha,
      analysisStatus: AnalysisStatus.Completed,
      analysisError: notes.length > 0 ? notes.join(' ').slice(0, 500) : null,
      aiSummary,
      aiModel,
      analyzedAt: new Date(),
    });
  }

  /** Mirrors the findings onto the Gitea pull request so developers also see them next to the code. */
  private async publishToGitea(
    ref: PullRequestRef,
    headSha: string | undefined,
    aiSummary: string | null,
    findings: Finding[],
  ): Promise<void> {
    const counts = SEVERITIES.map((severity) => ({
      severity,
      count: findings.filter((finding) => finding.severity === severity).length,
    })).filter((entry) => entry.count > 0);

    const body = [
      '### Vortex Sync automated review',
      aiSummary ?? '',
      counts.length > 0
        ? `Findings: ${counts.map((entry) => `${entry.count} ${entry.severity.toLowerCase()}`).join(', ')}.`
        : 'No problems found by the automated checks.',
      '_Discuss, approve or request changes in Vortex Sync → Code reviews._',
    ]
      .filter(Boolean)
      .join('\n\n');

    await this.gitea.createPullReview(repositoryName(ref), ref.number, {
      body,
      commitId: headSha,
      comments: findings
        .filter((finding) => finding.path && finding.line)
        .slice(0, 30)
        .map((finding) => ({
          path: finding.path!,
          new_position: finding.line!,
          body: `**${finding.severity}** · ${finding.title}${finding.details ? `\n\n${finding.details}` : ''}`,
        })),
    });
  }

  private toComment(
    reviewId: number,
    kind: CommentKind,
    finding: Finding,
  ): ReviewComment {
    return this.comments.create({
      reviewId,
      authorId: null,
      kind,
      body: finding.details
        ? `${finding.title}\n\n${finding.details}`
        : finding.title,
      filePath: finding.path?.slice(0, 500) ?? null,
      line: finding.line,
      severity: finding.severity,
    });
  }

  private async fail(reviewId: number, message: string): Promise<void> {
    await this.reviews.update(reviewId, {
      analysisStatus: AnalysisStatus.Failed,
      analysisError: message.slice(0, 500),
      analyzedAt: new Date(),
    });
  }
}
