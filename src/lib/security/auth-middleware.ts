/**
 * Server-side Authentication & Authorization Middleware
 * Enforces role-based access control for all privileged operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'broker' | 'seller' | 'user';

export interface AuthContext {
  userId: string;
  walletAddress: string | null;
  role: UserRole;
  isAdmin: boolean;
  isBroker: boolean;
  isSeller: boolean;
}

export interface AuthResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
  statusCode: number;
}

// ─────────────────────────────────────────────────────────────
// SAFE LOGGER - Never logs sensitive data
// ─────────────────────────────────────────────────────────────

const SENSITIVE_KEYS = [
  'password', 'secret', 'key', 'token', 'seed', 'private',
  'authorization', 'cookie', 'session', 'credential', 'api_key',
  'apikey', 'wallet_seed', 'buyerWalletSeed'
];

export function safeLog(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  const sanitized = data ? sanitizeObject(data) : undefined;
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...(sanitized && { data: sanitized }) };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

function sanitizeObject(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 3) return { _truncated: true };
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Redact sensitive keys
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      result[key] = '[REDACTED]';
      continue;
    }
    
    // Redact wallet addresses partially
    if (lowerKey.includes('wallet') || lowerKey.includes('address')) {
      if (typeof value === 'string' && value.startsWith('r')) {
        result[key] = `${value.slice(0, 6)}...${value.slice(-4)}`;
        continue;
      }
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, depth + 1);
    } else if (Array.isArray(value)) {
      result[key] = value.length > 5 ? `[Array(${value.length})]` : value;
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────

/**
 * Verify Supabase JWT token from Authorization header
 */
export async function verifySupabaseAuth(
  authHeader: string | undefined,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header',
      statusCode: 401,
    };
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      safeLog('warn', 'Auth verification failed', { error: error?.message });
      return {
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401,
      };
    }

    // Get user role from metadata or profiles table
    const role = await getUserRole(supabase, user.id);
    const walletAddress = user.user_metadata?.wallet_address || null;

    return {
      success: true,
      context: {
        userId: user.id,
        walletAddress,
        role,
        isAdmin: role === 'admin',
        isBroker: role === 'broker',
        isSeller: role === 'seller',
      },
      statusCode: 200,
    };
  } catch (err) {
    safeLog('error', 'Auth verification error', { error: (err as Error).message });
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    };
  }
}

/**
 * Verify wallet-based authentication via signed message
 * For XUMM/wallet-only auth flows
 */
export async function verifyWalletAuth(
  walletAddress: string | undefined,
  signature: string | undefined,
  nonce: string | undefined,
  supabase: SupabaseClient
): Promise<AuthResult> {
  if (!walletAddress) {
    return {
      success: false,
      error: 'Missing wallet address',
      statusCode: 401,
    };
  }

  // For now, we trust the wallet header if it's a valid XRPL address
  // In production, implement full signature verification
  if (!walletAddress.startsWith('r') || walletAddress.length < 25) {
    return {
      success: false,
      error: 'Invalid XRPL wallet address',
      statusCode: 401,
    };
  }

  // Check if wallet is associated with a user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('wallet_address', walletAddress)
    .single();

  // Check broker status
  const { data: broker } = await supabase
    .from('brokers')
    .select('id, status')
    .eq('wallet_address', walletAddress)
    .single();

  // Check seller status
  const { data: seller } = await supabase
    .from('sellers')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  let role: UserRole = 'user';
  if (profile?.role === 'admin') role = 'admin';
  else if (broker?.status === 'active') role = 'broker';
  else if (seller) role = 'seller';

  return {
    success: true,
    context: {
      userId: profile?.id || walletAddress,
      walletAddress,
      role,
      isAdmin: role === 'admin',
      isBroker: role === 'broker',
      isSeller: role === 'seller',
    },
    statusCode: 200,
  };
}

async function getUserRole(supabase: SupabaseClient, userId: string): Promise<UserRole> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'admin') return 'admin';
    if (profile?.role === 'broker') return 'broker';
    if (profile?.role === 'seller') return 'seller';
    return 'user';
  } catch {
    return 'user';
  }
}

// ─────────────────────────────────────────────────────────────
// AUTHORIZATION GUARDS
// ─────────────────────────────────────────────────────────────

export function requireRole(context: AuthContext | undefined, ...allowedRoles: UserRole[]): AuthResult {
  if (!context) {
    return {
      success: false,
      error: 'Authentication required',
      statusCode: 401,
    };
  }

  if (!allowedRoles.includes(context.role) && !context.isAdmin) {
    safeLog('warn', 'Unauthorized role access attempt', {
      userId: context.userId,
      role: context.role,
      requiredRoles: allowedRoles,
    });
    return {
      success: false,
      error: 'Insufficient permissions',
      statusCode: 403,
    };
  }

  return { success: true, context, statusCode: 200 };
}

export function requireAdmin(context: AuthContext | undefined): AuthResult {
  return requireRole(context, 'admin');
}

export function requireBroker(context: AuthContext | undefined): AuthResult {
  return requireRole(context, 'broker', 'admin');
}

export function requireSeller(context: AuthContext | undefined): AuthResult {
  return requireRole(context, 'seller', 'admin');
}

/**
 * Verify the user owns the resource they're trying to access
 */
