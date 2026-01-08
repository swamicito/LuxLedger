import { useState, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────────────────────
// PAGINATION CONSTANTS & UTILITIES
// ─────────────────────────────────────────────────────────────

export const DEFAULT_LIMIT = 24;
export const MAX_LIMIT = 60;
export const MIN_LIMIT = 1;

/**
 * Safely clamp a limit value within allowed bounds.
 */
export function safeLimit(limit: number | undefined | null): number {
  if (limit === undefined || limit === null || isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(limit)));
}

/**
 * Parse pagination parameters from URL search params or request.
 */
export function parsePaginationParams(params: {
  limit?: string | number | null;
  page?: string | number | null;
  offset?: string | number | null;
}): {
  limit: number;
  page: number;
  offset: number;
} {
  const limit = safeLimit(
    typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit ?? undefined
  );

  const page = Math.max(
    1,
    typeof params.page === 'string' ? parseInt(params.page, 10) : params.page ?? 1
  );

  const offset = Math.max(
    0,
    typeof params.offset === 'string' ? parseInt(params.offset, 10) : params.offset ?? 0
  );

  return { limit, page, offset };
}

/**
 * Get range for Supabase .range() query.
 * Returns [start, end] inclusive.
 */
export function getSupabaseRange(page: number, limit: number): [number, number] {
  const start = Math.max(0, (page - 1) * limit);
  const end = start + limit - 1;
  return [start, end];
}

// ─────────────────────────────────────────────────────────────
// PAGINATION HOOKS
// ─────────────────────────────────────────────────────────────

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  paginateData: (data: T[]) => T[];
  reset: () => void;
}

export function usePagination<T = any>({
  initialPage = 1,
  pageSize: initialPageSize = 20,
  totalItems = 0,
}: UsePaginationOptions = {}): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const paginateData = useCallback(
    (data: T[]): T[] => {
      return data.slice(startIndex, startIndex + pageSize);
    },
    [startIndex, pageSize]
  );

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    paginateData,
    reset,
  };
}

interface UseInfiniteScrollOptions {
  pageSize?: number;
  threshold?: number;
}

interface UseInfiniteScrollReturn {
  page: number;
  limit: number;
  offset: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  setHasMore: (value: boolean) => void;
  setIsLoadingMore: (value: boolean) => void;
}

export function useInfiniteScroll({
  pageSize = 20,
  threshold = 200,
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollReturn {
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setIsLoadingMore(false);
  }, []);

  return {
    page,
    limit,
    offset,
    isLoadingMore,
    hasMore,
    loadMore,
    reset,
    setHasMore,
    setIsLoadingMore,
  };
}

export function getQueryParams(page: number, pageSize: number) {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}
