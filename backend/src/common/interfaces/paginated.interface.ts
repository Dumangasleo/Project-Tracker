import type { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function toPaginated<T>(
  items: T[],
  total: number,
  query: PaginationQueryDto,
): Paginated<T> {
  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    hasMore: query.page * query.limit < total,
  };
}
