import type { MemberRef } from '@/shared/types/member-ref';
import type { Option, Tone, ToneOption } from '@/shared/types/tone';

export const ReviewStatus = {
  Open: 0,
  ChangesRequested: 1,
  Approved: 2,
  Closed: 3,
  Merged: 4,
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const ReviewDecision = {
  Approved: 1,
  ChangesRequested: 2,
} as const;
export type ReviewDecision = (typeof ReviewDecision)[keyof typeof ReviewDecision];

export const CommentKind = {
  Comment: 0,
  AiFinding: 1,
  Warning: 2,
  System: 3,
} as const;
export type CommentKind = (typeof CommentKind)[keyof typeof CommentKind];

export const AnalysisStatus = {
  Pending: 0,
  Running: 1,
  Completed: 2,
  Failed: 3,
} as const;
export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PullRequestProvider = 'github' | 'bitbucket' | 'gitea';
export type ReviewScope = 'all' | 'mine' | 'to-review';

export const REVIEW_STATUS_OPTIONS: readonly ToneOption<ReviewStatus>[] = [
  { value: ReviewStatus.Open, label: 'Waiting for review', tone: 'info' },
  { value: ReviewStatus.ChangesRequested, label: 'Changes requested', tone: 'warning' },
  { value: ReviewStatus.Approved, label: 'Approved', tone: 'success' },
  { value: ReviewStatus.Closed, label: 'Closed', tone: 'neutral' },
  { value: ReviewStatus.Merged, label: 'Merged', tone: 'accent' },
];

export const CI_STATE_OPTIONS: readonly ToneOption<string>[] = [
  { value: 'success', label: 'Passed', tone: 'success' },
  { value: 'failure', label: 'Failed', tone: 'danger' },
  { value: 'error', label: 'Error', tone: 'danger' },
  { value: 'pending', label: 'Running', tone: 'info' },
  { value: 'warning', label: 'Warning', tone: 'warning' },
  { value: 'skipped', label: 'Skipped', tone: 'neutral' },
  { value: 'none', label: 'No pipeline yet', tone: 'neutral' },
];

export const DECISION_OPTIONS: readonly ToneOption<ReviewDecision | null>[] = [
  { value: null, label: 'Pending', tone: 'neutral' },
  { value: ReviewDecision.Approved, label: 'Approved', tone: 'success' },
  { value: ReviewDecision.ChangesRequested, label: 'Changes requested', tone: 'warning' },
];

export const SCOPE_OPTIONS: readonly Option<ReviewScope>[] = [
  { value: 'to-review', label: 'Needs my review' },
  { value: 'mine', label: 'My pull requests' },
  { value: 'all', label: 'All' },
];

export const SEVERITY_ORDER: readonly Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const SEVERITY_TONES: Record<Severity, Tone> = {
  CRITICAL: 'danger',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

export interface Reviewer {
  id: number;
  memberId: number;
  member: MemberRef | null;
  decision: ReviewDecision | null;
  decidedAt: string | null;
}

export interface ReviewComment {
  id: number;
  reviewId: number;
  authorId: number | null;
  author: MemberRef | null;
  kind: CommentKind;
  body: string;
  filePath: string | null;
  line: number | null;
  severity: Severity | null;
  resolved: boolean;
  createdAt: string;
}

export interface Review {
  id: number;
  taskId: number;
  task: { id: number; name: string; status: number } | null;
  authorId: number;
  author: MemberRef | null;
  provider: PullRequestProvider;
  pullRequestUrl: string;
  repository: string;
  pullRequestNumber: number;
  title: string;
  message: string | null;
  status: ReviewStatus;
  analysisStatus: AnalysisStatus;
  analysisError: string | null;
  aiSummary: string | null;
  aiModel: string | null;
  filesChanged: number | null;
  additions: number | null;
  deletions: number | null;
  analyzedAt: string | null;
  headSha: string | null;
  reviewers: Reviewer[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListItem extends Review {
  openFindings: Record<Severity, number>;
  commentCount: number;
}

export interface CiChecks {
  state: string;
  statuses: { context: string; status: string; description: string; targetUrl: string }[];
}

export interface ReviewDetail extends Review {
  comments: ReviewComment[];
  analysisRunning: boolean;
  checks: CiChecks | null;
}

export interface ReviewInput {
  taskId: number;
  pullRequestUrl: string;
  title?: string;
  message?: string;
  reviewerIds: number[];
}

export interface CommentInput {
  body: string;
  filePath?: string;
  line?: number;
}

const PULL_REQUEST_URLS = [
  /^https:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+([/?#].*)?$/i,
  /^https:\/\/(www\.)?bitbucket\.org\/[\w.-]+\/[\w.-]+\/pull-requests\/\d+([/?#].*)?$/i,
  /^https?:\/\/[^/\s?#]+\/[\w.-]+\/[\w.-]+\/pulls\/\d+([/?#].*)?$/i,
];

export const isPullRequestUrl = (value: string): boolean =>
  PULL_REQUEST_URLS.some((pattern) => pattern.test(value.trim()));

const PROVIDER_LABELS: Record<PullRequestProvider, string> = {
  github: 'GitHub',
  bitbucket: 'Bitbucket',
  gitea: 'Git server',
};

export const providerLabel = (provider: PullRequestProvider): string => PROVIDER_LABELS[provider];

export const isAnalyzing = (review: Pick<ReviewDetail, 'analysisStatus'> & { analysisRunning?: boolean }) =>
  review.analysisRunning === true ||
  review.analysisStatus === AnalysisStatus.Running ||
  review.analysisStatus === AnalysisStatus.Pending;

/** Automated findings are stored as "title\n\ndetails". */
export function splitFinding(body: string): { title: string; details: string } {
  const [title, ...rest] = body.split('\n\n');
  return { title: title ?? '', details: rest.join('\n\n') };
}
