import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wallet-Address',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const walletAddress = event.headers['x-wallet-address'];

    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing wallet address header' }),
      };
    }

    // Fetch broker profile
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (brokerError || !broker) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Broker not found' }),
      };
    }

    // Fetch commission stats
    const { data: commissions } = await supabase
      .from('commissions')
      .select('sale_amount_usd, commission_usd')
      .eq('broker_id', broker.id);

    const stats = {
      total_sales_usd: commissions?.reduce((sum, c) => sum + (c.sale_amount_usd || 0), 0) || 0,
      total_commission_usd: commissions?.reduce((sum, c) => sum + (c.commission_usd || 0), 0) || 0,
      active_sellers: broker.referred_sellers_count || 0,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        broker,
        stats,
      }),
    };
  } catch (error) {
    console.error('Broker profile error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
