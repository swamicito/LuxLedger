/**
 * Netlify Function: Finish XRPL Escrow
 * POST /api/escrow/finish
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
      finisherAddress,
      condition,
      fulfillment
    } = body;

    // Validate required fields
    if (!escrowOwner || !escrowSequence || !finisherAddress) {
      return errorResponse(400, 'Missing required fields: escrowOwner, escrowSequence, finisherAddress');
    }

    // Validate wallet authentication
    const walletHeader = event.headers['x-wallet'] || event.headers['x-wallet-address'];
    if (!walletHeader) {
      return errorResponse(401, 'Missing wallet authentication');
    }

    // Verify the caller is the finisher
    if (walletHeader !== finisherAddress) {
      safeLog('warn', 'Escrow finish: wallet mismatch', { header: walletHeader.slice(0, 10) });
      return errorResponse(403, 'Wallet address does not match finisher address');
    }

    // Check if escrow can be finished
    const canFinish = await xrplEscrowManager.canFinishEscrow(escrowOwner, escrowSequence);
    
    if (!canFinish.canFinish) {
      return errorResponse(400, canFinish.reason || 'Escrow cannot be finished');
    }

    // Finish escrow
    const result = await xrplEscrowManager.finishEscrow({
      escrowOwner,
      escrowSequence,
      finisherAddress,
      condition,
      fulfillment
    });

    if (result.success) {
      safeLog('info', 'Escrow finished', { escrowSequence, txHash: result.txHash });
      return successResponse({
        success: true,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        message: 'Escrow completed successfully - funds released to seller'
      });
    } else {
      safeLog('error', 'Escrow finish failed', { escrowSequence, error: result.error });
      return errorResponse(500, result.error || 'Escrow finish failed');
    }
  } catch (error) {
    safeLog('error', 'Escrow finish error', { error: (error as Error).message });
    return errorResponse(500, 'Internal server error');
  }
};
