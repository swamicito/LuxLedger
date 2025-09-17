import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const url = new URL(event.rawUrl || `https://example.com${event.path}`);
    const window = url.searchParams.get('window') || 'all'; // "week" | "month" | "all"
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let from = '1970-01-01';
    const now = new Date();
    
    if (window === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      from = d.toISOString();
    } else if (window === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      from = d.toISOString();
    }

    const { data, error } = await supabase
      .from('commissions')
      .select(`
        commission_usd,
        created_at,
        broker_id,
        brokers!inner(
          wallet_address,
          referral_code,
          tier_id,
          broker_tiers!inner(
            name,
            color,
            icon
          )
        )
      `)
      .gte('created_at', from)
      .order('commission_usd', { ascending: false });

    if (error) {
      console.error('Leaderboard query error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Aggregate totals per broker
    const brokerMap = new Map<string, {
      wallet: string;
      referralCode: string | null;
      tierName: string;
      tierColor: string;
      tierIcon: string;
      total: number;
      count: number;
    }>();

    for (const row of data || []) {
      const key = row.broker_id;
      const brokerData = (row as any).brokers;
      const tierData = brokerData.broker_tiers;
      
      const wallet = brokerData.wallet_address;
      const referralCode = brokerData.referral_code ?? null;
      const tierName = tierData.name;
      const tierColor = tierData.color;
      const tierIcon = tierData.icon;
      
      const prev = brokerMap.get(key) || {
        wallet,
        referralCode,
        tierName,
        tierColor,
        tierIcon,
        total: 0,
        count: 0
      };
      
      prev.total += Number(row.commission_usd || 0);
      prev.count += 1;
      brokerMap.set(key, prev);
    }

    const leaderboard = Array.from(brokerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(offset, offset + limit)
      .map((broker, index) => ({
        rank: offset + index + 1,
        referralCode: broker.referralCode,
        tierName: broker.tierName,
        tierColor: broker.tierColor,
        tierIcon: broker.tierIcon,
        totalCommission: broker.total,
        salesCount: broker.count,
        // Anonymize wallet for public display
        walletPreview: broker.wallet ? `${broker.wallet.slice(0, 6)}...${broker.wallet.slice(-4)}` : null
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        window,
        leaderboard,
        total: brokerMap.size,
        limit,
        offset
      }),
    };
  } catch (error) {
    console.error('Leaderboard error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
