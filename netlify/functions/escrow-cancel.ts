/**
 * Netlify Function: Cancel XRPL Escrow
 * POST /api/escrow/cancel
 */

import { Handler } from '@netlify/functions';
import { xrplEscrowManager } from '../../src/lib/escrow/xrpl';

export const handler: Handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-wallet',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
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
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: escrowOwner, escrowSequence, cancellerAddress' 
        })
      };
    }

    // Validate wallet authentication
    const walletHeader = event.headers['x-wallet'];
    if (!walletHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing wallet authentication' })
      };
    }

    // Check if escrow exists and can be cancelled
    const escrowDetails = await xrplEscrowManager.getEscrowDetails(escrowOwner, escrowSequence);
    
    if (!escrowDetails) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Escrow not found' })
      };
    }

    // Check if cancellation is allowed (after expiration or dispute)
    const now = Math.floor(Date.now() / 1000);
    const cancelAfter = escrowDetails.CancelAfter;
    
    if (now < cancelAfter && !reason?.includes('dispute')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Escrow cannot be cancelled before expiration time',
          cancelAfter: cancelAfter,
          timeRemaining: cancelAfter - now
        })
      };
    }

    // Cancel escrow
    const result = await xrplEscrowManager.cancelEscrow({
      escrowOwner,
      escrowSequence,
      cancellerAddress
    });

    if (result.success) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          message: 'Escrow cancelled successfully - funds returned to buyer',
          reason: reason || 'Expired'
        })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: result.error
        })
      };
    }
  } catch (error) {
    console.error('Escrow cancel error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message
      })
    };
  }
};
