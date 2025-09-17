/**
 * Netlify Function: Get XRPL Escrow Status
 * GET /api/escrow/status?owner={address}&sequence={number}
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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { owner, sequence } = event.queryStringParameters || {};

    if (!owner || !sequence) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required parameters: owner, sequence' 
        })
      };
    }

    const escrowSequence = parseInt(sequence);
    if (isNaN(escrowSequence)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid sequence number' })
      };
    }

    // Get escrow details
    const escrowDetails = await xrplEscrowManager.getEscrowDetails(owner, escrowSequence);
    
    if (!escrowDetails) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Escrow not found' })
      };
    }

    // Check if escrow can be finished
    const canFinish = await xrplEscrowManager.canFinishEscrow(owner, escrowSequence);

    const now = Math.floor(Date.now() / 1000);
    const finishAfter = escrowDetails.FinishAfter;
    const cancelAfter = escrowDetails.CancelAfter;

    let status = 'active';
    if (now >= cancelAfter) {
      status = 'expired';
    } else if (now >= finishAfter) {
      status = 'ready_to_finish';
    } else {
      status = 'waiting';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        escrow: {
          owner: escrowDetails.Account,
          destination: escrowDetails.Destination,
          amount: escrowDetails.Amount,
          sequence: escrowDetails.Sequence,
          finishAfter: escrowDetails.FinishAfter,
          cancelAfter: escrowDetails.CancelAfter,
          condition: escrowDetails.Condition,
          status,
          canFinish: canFinish.canFinish,
          timeRemaining: canFinish.timeRemaining,
          explorerUrl: `https://testnet.xrpl.org/transactions/${escrowDetails.PreviousTxnID}`
        }
      })
    };
  } catch (error) {
    console.error('Escrow status error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message
      })
    };
  }
};
