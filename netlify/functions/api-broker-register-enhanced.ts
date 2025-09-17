import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { walletAddress } = JSON.parse(event.body || '{}');

    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing walletAddress' }),
      };
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
        console.error('Broker creation error:', brokerError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create broker' }),
        };
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
        console.error('Seller creation error:', sellerError);
      }

      // Update referring broker's seller count
      if (referredBy) {
        await supabase.rpc('increment_broker_sellers', {
          p_broker_id: referredBy
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        broker,
        message: 'Broker and seller registered successfully',
      }),
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
