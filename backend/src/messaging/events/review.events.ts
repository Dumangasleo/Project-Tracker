export class ReviewRequestedEvent {
  constructor(
    readonly reviewId: number,
    readonly title: string,
    readonly authorName: string,
    readonly reviewerIds: number[],
  ) {}
}

export class ReviewCommentedEvent {
  constructor(
    readonly reviewId: number,
    readonly title: string,
    readonly commenterName: string,
    readonly recipientIds: number[],
  ) {}
}

export class ReviewDecidedEvent {
  constructor(
    readonly reviewId: number,
    readonly title: string,
    readonly reviewerName: string,
    readonly authorId: number,
    readonly approved: boolean,
  ) {}
}
