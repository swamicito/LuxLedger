import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fee calculation based on category and payment method
function calculateFees(saleAmountUSD: number, category: string, payMethod: string, isAuction: boolean) {
  const baseFees: { [key: string]: number } = {
    jewelry: 0.08,
    cars: 0.06,
    real_estate: 0.04,
    art: 0.07,
    watches: 0.08,
    default: 0.05
  };

  let feeRate = baseFees[category] || baseFees.default;

  // Payment method adjustments
  if (payMethod === 'crypto') {
    feeRate *= 0.9; // 10% discount for crypto
  } else if (payMethod === 'fiat') {
    feeRate *= 1.1; // 10% surcharge for fiat
  }

  // Auction premium
  if (isAuction) {
    feeRate *= 1.2; // 20% auction premium
  }

  const platformFee = saleAmountUSD * feeRate;
  const brokerCommissionRate = parseFloat(process.env.LUXBROKER_COMMISSION_RATE || '0.30');
  const brokerCommission = platformFee * brokerCommissionRate;

  return {
    platformFee,
    brokerCommission,
    feeRate,
    brokerCommissionRate
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      sellerWallet, 
      saleAmountUSD, 
      category = 'default',
      payMethod = 'xrpl',
      auction = false,
      transactionHash 
    } = req.body;

    if (!sellerWallet || !saleAmountUSD) {
      return res.status(400).json({ error: 'Missing required fields: sellerWallet, saleAmountUSD' });
    }

    const saleAmount = parseFloat(saleAmountUSD);
    if (isNaN(saleAmount) || saleAmount <= 0) {
      return res.status(400).json({ error: 'Invalid sale amount' });
    }

    // Get seller info
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id, referred_by_broker_id')
      .eq('wallet_address', sellerWallet)
      .single();

    if (sellerError) {
      console.error('Seller lookup error:', sellerError);
      return res.status(404).json({ error: 'Seller not found' });
    }

    // If no broker referral, just return success without commission
    if (!seller.referred_by_broker_id) {
      return res.status(200).json({
        success: true,
        message: 'Sale recorded (no broker commission)',
        commission: 0
      });
    }

    // Calculate fees
    const fees = calculateFees(saleAmount, category, payMethod, auction);

    // Record commission
    const { data: commission, error: commissionError } = await supabase
      .from('commissions')
      .insert({
        broker_id: seller.referred_by_broker_id,
        seller_id: seller.id,
        sale_amount_usd: saleAmount,
        commission_usd: fees.brokerCommission,
        platform_fee_usd: fees.platformFee,
        commission_rate: fees.brokerCommissionRate,
        category,
        pay_method: payMethod,
        auction,
        transaction_hash: transactionHash,
        status: 'pending'
      })
      .select()
      .single();

    if (commissionError) {
      console.error('Commission recording error:', commissionError);
      return res.status(500).json({ error: 'Failed to record commission' });
    }

    // Update broker stats
    const { error: statsError } = await supabase.rpc('update_broker_stats', {
      p_broker_id: seller.referred_by_broker_id,
      p_commission_amount: fees.brokerCommission,
      p_sale_amount: saleAmount
    });

    if (statsError) {
      console.error('Failed to update broker stats:', statsError);
    }

    return res.status(200).json({
      success: true,
      commission: {
        id: commission.id,
        amount: fees.brokerCommission,
        platformFee: fees.platformFee,
        rate: fees.feeRate,
        brokerRate: fees.brokerCommissionRate
      },
      fees: {
        platformFeeUSD: fees.platformFee,
        brokerCommissionUSD: fees.brokerCommission,
        totalFeeRate: fees.feeRate,
        brokerCommissionRate: fees.brokerCommissionRate
      }
    });

  } catch (error) {
    console.error('Sale recording error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
