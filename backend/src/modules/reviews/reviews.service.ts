import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type SelectQueryBuilder } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import {
  type Paginated,
  toPaginated,
} from '../../common/interfaces/paginated.interface';
import { emailLookupHash } from '../../common/security/field-encryption';
import {
  ReviewCommentedEvent,
  ReviewDecidedEvent,
  ReviewRequestedEvent,
} from '../../messaging/events/review.events';
import { NotificationEvent } from '../../messaging/notification-events';
import { NotificationPublisher } from '../../messaging/notification.publisher';
import {
  GiteaClient,
  GiteaError,
  type GiteaPullRequest,
} from '../git/gitea.client';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import {
  defaultReviewTitle,
  parsePullRequestUrl,
  repositoryName,
  type PullRequestRef,
} from './analysis/pull-request-url';
import { ReviewAnalysisService } from './analysis/review-analysis.service';
import { findTaskId } from './analysis/task-reference';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ResubmitReviewDto } from './dto/resubmit-review.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { CodeReview } from './entities/code-review.entity';
import { ReviewComment } from './entities/review-comment.entity';
import { ReviewReviewer } from './entities/review-reviewer.entity';
import {
  CommentKind,
  FINAL_STATUSES,
  PullRequestProvider,
  ReviewDecision,
  ReviewStatus,
  type Severity,
} from './review.enums';
import {
  reviewStatusFromDecisions,
  taskStatusFromReviews,
} from './review-status';

const ACTIVE_STATUSES = [ReviewStatus.Open, ReviewStatus.ChangesRequested];
const MEMBER_FIELDS = ['id', 'firstName', 'lastName'] as const;

export type FindingCounts = Record<Severity, number>;

export interface CiChecks {
  state: string;
  statuses: {
    context: string;
    status: string;
    description: string;
    targetUrl: string;
  }[];
}

export type ReviewListItem = CodeReview & {
  openFindings: FindingCounts;
  commentCount: number;
};

export type ReviewDetail = CodeReview & {
  comments: ReviewComment[];
  analysisRunning: boolean;
  checks: CiChecks | null;
};

export interface GiteaPullRequestEvent {
  action: string;
  number: number;
  pull_request?: GiteaPullRequest;
  repository?: { full_name: string };
}

