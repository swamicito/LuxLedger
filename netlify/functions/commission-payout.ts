/**
 * LuxBroker Commission Payout API
 * Handles automatic commission payments via XRPL
 * 
 * SECURITY: Requires admin role - payouts are sensitive operations
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { XRPLCommissionManager } from '../../src/lib/luxbroker/xrpl-commission';
import {
  verifyWalletAuth,
  requireAdmin,
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

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  // Rate limit: 5 sensitive ops per minute
  const clientIP = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const rateCheck = checkRateLimit(clientIP, 'sensitive');
  if (!rateCheck.allowed) {
    return errorResponse(429, 'Too many requests', rateCheck.retryAfter);
  }

  // Authenticate - commission payouts require admin privileges
  const walletAddress = event.headers['x-wallet-address'];
  const authResult = await verifyWalletAuth(walletAddress, undefined, undefined, supabase);
  
  if (!authResult.success) {
    return errorResponse(authResult.statusCode, authResult.error || 'Authentication failed');
  }

  // CRITICAL: Only admins can trigger payouts
  const roleCheck = requireAdmin(authResult.context);
  if (!roleCheck.success) {
    safeLog('warn', 'Unauthorized payout attempt', { wallet: walletAddress?.slice(0, 10) });
    return errorResponse(roleCheck.statusCode, roleCheck.error || 'Admin access required');
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      saleAmountUSD, 
      sellerWallet, 
      buyerWallet, 
      buyerWalletSeed, 
      saleId,
      brokerReferralCode 
    } = body;

    // Validate required fields
    if (!saleAmountUSD || !sellerWallet || !buyerWallet || !buyerWalletSeed || !saleId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: saleAmountUSD, sellerWallet, buyerWallet, buyerWalletSeed, saleId' 
        })
      };
    }

    // Validate wallet addresses
    if (!sellerWallet.startsWith('r') || !buyerWallet.startsWith('r')) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid XRPL wallet address format' })
      };
    }

    // Initialize commission manager
    const commissionManager = new XRPLCommissionManager(
      process.env.XRPL_RPC_URL,
      process.env.XRPL_ESCROW_SEED,
      process.env.XRPL_PLATFORM_WALLET
    );

    // Calculate commission split
    const split = await commissionManager.calculateCommissionSplit(
      saleAmountUSD,
      sellerWallet,
      brokerReferralCode
    );

    // Validate the split
    const validation = commissionManager.validateCommissionSplit(split);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid commission split',
          details: validation.errors
        })
      };
    }

    // Get current XRP rate
    const xrpRate = await commissionManager.getCurrentXRPRate();

    // Execute commission split
    const result = await commissionManager.executeCommissionSplit(
      split,
      buyerWallet,
      buyerWalletSeed,
      saleId,
      xrpRate
    );

    if (!result.success) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Commission payout failed',
          details: result.error
        })
      };
    }

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        split: {
          sellerAmount: split.sellerAmount,
          brokerAmount: split.brokerAmount,
          platformAmount: split.platformAmount,
          commissionRate: split.commissionRate
        },
        transactions: result.transactions,
        commissionId: result.commissionId,
        xrpRate
      })
    };

  } catch (error) {
    safeLog('error', 'Commission payout error', { error: (error as Error).message });
    return errorResponse(500, 'Internal server error');
  }
};
