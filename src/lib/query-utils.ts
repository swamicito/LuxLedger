/**
 * Query utilities for scalable data fetching with Supabase.
 * Implements cursor pagination and optimized query patterns.
 */

import { supabase } from './supabase-client';
import { createCursor, buildCursorQuery } from '@/hooks/use-cursor-pagination';

// Default page size for queries
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Fetch assets with cursor-based pagination.
 * Uses (created_at, id) composite cursor for stable ordering.
 */
export async function fetchAssetsCursor(options: {
  cursor: string | null;
  limit: number;
  status?: string[];
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  ownerId?: string;
  searchQuery?: string;
}) {
  const {
    cursor,
    limit = DEFAULT_PAGE_SIZE,
    status = ['verified', 'tokenized', 'listed'],
    category,
    minPrice,
    maxPrice,
    ownerId,
    searchQuery,
  } = options;

  // Fetch one extra to determine if there are more results
  const fetchLimit = Math.min(limit + 1, MAX_PAGE_SIZE + 1);

  let query = supabase
    .from('assets')
    .select(`
      *,
      profiles:owner_id (full_name, username),
      nft_tokens (token_id, contract_address)
    `)
    .in('status', status)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(fetchLimit);

  // Apply cursor filter
  const cursorData = buildCursorQuery(cursor);
  if (cursorData) {
    // Use composite cursor: (created_at, id) < (cursor_created_at, cursor_id)
    query = query.or(
      `created_at.lt.${cursorData.created_at},and(created_at.eq.${cursorData.created_at},id.lt.${cursorData.id})`
    );
  }

  // Apply filters
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (minPrice !== undefined) {
    query = query.gte('estimated_value', minPrice);
  }

  if (maxPrice !== undefined) {
    query = query.lte('estimated_value', maxPrice);
  }

  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  }

  // Full-text search (if search_vector column exists)
  if (searchQuery && searchQuery.trim()) {
    query = query.textSearch('search_vector', searchQuery, {
      type: 'websearch',
      config: 'english',
    });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const hasMore = (data?.length || 0) > limit;
  const items = hasMore ? data?.slice(0, limit) : data;
  const lastItem = items?.[items.length - 1];
  const nextCursor = hasMore && lastItem ? createCursor(lastItem) : null;

  return {
    data: items || [],
    nextCursor,
    hasMore,
  };
}

/**
 * Fetch transactions with cursor-based pagination.
 */
export async function fetchTransactionsCursor(options: {
  cursor: string | null;
  limit: number;
  userId: string;
  type?: 'all' | 'purchases' | 'sales';
  status?: string;
}) {
  const {
    cursor,
    limit = DEFAULT_PAGE_SIZE,
    userId,
    type = 'all',
    status,
  } = options;

  const fetchLimit = Math.min(limit + 1, MAX_PAGE_SIZE + 1);

  let query = supabase
    .from('transactions')
    .select(`
      *,
      assets (title, category, images)
    `)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(fetchLimit);

  // Filter by user role in transaction
  if (type === 'purchases') {
    query = query.eq('buyer_id', userId);
  } else if (type === 'sales') {
    query = query.eq('seller_id', userId);
  } else {
    query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  // Apply cursor
  const cursorData = buildCursorQuery(cursor);
  if (cursorData) {
    query = query.or(
      `created_at.lt.${cursorData.created_at},and(created_at.eq.${cursorData.created_at},id.lt.${cursorData.id})`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const hasMore = (data?.length || 0) > limit;
  const items = hasMore ? data?.slice(0, limit) : data;
  const lastItem = items?.[items.length - 1];
  const nextCursor = hasMore && lastItem ? createCursor(lastItem) : null;

  return {
    data: items || [],
    nextCursor,
    hasMore,
  };
}

/**
 * Fetch notifications with cursor-based pagination.
 */
export async function fetchNotificationsCursor(options: {
  cursor: string | null;
  limit: number;
  userId: string;
  unreadOnly?: boolean;
}) {
  const {
    cursor,
    limit = DEFAULT_PAGE_SIZE,
    userId,
    unreadOnly = false,
  } = options;

  const fetchLimit = Math.min(limit + 1, MAX_PAGE_SIZE + 1);

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(fetchLimit);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const cursorData = buildCursorQuery(cursor);
  if (cursorData) {
    query = query.or(
      `created_at.lt.${cursorData.created_at},and(created_at.eq.${cursorData.created_at},id.lt.${cursorData.id})`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const hasMore = (data?.length || 0) > limit;
  const items = hasMore ? data?.slice(0, limit) : data;
  const lastItem = items?.[items.length - 1];
  const nextCursor = hasMore && lastItem ? createCursor(lastItem) : null;

  return {
    data: items || [],
    nextCursor,
    hasMore,
  };
}

/**
 * Get count for a filtered query (for UI display).
 * Uses count query which is optimized with indexes.
 */
export async function getAssetCount(options: {
  status?: string[];
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const {
    status = ['verified', 'tokenized', 'listed'],
    category,
    minPrice,
    maxPrice,
  } = options;

  let query = supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .in('status', status);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (minPrice !== undefined) {
    query = query.gte('estimated_value', minPrice);
  }

  if (maxPrice !== undefined) {
    query = query.lte('estimated_value', maxPrice);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Search assets using full-text search.
 * Requires the search_vector column and GIN index from migration.
 */
export async function searchAssets(options: {
  query: string;
  limit?: number;
  category?: string;
}) {
  const { query: searchQuery, limit = 20, category } = options;

  if (!searchQuery.trim()) {
    return { data: [], count: 0 };
  }

  let query = supabase
    .from('assets')
    .select(`
      *,
      profiles:owner_id (full_name, username)
    `)
    .in('status', ['verified', 'tokenized', 'listed'])
    .textSearch('search_vector', searchQuery, {
      type: 'websearch',
      config: 'english',
    })
    .limit(limit);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback to ILIKE if full-text search not available
    const fallbackQuery = supabase
      .from('assets')
      .select(`
        *,
        profiles:owner_id (full_name, username)
      `)
      .in('status', ['verified', 'tokenized', 'listed'])
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .limit(limit);

    if (category && category !== 'all') {
      fallbackQuery.eq('category', category);
    }

    const fallbackResult = await fallbackQuery;
    return { data: fallbackResult.data || [], count: fallbackResult.data?.length || 0 };
  }

  return { data: data || [], count: data?.length || 0 };
}
