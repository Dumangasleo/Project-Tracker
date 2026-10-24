import { http } from '@/core/http/http-client';
import type { Paginated } from '@/shared/types/pagination';
import type {
  CommentInput,
  ReviewComment,
  ReviewDecision,
  ReviewDetail,
  ReviewInput,
  ReviewListItem,
  ReviewScope,
} from '../model/review.types';

export interface ReviewQuery {
  page: number;
  limit?: number;
  scope: ReviewScope;
}

export const reviewsApi = {
  async list(query: ReviewQuery): Promise<Paginated<ReviewListItem>> {
    const { data } = await http.get<Paginated<ReviewListItem>>('/reviews', {
      params: { page: query.page, limit: query.limit ?? 20, scope: query.scope },
    });
    return data;
  },

  async get(id: number): Promise<ReviewDetail> {
    const { data } = await http.get<ReviewDetail>(`/reviews/${id}`);
    return data;
  },

  async create(input: ReviewInput): Promise<ReviewDetail> {
    const { data } = await http.post<ReviewDetail>('/reviews', input);
    return data;
  },

  async resubmit(id: number, input: { pullRequestUrl?: string; message?: string }): Promise<ReviewDetail> {
    const { data } = await http.post<ReviewDetail>(`/reviews/${id}/resubmit`, input);
    return data;
  },

  async decide(id: number, decision: ReviewDecision, comment?: string): Promise<ReviewDetail> {
    const { data } = await http.post<ReviewDetail>(`/reviews/${id}/decision`, { decision, comment });
    return data;
  },

  async merge(id: number): Promise<ReviewDetail> {
    const { data } = await http.post<ReviewDetail>(`/reviews/${id}/merge`);
    return data;
  },

  async setReviewers(id: number, reviewerIds: number[]): Promise<ReviewDetail> {
    const { data } = await http.put<ReviewDetail>(`/reviews/${id}/reviewers`, { reviewerIds });
    return data;
  },

  async close(id: number): Promise<ReviewDetail> {
    const { data } = await http.post<ReviewDetail>(`/reviews/${id}/close`);
    return data;
  },

  async analyze(id: number): Promise<ReviewDetail> {
    const { data } = await http.post<ReviewDetail>(`/reviews/${id}/analyze`);
    return data;
  },

  async addComment(id: number, input: CommentInput): Promise<ReviewComment> {
    const { data } = await http.post<ReviewComment>(`/reviews/${id}/comments`, input);
    return data;
  },

  async setResolved(id: number, commentId: number, resolved: boolean): Promise<ReviewComment> {
    const { data } = await http.patch<ReviewComment>(`/reviews/${id}/comments/${commentId}`, { resolved });
    return data;
  },

  async removeComment(id: number, commentId: number): Promise<void> {
    await http.delete(`/reviews/${id}/comments/${commentId}`);
  },
};
