import { TaskStatus } from '../tasks/task.enums';
import { ReviewDecision, ReviewStatus } from './review.enums';

/** One "changes requested" blocks the review; otherwise one approval is enough. */
export function reviewStatusFromDecisions(
  decisions: (ReviewDecision | null)[],
): ReviewStatus {
  if (decisions.includes(ReviewDecision.ChangesRequested)) {
    return ReviewStatus.ChangesRequested;
  }
  if (decisions.includes(ReviewDecision.Approved)) return ReviewStatus.Approved;
  return ReviewStatus.Open;
}

/** A task can have several pull requests; the one that still needs work decides its status. */
export function taskStatusFromReviews(statuses: ReviewStatus[]): TaskStatus {
  if (statuses.includes(ReviewStatus.ChangesRequested))
    return TaskStatus.InProgress;
  if (statuses.includes(ReviewStatus.Open)) return TaskStatus.InReview;
  if (
    statuses.includes(ReviewStatus.Approved) ||
    statuses.includes(ReviewStatus.Merged)
  ) {
    return TaskStatus.Done;
  }
  return TaskStatus.InProgress;
}