interface NewReview {
  taskId: number;
  authorId: number;
  ref: PullRequestRef;
  title: string;
  message: string | null;
  reviewerIds: number[];
  headSha?: string;
  origin: string;
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(CodeReview)
    private readonly reviews: Repository<CodeReview>,
    @InjectRepository(ReviewReviewer)
    private readonly reviewers: Repository<ReviewReviewer>,
    @InjectRepository(ReviewComment)
    private readonly comments: Repository<ReviewComment>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    @InjectRepository(TeamMember)
    private readonly members: Repository<TeamMember>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly analysis: ReviewAnalysisService,
    private readonly publisher: NotificationPublisher,
    private readonly gitea: GiteaClient,
  ) {}

  async findAll(
    query: ReviewQueryDto,
    memberId: number,
  ): Promise<Paginated<ReviewListItem>> {
    const builder = this.withRelations()
      .orderBy('review.updatedAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (query.scope === 'mine') {
      builder.andWhere('review.authorId = :memberId', { memberId });
    } else if (query.scope === 'to-review') {
      builder.andWhere(
        (qb) =>
          `review.id IN ${qb
            .subQuery()
            .select('assigned.reviewId')
            .from(ReviewReviewer, 'assigned')
            .where('assigned.memberId = :memberId')
            .getQuery()}`,
        { memberId },
      );
    }
    if (query.status !== undefined) {
      builder.andWhere('review.status = :status', { status: query.status });
    }

    const [items, total] = await builder.getManyAndCount();
    return toPaginated(await this.withCounts(items), total, query);
  }

  async findOne(id: number): Promise<ReviewDetail> {
    const review = await this.withRelations()
      .where('review.id = :id', { id })
      .getOne();
    if (!review) throw notFound(id);

    const comments = await this.comments
      .createQueryBuilder('comment')
      .leftJoin('comment.author', 'author')
      .addSelect(MEMBER_FIELDS.map((field) => `author.${field}`))
      .where('comment.reviewId = :id', { id })
      .orderBy('comment.createdAt', 'ASC')
      .addOrderBy('comment.id', 'ASC')
      .getMany();

    return {
      ...review,
      comments,
      analysisRunning: this.analysis.isRunning(id),
      checks: await this.ciChecks(review),
    };
  }

  async create(dto: CreateReviewDto, memberId: number): Promise<ReviewDetail> {
    const ref = this.parseOrThrow(dto.pullRequestUrl);
    const task = await this.tasks.findOne({
      where: { id: dto.taskId },
      select: { id: true, assigneeId: true },
    });
    if (!task) {
      throw new NotFoundException({
        message: `Task ${dto.taskId} was not found.`,
        code: ErrorCode.NotFound,
      });
    }
    if (task.assigneeId !== memberId) {
      throw new ForbiddenException({
        message:
          'Only the member assigned to this task can submit it for review.',
      });
    }
    await this.assertValidReviewers(dto.reviewerIds, memberId);
    await this.assertNotUnderReview(ref);

    const id = await this.openReview({
      taskId: task.id,
      authorId: memberId,
      ref,
      title: dto.title?.trim() || defaultReviewTitle(ref),
      message: dto.message?.trim() || null,
      reviewerIds: dto.reviewerIds,
      origin: 'submitted this pull request for review',
    });
    return this.findOne(id);
  }

  async resubmit(
    id: number,
    dto: ResubmitReviewDto,
    memberId: number,
  ): Promise<ReviewDetail> {
    const review = await this.getReview(id);
    this.assertAuthor(review, memberId);
    this.assertOpen(review);

    const changes: Partial<CodeReview> = { status: ReviewStatus.Open };
    if (dto.pullRequestUrl) {
      Object.assign(
        changes,
        pullRequestColumns(this.parseOrThrow(dto.pullRequestUrl)),
      );
    }
    await this.reviews.update(id, changes);
    await this.reviewers.update(
      { reviewId: id },
      { decision: null, decidedAt: null },
    );

    const author = await this.memberName(memberId);
    if (dto.message?.trim()) {
      await this.addComment(id, { body: dto.message.trim() }, memberId, false);
    }
    await this.addSystemComment(
      id,
      `${author} updated the pull request and asked for another review.`,
    );
    await this.syncTaskStatus(review.taskId);
    await this.notifyReviewers(id, review.title, author);
    this.analysis.start(id);
    return this.findOne(id);
  }

  async setReviewers(
    id: number,
    reviewerIds: number[],
    memberId: number,
  ): Promise<ReviewDetail> {
    const review = await this.getReview(id);
    this.assertAuthor(review, memberId);
    this.assertOpen(review);
    await this.assertValidReviewers(reviewerIds, memberId);

    const current = await this.reviewers.findBy({ reviewId: id });
    const removed = current.filter(
      (row) => !reviewerIds.includes(row.memberId),
    );
    const added = reviewerIds.filter(
      (reviewerId) => !current.some((row) => row.memberId === reviewerId),
    );
    if (removed.length > 0) {
      await this.reviewers.delete({ id: In(removed.map((row) => row.id)) });
    }
    if (added.length > 0) {
      await this.reviewers.save(
        added.map((reviewerId) =>
          this.reviewers.create({ reviewId: id, memberId: reviewerId }),
        ),
      );
    }

    await this.refreshStatus(review);
    const author = await this.memberName(memberId);
    await this.addSystemComment(id, `${author} updated the reviewers.`);
    if (added.length > 0) {
      this.publisher.publish(
        NotificationEvent.ReviewRequested,
        new ReviewRequestedEvent(id, review.title, author, added),
      );
    }
    return this.findOne(id);
  }

  async decide(
    id: number,
    dto: ReviewDecisionDto,
    memberId: number,
  ): Promise<ReviewDetail> {
    const review = await this.getReview(id);
    this.assertOpen(review);

    const reviewer = await this.reviewers.findOneBy({ reviewId: id, memberId });
    if (!reviewer) {
      throw new ForbiddenException({
        message: 'Only the requested reviewers can approve or request changes.',
      });
    }

    await this.reviewers.update(reviewer.id, {
      decision: dto.decision,
      decidedAt: new Date(),
    });

    const name = await this.memberName(memberId);
    const approved = dto.decision === ReviewDecision.Approved;
    if (dto.comment?.trim()) {
      await this.addComment(id, { body: dto.comment.trim() }, memberId, false);
    }
    await this.addSystemComment(
      id,
      approved
        ? `${name} approved this pull request.`
        : `${name} requested changes.`,
    );
    await this.refreshStatus(review);

    this.publisher.publish(
      NotificationEvent.ReviewDecided,
      new ReviewDecidedEvent(id, review.title, name, review.authorId, approved),
    );
    return this.findOne(id);
  }

  /** Merges an approved pull request on the self-hosted Git server. */
  async merge(id: number, memberId: number): Promise<ReviewDetail> {
    const review = await this.getReview(id);
    await this.assertParticipant(review, memberId);
    if (review.provider !== PullRequestProvider.Gitea) {
      throw new BadRequestException({
        message: 'Merge this pull request on GitHub or Bitbucket.',
      });
    }
    if (review.status !== ReviewStatus.Approved) {
      throw new BadRequestException({
        message: 'Only approved pull requests can be merged.',
      });
    }

    try {
      await this.gitea.mergePull(review.repository, review.pullRequestNumber);
    } catch (error) {
      if (!(error instanceof GiteaError)) throw error;
      throw new HttpException(
        {
          message: `The Git server could not merge it: ${error.message}`,
          code: ErrorCode.Conflict,
        },
        error.status === 405 || error.status === 409 ? 409 : 502,
      );
    }

    await this.markFinal(
      review,
      ReviewStatus.Merged,
      `${await this.memberName(memberId)} merged this pull request.`,
    );
    return this.findOne(id);
  }

  async close(id: number, memberId: number): Promise<ReviewDetail> {
    const review = await this.getReview(id);
    this.assertAuthor(review, memberId);
    this.assertOpen(review);
    if (review.status === ReviewStatus.Approved) {
      throw new BadRequestException({
        message: 'An approved review is final and cannot be closed.',
      });
    }

    await this.markFinal(
      review,
      ReviewStatus.Closed,
      `${await this.memberName(memberId)} closed this review.`,
    );
    return this.findOne(id);
  }

  async reanalyze(id: number, memberId: number): Promise<ReviewDetail> {
    const review = await this.getReview(id);
    await this.assertParticipant(review, memberId);
    this.analysis.start(id);
    return this.findOne(id);
  }

  async addComment(
    id: number,
    dto: CreateCommentDto,
    memberId: number,
    notify = true,
  ): Promise<ReviewComment> {
    const review = await this.getReview(id);
    if (dto.line !== undefined && !dto.filePath?.trim()) {
      throw new BadRequestException({
        message: 'Add the file path when you comment on a line.',
      });
    }

    const saved = await this.comments.save(
      this.comments.create({
        reviewId: id,
        authorId: memberId,
        kind: CommentKind.Comment,
        body: dto.body.trim(),
        filePath: dto.filePath?.trim() || null,
        line: dto.line ?? null,
      }),
    );
    await this.reviews.update(id, { updatedAt: new Date() });

    if (notify) {
      const reviewerIds = (await this.reviewers.findBy({ reviewId: id })).map(
        (reviewer) => reviewer.memberId,
      );
      const recipients = [...new Set([review.authorId, ...reviewerIds])].filter(
        (recipient) => recipient !== memberId,
      );
      this.publisher.publish(
        NotificationEvent.ReviewCommented,
        new ReviewCommentedEvent(
          id,
          review.title,
          await this.memberName(memberId),
          recipients,
        ),
      );
    }

    return this.getComment(id, saved.id);
  }

  async setCommentResolved(
    id: number,
    commentId: number,
    resolved: boolean,
    memberId: number,
  ): Promise<ReviewComment> {
    const review = await this.getReview(id);
    const comment = await this.getComment(id, commentId);
    if (comment.authorId !== memberId)
      await this.assertParticipant(review, memberId);

    await this.comments.update(commentId, { resolved });
    return this.getComment(id, commentId);
  }

  async removeComment(
    id: number,
    commentId: number,
    memberId: number,
  ): Promise<void> {
    const comment = await this.getComment(id, commentId);
    if (comment.kind !== CommentKind.Comment || comment.authorId !== memberId) {
      throw new ForbiddenException({
        message: 'You can only delete your own comments.',
      });
    }
    await this.comments.delete(commentId);
  }

  /** Keeps reviews in step with pull requests opened, updated, merged or closed on the Git server. */
  async handleGiteaPullRequest(event: GiteaPullRequestEvent): Promise<string> {
    const pull = event.pull_request;
    const repository = event.repository?.full_name;
    if (!pull || !repository) return 'ignored: not a pull request event';

    const existing = await this.reviews.findOne({
      where: {
        provider: PullRequestProvider.Gitea,
        repository,
        pullRequestNumber: pull.number,
      },
      order: { id: 'DESC' },
    });

    if (!existing) {
      if (!['opened', 'reopened', 'synchronized'].includes(event.action)) {
        return 'ignored: no review for this pull request';
      }
      return this.openFromGitea(pull);
    }

    const final = FINAL_STATUSES.includes(existing.status);
    switch (event.action) {
      case 'synchronized':
        if (final) return 'ignored: review is finished';
        await this.reviews.update(existing.id, { headSha: pull.head.sha });
        await this.addSystemComment(
          existing.id,
          `New commits were pushed to ${pull.head.ref}.`,
        );
        this.analysis.start(existing.id);
        return 'updated: new commits';
      case 'edited':
        await this.reviews.update(existing.id, {
          title: pull.title.slice(0, 200),
        });
        return 'updated: title';
      case 'closed':
        if (final) return 'ignored: review is finished';
        await this.markFinal(
          existing,
          pull.merged ? ReviewStatus.Merged : ReviewStatus.Closed,
          pull.merged
            ? `The pull request was merged on the Git server.`
            : `The pull request was closed on the Git server.`,
        );
        return pull.merged ? 'updated: merged' : 'updated: closed';
      case 'reopened':
        if (existing.status !== ReviewStatus.Closed) return 'ignored';
        await this.reviews.update(existing.id, { status: ReviewStatus.Open });
        await this.addSystemComment(
          existing.id,
          'The pull request was reopened.',
        );
        await this.syncTaskStatus(existing.taskId);
        return 'updated: reopened';
      default:
        return `ignored: action ${event.action}`;
    }
  }

  private async openFromGitea(pull: GiteaPullRequest): Promise<string> {
    const ref = parsePullRequestUrl(pull.html_url, { gitea: true });
    if (!ref) return 'ignored: unrecognised pull request link';

    const taskId = findTaskId(pull.title, pull.head.ref, pull.body);
    if (!taskId)
      return 'ignored: no T-<task id> in title, branch or description';

    const task = await this.tasks.findOne({
      where: { id: taskId },
      select: { id: true, assigneeId: true, projectId: true },
    });
    if (!task) return `ignored: task ${taskId} not found`;

    const author = await this.memberForGitUser(pull.user.login);
    if (!author)
      return `ignored: no member uses Git account ${pull.user.login}`;
    if (task.assigneeId !== author.id) {
      return `ignored: ${pull.user.login} is not assigned to task ${taskId}`;
    }

    const requested = await Promise.all(
      (pull.requested_reviewers ?? []).map((user) =>
        this.memberForGitUser(user.login),
      ),
    );
    let reviewerIds = [
      ...new Set(
        requested
          .filter((member): member is TeamMember => member !== null)
          .map((member) => member.id)
          .filter((memberId) => memberId !== author.id),
      ),
    ];
    if (reviewerIds.length === 0 && task.projectId) {
      const project = await this.projects.findOne({
        where: { id: task.projectId },
        select: { id: true, leadId: true },
      });
      if (project?.leadId && project.leadId !== author.id) {
        reviewerIds = [project.leadId];
      }
    }

    const id = await this.openReview({
      taskId: task.id,
      authorId: author.id,
      ref,
      title: pull.title.slice(0, 200) || defaultReviewTitle(ref),
      message: pull.body?.trim().slice(0, 4000) || null,
      reviewerIds,
      headSha: pull.head.sha,
      origin: `opened ${repositoryName(ref)}#${ref.number} on the Git server`,
    });
    if (reviewerIds.length === 0) {
      await this.addSystemComment(
        id,
        'No reviewer was requested yet. The author can add reviewers here.',
      );
    }
    return `created review ${id} for task ${task.id}`;
  }

  private async openReview(input: NewReview): Promise<number> {
    const review = await this.reviews.save(
      this.reviews.create({
        taskId: input.taskId,
        authorId: input.authorId,
        ...pullRequestColumns(input.ref),
        title: input.title,
        message: input.message,
        headSha: input.headSha ?? null,
        status: ReviewStatus.Open,
      }),
    );
    if (input.reviewerIds.length > 0) {
      await this.reviewers.save(
        input.reviewerIds.map((reviewerId) =>
          this.reviewers.create({ reviewId: review.id, memberId: reviewerId }),
        ),
      );
    }

    const author = await this.memberName(input.authorId);
    await this.addSystemComment(review.id, `${author} ${input.origin}.`);
    await this.syncTaskStatus(input.taskId);
    if (input.reviewerIds.length > 0) {
      this.publisher.publish(
        NotificationEvent.ReviewRequested,
        new ReviewRequestedEvent(
          review.id,
          review.title,
          author,
          input.reviewerIds,
        ),
      );
    }
    this.analysis.start(review.id);
    return review.id;
  }

  private async markFinal(
    review: CodeReview,
    status: ReviewStatus.Merged | ReviewStatus.Closed,
    note: string,
  ): Promise<void> {
    await this.reviews.update(review.id, { status });
    await this.addSystemComment(review.id, note);
    await this.syncTaskStatus(review.taskId);
  }

  private async refreshStatus(review: CodeReview): Promise<void> {
    const decisions = (
      await this.reviewers.findBy({ reviewId: review.id })
    ).map((row) => row.decision);
    await this.reviews.update(review.id, {
      status: reviewStatusFromDecisions(decisions),
    });
    await this.syncTaskStatus(review.taskId);
  }

  private async notifyReviewers(
    reviewId: number,
    title: string,
    authorName: string,
  ): Promise<void> {
    const reviewerIds = (await this.reviewers.findBy({ reviewId })).map(
      (reviewer) => reviewer.memberId,
    );
    if (reviewerIds.length === 0) return;
    this.publisher.publish(
      NotificationEvent.ReviewRequested,
      new ReviewRequestedEvent(reviewId, title, authorName, reviewerIds),
    );
  }

  private async ciChecks(review: CodeReview): Promise<CiChecks | null> {
    if (
      review.provider !== PullRequestProvider.Gitea ||
      !review.headSha ||
      !this.gitea.enabled
    ) {
      return null;
    }
    try {
      const status = await this.gitea.combinedStatus(
        review.repository,
        review.headSha,
      );
      return {
        state: status.statuses.length > 0 ? status.state : 'none',
        statuses: status.statuses.map((entry) => ({
          context: entry.context,
          status: entry.status,
          description: entry.description,
          targetUrl: new URL(
            entry.target_url,
            review.pullRequestUrl,
          ).toString(),
        })),
      };
    } catch (error) {
      this.logger.warn(
        `CI status for review ${review.id} unavailable: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async memberForGitUser(login: string): Promise<TeamMember | null> {
    const linked = await this.members.findOneBy({ gitUsername: login });
    if (linked) return linked;

    const user = await this.gitea.findUser(login).catch(() => null);
    return user?.email
      ? this.members.findOneBy({ emailHash: emailLookupHash(user.email) })
      : null;
  }

  private parseOrThrow(url: string): PullRequestRef {
    const ref = parsePullRequestUrl(url, { gitea: this.gitea.enabled });
    if (!ref) {
      throw new BadRequestException({
        message: this.gitea.enabled
          ? 'Use a pull request link from your Git server (…/owner/repo/pulls/12), GitHub (…/pull/12) or Bitbucket (…/pull-requests/12).'
          : 'Use a GitHub or Bitbucket pull request link, e.g. https://github.com/owner/repo/pull/12 or https://bitbucket.org/workspace/repo/pull-requests/12.',
      });
    }
    return ref;
  }

  private async assertNotUnderReview(ref: PullRequestRef): Promise<void> {
    const alreadyActive = await this.reviews.existsBy({
      provider: ref.provider,
      repository: repositoryName(ref),
      pullRequestNumber: ref.number,
      status: In(ACTIVE_STATUSES),
    });
    if (alreadyActive) {
      throw new ConflictException({
        message: 'This pull request is already waiting for review.',
        code: ErrorCode.Conflict,
      });
    }
  }

  private withRelations(): SelectQueryBuilder<CodeReview> {
    return this.reviews
      .createQueryBuilder('review')
      .leftJoin('review.task', 'task')
      .addSelect(['task.id', 'task.name', 'task.status'])
      .leftJoin('review.author', 'author')
      .addSelect(MEMBER_FIELDS.map((field) => `author.${field}`))
      .leftJoinAndSelect('review.reviewers', 'reviewer')
      .leftJoin('reviewer.member', 'reviewerMember')
      .addSelect(MEMBER_FIELDS.map((field) => `reviewerMember.${field}`));
  }

  private async withCounts(items: CodeReview[]): Promise<ReviewListItem[]> {
    if (items.length === 0) return [];
    const ids = items.map((item) => item.id);

    const rows = await this.comments
      .createQueryBuilder('comment')
      .select('comment.reviewId', 'reviewId')
      .addSelect('comment.kind', 'kind')
      .addSelect('comment.severity', 'severity')
      .addSelect('COUNT(*)', 'total')
      .where('comment.reviewId IN (:...ids)', { ids })
      .andWhere('comment.kind IN (:...kinds)', {
        kinds: [
          CommentKind.Comment,
          CommentKind.AiFinding,
          CommentKind.Warning,
        ],
      })
      .andWhere('comment.resolved = :resolved', { resolved: false })
      .groupBy('comment.reviewId')
      .addGroupBy('comment.kind')
      .addGroupBy('comment.severity')
      .getRawMany<{
        reviewId: number;
        kind: CommentKind;
        severity: Severity | null;
        total: number;
      }>();

    return items.map((item) => {
      const openFindings: FindingCounts = {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      };
      let commentCount = 0;
      for (const row of rows) {
        if (Number(row.reviewId) !== item.id) continue;
        if (row.kind === CommentKind.Comment) commentCount += Number(row.total);
        else if (row.severity) openFindings[row.severity] += Number(row.total);
      }
      return Object.assign(item, { openFindings, commentCount });
    });
  }

  private async getReview(id: number): Promise<CodeReview> {
    const review = await this.reviews.findOneBy({ id });
    if (!review) throw notFound(id);
    return review;
  }

  private async getComment(
    reviewId: number,
    commentId: number,
  ): Promise<ReviewComment> {
    const comment = await this.comments
      .createQueryBuilder('comment')
      .leftJoin('comment.author', 'author')
      .addSelect(MEMBER_FIELDS.map((field) => `author.${field}`))
      .where('comment.id = :commentId AND comment.reviewId = :reviewId', {
        commentId,
        reviewId,
      })
      .getOne();
    if (!comment) {
      throw new NotFoundException({
        message: `Comment ${commentId} was not found.`,
        code: ErrorCode.NotFound,
      });
    }
    return comment;
  }

  private async assertValidReviewers(
    reviewerIds: number[],
    authorId: number,
  ): Promise<void> {
    if (reviewerIds.includes(authorId)) {
      throw new BadRequestException({
        message: 'Pick someone else to review your pull request.',
      });
    }
    const found = await this.members.countBy({ id: In(reviewerIds) });
    if (found !== reviewerIds.length) {
      throw new BadRequestException({
        message: 'One or more reviewers do not exist.',
      });
    }
  }

  private assertAuthor(review: CodeReview, memberId: number): void {
    if (review.authorId !== memberId) {
      throw new ForbiddenException({
        message: 'Only the author of this pull request can do that.',
      });
    }
  }

  private assertOpen(review: CodeReview): void {
    if (review.status === ReviewStatus.Merged) {
      throw new BadRequestException({
        message: 'This pull request is already merged.',
      });
    }
    if (review.status === ReviewStatus.Closed) {
      throw new BadRequestException({ message: 'This review is closed.' });
    }
  }

  private async assertParticipant(
    review: CodeReview,
    memberId: number,
  ): Promise<void> {
    if (review.authorId === memberId) return;
    const isReviewer = await this.reviewers.existsBy({
      reviewId: review.id,
      memberId,
    });
    if (!isReviewer) {
      throw new ForbiddenException({
        message:
          'Only the author or a reviewer of this pull request can do that.',
      });
    }
  }

  private async addSystemComment(
    reviewId: number,
    body: string,
  ): Promise<void> {
    await this.comments.save(
      this.comments.create({
        reviewId,
        authorId: null,
        kind: CommentKind.System,
        body,
      }),
    );
  }

  private async syncTaskStatus(taskId: number): Promise<void> {
    const reviews = await this.reviews.find({
      where: { taskId },
      select: { id: true, status: true },
    });
    await this.tasks.update(taskId, {
      status: taskStatusFromReviews(reviews.map((review) => review.status)),
    });
  }

  private async memberName(memberId: number): Promise<string> {
    const member = await this.members.findOne({
      where: { id: memberId },
      select: { id: true, firstName: true, lastName: true },
    });
    return member ? `${member.firstName} ${member.lastName}`.trim() : 'Someone';
  }
}

function pullRequestColumns(ref: PullRequestRef): Partial<CodeReview> {
  return {
    provider: ref.provider,
    pullRequestUrl: ref.url,
    repository: repositoryName(ref),
    pullRequestNumber: ref.number,
  };
}

function notFound(id: number): NotFoundException {
  return new NotFoundException({
    message: `Review ${id} was not found.`,
    code: ErrorCode.NotFound,
  });
}
