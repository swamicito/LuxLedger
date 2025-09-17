/**
 * LuxBroker Seller Registration API
 * Registers sellers with broker attribution from referral cookies
 */

import { Handler } from '@netlify/functions';
import { sellerService, referralService } from '../../src/lib/supabase-client';

export const handler: Handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
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
    const { walletAddress } = body;

    // Validate required fields
    if (!walletAddress) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Wallet address is required' })
      };
    }

    // Validate XRPL address format
    if (!walletAddress.startsWith('r') || walletAddress.length < 25) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid XRPL wallet address format' })
      };
    }

    // Check if seller already exists
    const { data: existingSeller } = await sellerService.getByWallet(walletAddress);
    if (existingSeller) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Seller already registered',
          referredBy: existingSeller.referred_by
        })
      };
    }

    // Extract referral code from cookies
    let referralCode: string | null = null;
    const cookies = event.headers.cookie;
    
    if (cookies) {
      const cookieMatch = cookies.match(/lux_referral=([^;]+)/);
      if (cookieMatch) {
        referralCode = decodeURIComponent(cookieMatch[1]);
      }
    }

    // Register the seller with optional referral attribution
    const { data: seller, error } = await sellerService.register(
      walletAddress,
      referralCode || undefined
    );

    if (error) {
      console.error('Seller registration error:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to register seller',
          details: error.message
        })
      };
    }

    // Mark referral as converted if applicable
    if (referralCode) {
      const clientIP = event.headers['x-forwarded-for'] || 
                      event.headers['x-real-ip'] || 
                      'unknown';
      
      await referralService.markConverted(referralCode, clientIP);
    }

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        seller: {
          id: seller.id,
          walletAddress: seller.wallet_address,
          referredBy: seller.referred_by,
          referralLocked: seller.referral_locked_until
        },
        message: referralCode 
          ? `Successfully registered with referral from ${referralCode}`
          : 'Successfully registered as seller'
      })
    };

  } catch (error) {
    console.error('Seller registration error:', error);
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
