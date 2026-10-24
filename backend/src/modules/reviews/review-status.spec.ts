import { TaskStatus } from '../tasks/task.enums';
import { ReviewDecision, ReviewStatus } from './review.enums';
import {
  reviewStatusFromDecisions,
  taskStatusFromReviews,
} from './review-status';

describe('reviewStatusFromDecisions', () => {
  it('stays open until a reviewer decides', () => {
    expect(reviewStatusFromDecisions([null, null])).toBe(ReviewStatus.Open);
  });

  it('is approved once a reviewer approves and nobody objects', () => {
    expect(reviewStatusFromDecisions([ReviewDecision.Approved, null])).toBe(
      ReviewStatus.Approved,
    );
  });

  it('lets one change request block the approvals', () => {
    expect(
      reviewStatusFromDecisions([
        ReviewDecision.Approved,
        ReviewDecision.ChangesRequested,
      ]),
    ).toBe(ReviewStatus.ChangesRequested);
  });
});

describe('taskStatusFromReviews', () => {
  it.each([
    [[ReviewStatus.Open], TaskStatus.InReview],
    [[ReviewStatus.Approved], TaskStatus.Done],
    [[ReviewStatus.Approved, ReviewStatus.Open], TaskStatus.InReview],
    [[ReviewStatus.Open, ReviewStatus.ChangesRequested], TaskStatus.InProgress],
    [[ReviewStatus.Closed], TaskStatus.InProgress],
    [[ReviewStatus.Merged], TaskStatus.Done],
    [[ReviewStatus.Closed, ReviewStatus.Merged], TaskStatus.Done],
  ])('%j -> %s', (statuses, expected) => {
    expect(taskStatusFromReviews(statuses)).toBe(expected);
  });
});
