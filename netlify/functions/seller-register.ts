/**
 * LuxBroker Seller Registration API
 * Registers sellers with broker attribution from referral cookies
 */

import { Handler } from '@netlify/functions';
import { sellerService, referralService } from '../../src/lib/supabase-client';
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

  // Rate limit: 5 registrations per hour per IP
  const clientId = getClientIdentifier(event);
  const rateCheck = checkRateLimit(clientId, 'register');
  if (!rateCheck.allowed) {
    return errorResponse(429, 'Too many registration attempts', rateCheck.retryAfter);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { walletAddress } = body;

    if (!walletAddress) {
      return errorResponse(400, 'Wallet address is required');
    }

    // Validate XRPL address format
    if (!walletAddress.startsWith('r') || walletAddress.length < 25) {
      return errorResponse(400, 'Invalid XRPL wallet address format');
    }

    // Check if seller already exists
    const { data: existingSeller } = await sellerService.getByWallet(walletAddress);
    if (existingSeller) {
      return errorResponse(409, 'Seller already registered');
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
      safeLog('error', 'Seller registration error', { wallet: walletAddress.slice(0, 10) });
      return errorResponse(500, 'Failed to register seller');
    }

    // Mark referral as converted if applicable
    if (referralCode) {
      const clientIP = event.headers['x-forwarded-for'] || 
                      event.headers['x-real-ip'] || 
                      'unknown';
      
      await referralService.markConverted(referralCode, clientIP);
    }

    safeLog('info', 'Seller registered', { sellerId: seller.id });
    return successResponse({
      success: true,
      seller: {
        id: seller.id,
        walletAddress: seller.wallet_address,
      },
      message: 'Successfully registered as seller'
    }, 201);

  } catch (error) {
    safeLog('error', 'Seller registration error', { error: (error as Error).message });
    return errorResponse(500, 'Internal server error');
  }
};
