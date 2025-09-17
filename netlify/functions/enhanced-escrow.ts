/**
 * Enhanced XRPL Escrow API - Unified Create/Finalize Endpoint
 * Based on provided examples with improved validation and error handling
 */

import { Handler } from '@netlify/functions';
import { enhancedXrplEscrowManager } from '../../src/lib/escrow/enhanced-xrpl';

export const handler: Handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-wallet, x-auth-token',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      amountUSD,
      assetType,
      buyerAddress,
      sellerAddress,
      expirationSeconds,
      escrowSequence,
      finalize
    } = body;

    // Validate authentication
    const walletHeader = event.headers['x-wallet'];
    if (!walletHeader) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing wallet authentication' })
      };
    }

    // Validate required parameters
    if (!buyerAddress) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Buyer address is required' })
      };
    }

    if (finalize) {
      // Finalize escrow flow
      if (!escrowSequence) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Escrow sequence required for finalization' })
        };
      }

      const result = await enhancedXrplEscrowManager.finishEscrow({
        buyerAddress,
        sellerAddress: '', // Not needed for finalization
        amountUSD: 0, // Not needed for finalization
        expirationSeconds: 0, // Not needed for finalization
        escrowSequence: parseInt(escrowSequence),
        finalize: true
      });

      return {
        statusCode: result.success ? 200 : 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      };

    } else {
      // Create escrow flow
      if (!sellerAddress || !amountUSD || !expirationSeconds) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Missing required parameters for escrow creation' })
        };
      }

      const result = await enhancedXrplEscrowManager.createEscrow({
        amountUSD: parseFloat(amountUSD),
        assetType,
        buyerAddress,
        sellerAddress,
        expirationSeconds: parseInt(expirationSeconds)
      });

      return {
        statusCode: result.success ? 200 : 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      };
    }

  } catch (error) {
    console.error('Enhanced escrow error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: (error as Error).message
      })
    };
  }
};
