import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  checkRateLimit,
  getClientIdentifier,
  safeLog,
  CORS_HEADERS,
  errorResponse,
  successResponse,
} from '../../src/lib/security';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    const { walletAddress } = JSON.parse(event.body || '{}');

    if (!walletAddress) {
      return errorResponse(400, 'Missing walletAddress');
    }

    // Validate XRPL address format
    if (!walletAddress.startsWith('r') || walletAddress.length < 25) {
      return errorResponse(400, 'Invalid XRPL wallet address');
    }

    // Check if broker already exists
    const { data: existingBroker } = await supabase
      .from('brokers')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    let broker = existingBroker;

    // Create broker if doesn't exist
    if (!existingBroker) {
      let referralCode = generateReferralCode();
      
      // Ensure referral code is unique
      let codeExists = true;
      while (codeExists) {
        const { data: existing } = await supabase
          .from('brokers')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
        
        if (!existing) {
          codeExists = false;
        } else {
          referralCode = generateReferralCode();
        }
      }

      const { data: newBroker, error: brokerError } = await supabase
        .from('brokers')
        .insert({
          wallet_address: walletAddress,
          referral_code: referralCode,
          tier_id: 1, // Bronze tier
          total_earnings: 0,
          referred_sellers_count: 0,
          total_sales_volume: 0,
        })
        .select()
        .single();

      if (brokerError) {
        safeLog('error', 'Broker creation error', { wallet: walletAddress.slice(0, 10) });
        return errorResponse(500, 'Failed to create broker');
      }

      broker = newBroker;
    }

    // Check referral cookie and create seller if needed
    const referralCookie = event.headers.cookie?.match(/lux_ref=([^;]+)/)?.[1];
    
    // Check if seller exists
    const { data: existingSeller } = await supabase
      .from('sellers')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (!existingSeller) {
      let referredBy = null;

      // If there's a referral cookie and it's not self-referral
      if (referralCookie && referralCookie !== broker.referral_code) {
        const { data: referringBroker } = await supabase
          .from('brokers')
          .select('id')
          .eq('referral_code', referralCookie)
          .single();

        if (referringBroker) {
          referredBy = referringBroker.id;
        }
      }

      const { error: sellerError } = await supabase
        .from('sellers')
        .insert({
          wallet_address: walletAddress,
          referred_by_broker_id: referredBy,
        });

      if (sellerError) {
        safeLog('error', 'Seller creation error', { wallet: walletAddress.slice(0, 10) });
      }

      // Update referring broker's seller count
      if (referredBy) {
        await supabase.rpc('increment_broker_sellers', {
          p_broker_id: referredBy
        });
      }
    }

    safeLog('info', 'Broker registered', { referralCode: broker.referral_code });
    return successResponse({
      success: true,
      broker: {
        id: broker.id,
        referral_code: broker.referral_code,
        tier_id: broker.tier_id,
      },
      message: 'Broker and seller registered successfully',
    });
  } catch (error) {
    safeLog('error', 'Registration error', { error: (error as Error).message });
    return errorResponse(500, 'Internal server error');
  }
};
