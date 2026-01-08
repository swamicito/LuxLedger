/**
 * Netlify Function: Create XRPL Escrow
 * POST /api/escrow/create
 * 
 * SECURITY: Requires wallet authentication, rate limited
 */

import { Handler } from '@netlify/functions';
import { xrplEscrowManager } from '../../src/lib/escrow/xrpl';
import {
  checkRateLimit,
  getClientIdentifier,
  safeLog,
  CORS_HEADERS,
  errorResponse,
  successResponse,
} from '../../src/lib/security';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  // Rate limit: 10 escrow ops per minute
  const clientId = getClientIdentifier(event);
  const rateCheck = checkRateLimit(clientId, 'escrow');
  if (!rateCheck.allowed) {
    return errorResponse(429, 'Too many escrow requests', rateCheck.retryAfter);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      amountUSD,
      buyerAddress,
      sellerAddress,
      assetId,
      assetTitle,
      assetCategory,
      expirationDays,
      conditions,
      destinationTag
    } = body;

    // Validate required fields
    if (!amountUSD || !buyerAddress || !sellerAddress) {
      return errorResponse(400, 'Missing required fields: amountUSD, buyerAddress, sellerAddress');
    }

    // Validate wallet authentication
    const walletHeader = event.headers['x-wallet'] || event.headers['x-wallet-address'];
    if (!walletHeader) {
      return errorResponse(401, 'Missing wallet authentication');
    }

    // Verify the caller is the buyer (only buyer can create escrow)
    if (walletHeader !== buyerAddress) {
      safeLog('warn', 'Escrow create: wallet mismatch', { header: walletHeader.slice(0, 10), buyer: buyerAddress.slice(0, 10) });
      return errorResponse(403, 'Wallet address does not match buyer address');
    }

    // Validate amount
    if (typeof amountUSD !== 'number' || amountUSD < 100) {
      return errorResponse(400, 'Minimum escrow amount is $100 USD');
    }

    if (amountUSD > 10_000_000) {
      return errorResponse(400, 'Maximum escrow amount is $10M USD');
    }

    // Validate XRPL addresses
    if (!buyerAddress.startsWith('r') || !sellerAddress.startsWith('r')) {
      return errorResponse(400, 'Invalid XRPL address format');
    }

    // Create escrow
    const result = await xrplEscrowManager.createEscrow({
      amountUSD,
      buyerAddress,
      sellerAddress,
      assetId,
      assetTitle,
      assetCategory,
      expirationDays,
      conditions,
      destinationTag
    });

    if (result.success) {
      safeLog('info', 'Escrow created', { escrowSequence: result.escrowSequence, assetId });
      return successResponse({
        success: true,
        escrowId: result.txHash,
        txHash: result.txHash,
        escrowSequence: result.escrowSequence,
        explorerUrl: result.explorerUrl,
      });
    } else {
      safeLog('error', 'Escrow creation failed', { error: result.error });
      return errorResponse(500, result.error || 'Escrow creation failed');
    }
  } catch (error) {
    safeLog('error', 'Escrow creation error', { error: (error as Error).message });
    return errorResponse(500, 'Internal server error');
  }
};
