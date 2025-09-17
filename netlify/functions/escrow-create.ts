/**
 * Netlify Function: Create XRPL Escrow
 * POST /api/escrow/create
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
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: amountUSD, buyerAddress, sellerAddress' 
        })
      };
    }

    // Validate wallet authentication (simplified)
    const walletHeader = event.headers['x-wallet'];
    if (!walletHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing wallet authentication' })
      };
    }

    // Enhanced validation based on your examples
    if (typeof amountUSD !== 'number' || amountUSD < 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Minimum escrow amount is $100 USD' })
      };
    }

    if (amountUSD > 10_000_000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Maximum escrow amount is $10M USD' })
      };
    }

    // Validate XRPL addresses
    if (!buyerAddress.startsWith('r') || !sellerAddress.startsWith('r')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid XRPL address format' })
      };
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
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          escrowId: result.txHash,
          txHash: result.txHash,
          escrowSequence: result.escrowSequence,
          explorerUrl: result.explorerUrl,
          metadata: result.metadata
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
    console.error('Escrow creation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message
      })
    };
  }
};
