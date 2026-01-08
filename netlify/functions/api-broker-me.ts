import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  verifyWalletAuth,
  requireBroker,
  requireOwnership,
  checkRateLimit,
  safeLog,
  CORS_HEADERS,
  errorResponse,
  successResponse,
} from '../../src/lib/security';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Method not allowed');
  }

  // Rate limit
  const clientIP = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const rateCheck = checkRateLimit(clientIP, 'default');
  if (!rateCheck.allowed) {
    return errorResponse(429, 'Too many requests', rateCheck.retryAfter);
  }

  try {
    const walletAddress = event.headers['x-wallet-address'];

    // Authenticate via wallet
    const authResult = await verifyWalletAuth(walletAddress, undefined, undefined, supabase);
    if (!authResult.success) {
      return errorResponse(authResult.statusCode, authResult.error || 'Authentication failed');
    }

    // Require broker role
    const roleCheck = requireBroker(authResult.context);
    if (!roleCheck.success) {
      return errorResponse(roleCheck.statusCode, roleCheck.error || 'Broker access required');
    }

    // Fetch broker profile
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (brokerError || !broker) {
      return errorResponse(404, 'Broker not found');
    }

    // Verify ownership - brokers can only view their own data
    const ownershipCheck = requireOwnership(authResult.context, broker.wallet_address);
    if (!ownershipCheck.success) {
      return errorResponse(ownershipCheck.statusCode, ownershipCheck.error || 'Access denied');
    }

    // Fetch commission stats
    const { data: commissions } = await supabase
      .from('commissions')
      .select('sale_amount_usd, commission_usd')
      .eq('broker_id', broker.id);

    const stats = {
      total_sales_usd: commissions?.reduce((sum, c) => sum + (c.sale_amount_usd || 0), 0) || 0,
      total_commission_usd: commissions?.reduce((sum, c) => sum + (c.commission_usd || 0), 0) || 0,
      active_sellers: broker.referred_sellers_count || 0,
    };

    return successResponse({ broker, stats });
  } catch (error) {
    safeLog('error', 'Broker profile error', { error: (error as Error).message });
    return errorResponse(500, 'Internal server error');
  }
};
