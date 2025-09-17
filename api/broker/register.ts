import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
    const { kind, wallet, ref } = req.body;

    if (!kind || !wallet) {
      return res.status(400).json({ error: 'Missing required fields: kind, wallet' });
    }

    if (!wallet.startsWith('r') || wallet.length < 25) {
      return res.status(400).json({ error: 'Invalid XRPL wallet address' });
    }

    if (kind === 'broker') {
      // Register broker
      let referralCode = ref || generateReferralCode();
      let attempts = 0;
      
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('brokers')
          .select('id')
          .eq('referral_code', referralCode)
          .single();

        if (!existing) break;
        
        referralCode = generateReferralCode();
        attempts++;
      }

      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate unique referral code' });
      }

      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .upsert({
          wallet_address: wallet,
          referral_code: referralCode,
        }, {
          onConflict: 'wallet_address',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (brokerError) {
        console.error('Broker registration error:', brokerError);
        return res.status(500).json({ error: 'Failed to register broker' });
      }

      return res.status(200).json({
        success: true,
        broker: {
          id: broker.id,
          wallet_address: broker.wallet_address,
          referral_code: broker.referral_code,
        }
      });

    } else if (kind === 'seller') {
      // Register seller with optional referral attribution
      let referredByBrokerId = null;

      if (ref) {
        const { data: broker } = await supabase
          .from('brokers')
          .select('id')
          .eq('referral_code', ref)
          .single();

        if (broker) {
          referredByBrokerId = broker.id;
        }
      }

      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .upsert({
          wallet_address: wallet,
          referred_by_broker_id: referredByBrokerId,
        }, {
          onConflict: 'wallet_address',
          ignoreDuplicates: true
        })
        .select()
        .single();

      if (sellerError) {
        console.error('Seller registration error:', sellerError);
        return res.status(500).json({ error: 'Failed to register seller' });
      }

      // Update broker seller count if this is a new referral
      if (referredByBrokerId && seller) {
        const { error: updateError } = await supabase.rpc('increment_broker_sellers', {
          p_broker_id: referredByBrokerId
        });

        if (updateError) {
          console.error('Failed to update broker seller count:', updateError);
        }
      }

      return res.status(200).json({
        success: true,
        seller: {
          id: seller.id,
          wallet_address: seller.wallet_address,
          referred_by_broker_id: seller.referred_by_broker_id,
        }
      });

    } else {
      return res.status(400).json({ error: 'Invalid kind. Must be "broker" or "seller"' });
    }

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
