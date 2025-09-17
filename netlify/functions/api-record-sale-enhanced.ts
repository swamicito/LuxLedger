import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { quoteFees } from '../../src/api/fees';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configurable broker commission rate (default 30% of platform fee)
const BROKER_COMMISSION_RATE = Number(process.env.LUXBROKER_COMMISSION_RATE || '0.30');

export const handler: Handler = async (event, context) => {
  // CORS headers
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
    const { 
      sellerWallet, 
      amountUSD, 
      category = 'cars', 
      payMethod = 'crypto', 
      auction = false,
      brokerReferralCode 
    } = JSON.parse(event.body || '{}');

    if (!sellerWallet || !amountUSD) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing sellerWallet or amountUSD' }),
      };
    }

    // 1) Calculate platform fee using full fees engine
    const quote = quoteFees({
      category,
      priceUSD: Number(amountUSD),
      payMethod,
      auction: Boolean(auction),
    });

    const platformFeeUSD = quote.platformFeeUSD;

    // 2) Find the seller and their referring broker
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id, referred_by_broker_id')
      .eq('wallet_address', sellerWallet)
      .single();

    if (sellerError || !seller) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Seller not found' }),
      };
    }

    let brokerId = seller.referred_by_broker_id;

    // If broker referral code provided, use that instead
    if (brokerReferralCode) {
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('referral_code', brokerReferralCode)
        .single();
      
      if (broker) {
        brokerId = broker.id;
      }
    }

    // 3) Calculate broker commission (percentage of platform fee)
    const commissionUSD = brokerId ? +(platformFeeUSD * BROKER_COMMISSION_RATE).toFixed(2) : 0;

    // 4) Record the commission
    if (brokerId && commissionUSD > 0) {
      const { error: commissionError } = await supabase
        .from('commissions')
        .insert({
          broker_id: brokerId,
          seller_id: seller.id,
          sale_amount_usd: Number(amountUSD),
          commission_usd: commissionUSD,
          platform_fee_usd: platformFeeUSD,
          commission_rate: BROKER_COMMISSION_RATE,
          category,
          pay_method: payMethod,
          auction: Boolean(auction),
        });

      if (commissionError) {
        console.error('Commission insert error:', commissionError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to record commission' }),
        };
      }

      // 5) Update broker stats
      const { error: updateError } = await supabase.rpc('update_broker_stats', {
        p_broker_id: brokerId,
        p_commission_amount: commissionUSD,
        p_sale_amount: Number(amountUSD),
      });

      if (updateError) {
        console.error('Broker stats update error:', updateError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sellerId: seller.id,
        brokerId,
        saleAmountUSD: Number(amountUSD),
        platformFeeUSD,
        commissionUSD,
        commissionRate: BROKER_COMMISSION_RATE,
        feeBreakdown: {
          buyerFeeUSD: quote.buyerFeeUSD,
          sellerFeeUSD: quote.sellerFeeUSD,
          platformFeeUSD: quote.platformFeeUSD,
          notes: quote.notes,
        },
      }),
    };
  } catch (error) {
    console.error('Sale recording error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