export function requireOwnership(
  context: AuthContext | undefined,
  resourceOwnerId: string
): AuthResult {
  if (!context) {
    return {
      success: false,
      error: 'Authentication required',
      statusCode: 401,
    };
  }

  // Admins can access any resource
  if (context.isAdmin) {
    return { success: true, context, statusCode: 200 };
  }

  if (context.userId !== resourceOwnerId && context.walletAddress !== resourceOwnerId) {
    safeLog('warn', 'Unauthorized resource access attempt', {
      userId: context.userId,
      resourceOwnerId,
    });
    return {
      success: false,
      error: 'Access denied',
      statusCode: 403,
    };
  }

  return { success: true, context, statusCode: 200 };
}

// ─────────────────────────────────────────────────────────────
// NONCE-BASED WALLET AUTHENTICATION
// ─────────────────────────────────────────────────────────────

// In-memory nonce store (resets on cold start - acceptable for serverless)
// Production upgrade: Use Upstash Redis for persistent nonce storage
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

/**
 * Generate a nonce for wallet authentication
 * Nonces expire after 5 minutes
 */
export function generateNonce(walletAddress: string): string {
  const nonce = `luxledger:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  nonceStore.set(walletAddress.toLowerCase(), { nonce, expiresAt });
  return nonce;
}

/**
 * Verify a nonce for wallet authentication
 * Returns true if nonce is valid and not expired
 */
export function verifyNonce(walletAddress: string, nonce: string): boolean {
  const key = walletAddress.toLowerCase();
  const stored = nonceStore.get(key);
  
  if (!stored) {
    return false;
  }
  
  // Check expiration
  if (Date.now() > stored.expiresAt) {
    nonceStore.delete(key);
    return false;
  }
  
  // Check nonce match
  if (stored.nonce !== nonce) {
    return false;
  }
  
  // Consume nonce (one-time use)
  nonceStore.delete(key);
  return true;
}

/**
 * Clean up expired nonces periodically
 */
function cleanupNonces() {
  const now = Date.now();
  for (const [key, value] of nonceStore.entries()) {
    if (now > value.expiresAt) {
      nonceStore.delete(key);
    }
  }
}

// Cleanup nonces every 2 minutes
setInterval(cleanupNonces, 120000);

// ─────────────────────────────────────────────────────────────
// RATE LIMITING (In-memory for serverless)
// ─────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on cold start, but provides basic protection)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60000, maxRequests: 60 },  // 60 req/min
  write: { windowMs: 60000, maxRequests: 20 },    // 20 writes/min
  auth: { windowMs: 300000, maxRequests: 10 },    // 10 auth attempts/5min
  sensitive: { windowMs: 60000, maxRequests: 5 }, // 5 sensitive ops/min
  register: { windowMs: 3600000, maxRequests: 5 }, // 5 registrations/hour per IP
  escrow: { windowMs: 60000, maxRequests: 10 },   // 10 escrow ops/min
};

export function checkRateLimit(
  identifier: string,
  configKey: keyof typeof DEFAULT_RATE_LIMITS = 'default'
): { allowed: boolean; retryAfter?: number } {
  const config = DEFAULT_RATE_LIMITS[configKey];
  const now = Date.now();
  const key = `${configKey}:${identifier}`;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }
  
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    safeLog('warn', 'Rate limit exceeded', { identifier: identifier.slice(0, 20), configKey });
    return { allowed: false, retryAfter };
  }
  
  entry.count++;
  return { allowed: true };
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

// ─────────────────────────────────────────────────────────────
// HELPER: Create authenticated response headers
// ─────────────────────────────────────────────────────────────

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wallet-Address',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

export function errorResponse(statusCode: number, error: string, retryAfter?: number) {
  const headers = { ...CORS_HEADERS };
  if (retryAfter) {
    (headers as Record<string, string>)['Retry-After'] = String(retryAfter);
  }
  return {
    statusCode,
    headers,
    body: JSON.stringify({ error }),
  };
}

export function successResponse(data: unknown, statusCode = 200) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

// ─────────────────────────────────────────────────────────────
// HELPER: Extract client identifier for rate limiting
// ─────────────────────────────────────────────────────────────

export function getClientIdentifier(event: { headers: Record<string, string | undefined> }): string {
  // Prefer wallet address if available, fall back to IP
  const wallet = event.headers['x-wallet-address'] || event.headers['x-wallet'];
  if (wallet) {
    return `wallet:${wallet.slice(0, 20)}`;
  }
  
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || 
             event.headers['x-real-ip'] || 
             'unknown';
  return `ip:${ip}`;
}

// ─────────────────────────────────────────────────────────────
// PRODUCTION UPGRADE PATH (Documentation)
// ─────────────────────────────────────────────────────────────

/**
 * PRODUCTION UPGRADE PATH:
 * 
 * Current implementation uses in-memory stores which reset on cold starts.
 * This provides basic protection but is not persistent.
 * 
 * For production, upgrade to:
 * 
 * 1. Rate Limiting: Upstash Redis
 *    - npm install @upstash/ratelimit @upstash/redis
 *    - Use Ratelimit from @upstash/ratelimit with sliding window
 *    - Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * 
 * 2. Nonce Storage: Upstash Redis with TTL
 *    - Store nonces with 5-minute TTL
 *    - Use Redis SET with EX option
 * 
 * 3. Session Tokens: Supabase Auth or custom JWT
 *    - For wallet-based auth, issue short-lived JWTs after nonce verification
 *    - Store refresh tokens in Supabase
 * 
 * Example Upstash rate limiting:
 * ```
 * import { Ratelimit } from '@upstash/ratelimit';
 * import { Redis } from '@upstash/redis';
 * 
 * const ratelimit = new Ratelimit({
 *   redis: Redis.fromEnv(),
 *   limiter: Ratelimit.slidingWindow(20, '1 m'),
 * });
 * 
 * const { success, limit, remaining } = await ratelimit.limit(identifier);
 * ```
 */
