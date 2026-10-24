export enum ReviewStatus {
  Open = 0,
  ChangesRequested = 1,
  Approved = 2,
  Closed = 3,
  Merged = 4,
}

export const FINAL_STATUSES = [ReviewStatus.Closed, ReviewStatus.Merged];

export enum ReviewDecision {
  Approved = 1,
  ChangesRequested = 2,
}

export enum CommentKind {
  Comment = 0,
  AiFinding = 1,
  Warning = 2,
  System = 3,
}

export enum AnalysisStatus {
  Pending = 0,
  Running = 1,
  Completed = 2,
  Failed = 3,
}

export enum PullRequestProvider {
  GitHub = 'github',
  Bitbucket = 'bitbucket',
  Gitea = 'gitea',
}

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const REVIEW_SCOPES = ['all', 'mine', 'to-review'] as const;
export type ReviewScope = (typeof REVIEW_SCOPES)[number];
