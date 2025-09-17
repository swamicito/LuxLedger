import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { window = 'all', limit = '100', offset = '0' } = req.query;
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

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
      return res.status(500).json({ error: error.message });
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
      .slice(offsetNum, offsetNum + limitNum)
      .map((broker, index) => ({
        rank: offsetNum + index + 1,
        referralCode: broker.referralCode,
        tierName: broker.tierName,
        tierColor: broker.tierColor,
        tierIcon: broker.tierIcon,
        totalCommission: broker.total,
        salesCount: broker.count,
        // Anonymize wallet for public display
        walletPreview: broker.wallet ? `${broker.wallet.slice(0, 6)}...${broker.wallet.slice(-4)}` : null
      }));

    return res.status(200).json({
      window,
      leaderboard,
      total: brokerMap.size,
      limit: limitNum,
      offset: offsetNum
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
