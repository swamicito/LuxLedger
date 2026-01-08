import { useState, useCallback, useRef } from 'react';

/**
 * Cursor-based pagination hook for scalable data fetching.
 * Unlike offset pagination, cursor pagination maintains consistent performance
 * regardless of how deep into the dataset you paginate.
 */

export interface CursorPaginationOptions {
  pageSize?: number;
  initialCursor?: string | null;
}

export interface CursorPaginationState<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
}

export interface CursorPaginationActions<T> {
  loadInitial: (fetcher: CursorFetcher<T>) => Promise<void>;
  loadMore: (fetcher: CursorFetcher<T>) => Promise<void>;
  reset: () => void;
  setItems: (items: T[]) => void;
}

export interface CursorFetchResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type CursorFetcher<T> = (
  cursor: string | null,
  limit: number
) => Promise<CursorFetchResult<T>>;

export function useCursorPagination<T>(
  options: CursorPaginationOptions = {}
): [CursorPaginationState<T>, CursorPaginationActions<T>] {
  const { pageSize = 20, initialCursor = null } = options;

  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isLoadingRef = useRef(false);

  const loadInitial = useCallback(
    async (fetcher: CursorFetcher<T>) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcher(null, pageSize);
        setItems(result.data);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [pageSize]
  );

  const loadMore = useCallback(
    async (fetcher: CursorFetcher<T>) => {
      if (isLoadingRef.current || !hasMore || !cursor) return;
      isLoadingRef.current = true;
      setIsLoadingMore(true);
      setError(null);

      try {
        const result = await fetcher(cursor, pageSize);
        setItems((prev) => [...prev, ...result.data]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch more data'));
      } finally {
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [cursor, hasMore, pageSize]
  );

  const reset = useCallback(() => {
    setItems([]);
    setCursor(initialCursor);
    setHasMore(true);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(null);
    isLoadingRef.current = false;
  }, [initialCursor]);

  const state: CursorPaginationState<T> = {
    items,
    cursor,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
  };

  const actions: CursorPaginationActions<T> = {
    loadInitial,
    loadMore,
    reset,
    setItems,
  };

  return [state, actions];
}

/**
 * Helper to build cursor-based queries for Supabase.
 * Uses created_at + id for stable cursor pagination.
 */
export function buildCursorQuery(
  cursor: string | null
): { created_at?: string; id?: string } | null {
  if (!cursor) return null;

  try {
    const decoded = JSON.parse(atob(cursor));
    return {
      created_at: decoded.created_at,
      id: decoded.id,
    };
  } catch {
    return null;
  }
}

/**
 * Helper to create a cursor from the last item in a result set.
 */
export function createCursor(item: { created_at: string; id: string }): string {
  return btoa(JSON.stringify({ created_at: item.created_at, id: item.id }));
}

/**
 * Helper to apply cursor conditions to a Supabase query.
 * Uses (created_at, id) composite for stable ordering.
 */
export function applyCursorToQuery<T extends { created_at: string; id: string }>(
  data: T[],
  cursor: string | null,
  limit: number
): { data: T[]; nextCursor: string | null; hasMore: boolean } {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? createCursor(lastItem) : null;

  return { data: items, nextCursor, hasMore };
}

/**
 * Infinite scroll hook that uses cursor pagination under the hood.
 */
export function useInfiniteScrollWithCursor<T>(
  options: CursorPaginationOptions & {
    threshold?: number;
    rootMargin?: string;
  } = {}
) {
  const { threshold = 0.1, rootMargin = '100px', ...paginationOptions } = options;
  const [state, actions] = useCursorPagination<T>(paginationOptions);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetcherRef = useRef<CursorFetcher<T> | null>(null);

  const setLoadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node && state.hasMore && !state.isLoadingMore) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && fetcherRef.current) {
              actions.loadMore(fetcherRef.current);
            }
          },
          { threshold, rootMargin }
        );
        observerRef.current.observe(node);
      }

      loadMoreRef.current = node;
    },
    [state.hasMore, state.isLoadingMore, actions, threshold, rootMargin]
  );

  const initialize = useCallback(
    (fetcher: CursorFetcher<T>) => {
      fetcherRef.current = fetcher;
      actions.loadInitial(fetcher);
    },
    [actions]
  );

  return {
    ...state,
    ...actions,
    setLoadMoreRef,
    initialize,
  };
}
