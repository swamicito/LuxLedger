/**
 * Netlify Function: Cancel XRPL Escrow
 * POST /api/escrow/cancel
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

  // Rate limit
  const clientId = getClientIdentifier(event);
  const rateCheck = checkRateLimit(clientId, 'escrow');
  if (!rateCheck.allowed) {
    return errorResponse(429, 'Too many escrow requests', rateCheck.retryAfter);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      escrowOwner,
      escrowSequence,
      cancellerAddress,
      reason
    } = body;

    // Validate required fields
    if (!escrowOwner || !escrowSequence || !cancellerAddress) {
      return errorResponse(400, 'Missing required fields: escrowOwner, escrowSequence, cancellerAddress');
    }

    // Validate wallet authentication
    const walletHeader = event.headers['x-wallet'] || event.headers['x-wallet-address'];
    if (!walletHeader) {
      return errorResponse(401, 'Missing wallet authentication');
    }

    // Verify the caller is the canceller
    if (walletHeader !== cancellerAddress) {
      safeLog('warn', 'Escrow cancel: wallet mismatch', { header: walletHeader.slice(0, 10) });
      return errorResponse(403, 'Wallet address does not match canceller address');
    }

    // Check if escrow exists and can be cancelled
    const escrowDetails = await xrplEscrowManager.getEscrowDetails(escrowOwner, escrowSequence);
    
    if (!escrowDetails) {
      return errorResponse(404, 'Escrow not found');
    }

    // Check if cancellation is allowed (after expiration or dispute)
    const now = Math.floor(Date.now() / 1000);
    const cancelAfter = escrowDetails.CancelAfter;
    
    if (now < cancelAfter && !reason?.includes('dispute')) {
      return errorResponse(400, 'Escrow cannot be cancelled before expiration time');
    }

    // Cancel escrow
    const result = await xrplEscrowManager.cancelEscrow({
      escrowOwner,
      escrowSequence,
      cancellerAddress
    });

    if (result.success) {
      safeLog('info', 'Escrow cancelled', { escrowSequence, reason: reason || 'Expired' });
      return successResponse({
        success: true,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        message: 'Escrow cancelled successfully - funds returned to buyer',
        reason: reason || 'Expired'
      });
    } else {
      safeLog('error', 'Escrow cancel failed', { escrowSequence, error: result.error });
      return errorResponse(500, result.error || 'Escrow cancel failed');
    }
  } catch (error) {
    safeLog('error', 'Escrow cancel error', { error: (error as Error).message });
    return errorResponse(500, 'Internal server error');
  }
};
