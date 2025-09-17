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
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({ error: 'Missing wallet address' });
    }

    // Get broker profile with tier info
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select(`
        *,
        broker_tiers!inner(
          name,
          color,
          icon,
          commission_rate,
          benefits
        )
      `)
      .eq('wallet_address', wallet)
      .single();

    if (brokerError) {
      console.error('Broker query error:', brokerError);
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Get commission stats
    const { data: commissions, error: commissionsError } = await supabase
      .from('commissions')
      .select('commission_usd, created_at, sale_amount_usd')
      .eq('broker_id', broker.id)
      .order('created_at', { ascending: false });

    if (commissionsError) {
      console.error('Commissions query error:', commissionsError);
      return res.status(500).json({ error: 'Failed to fetch commission data' });
    }

    // Calculate stats
    const totalEarnings = commissions?.reduce((sum, c) => sum + Number(c.commission_usd || 0), 0) || 0;
    const totalSales = commissions?.reduce((sum, c) => sum + Number(c.sale_amount_usd || 0), 0) || 0;
    const salesCount = commissions?.length || 0;

    // Recent commissions (last 10)
    const recentCommissions = commissions?.slice(0, 10).map(c => ({
      amount: Number(c.commission_usd || 0),
      saleAmount: Number(c.sale_amount_usd || 0),
      date: c.created_at
    })) || [];

    const tierData = (broker as any).broker_tiers;

    return res.status(200).json({
      success: true,
      broker: {
        id: broker.id,
        walletAddress: broker.wallet_address,
        referralCode: broker.referral_code,
        totalEarnings,
        totalSales,
        salesCount,
        referredSellers: broker.referred_sellers_count || 0,
        tier: {
          name: tierData.name,
          color: tierData.color,
          icon: tierData.icon,
          commissionRate: tierData.commission_rate,
          benefits: tierData.benefits
        },
        recentCommissions,
        createdAt: broker.created_at
      }
    });

  } catch (error) {
    console.error('Broker profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
