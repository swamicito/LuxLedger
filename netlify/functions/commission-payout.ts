/**
 * LuxBroker Commission Payout API
 * Handles automatic commission payments via XRPL
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { XRPLCommissionManager } from '../../src/lib/luxbroker/xrpl-commission';
import { commissionService, brokerService, sellerService } from '../../src/lib/supabase-client';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
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
    console.error('Commission payout error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message
      })
    };
  }
};
