/**
 * Netlify Function: Finish XRPL Escrow
 * POST /api/escrow/finish
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
      finisherAddress,
      condition,
      fulfillment
    } = body;

    // Validate required fields
    if (!escrowOwner || !escrowSequence || !finisherAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: escrowOwner, escrowSequence, finisherAddress' 
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

    // Check if escrow can be finished
    const canFinish = await xrplEscrowManager.canFinishEscrow(escrowOwner, escrowSequence);
    
    if (!canFinish.canFinish) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: canFinish.reason,
          timeRemaining: canFinish.timeRemaining
        })
      };
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
          message: 'Escrow completed successfully - funds released to seller'
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
    console.error('Escrow finish error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message
      })
    };
  }
};
