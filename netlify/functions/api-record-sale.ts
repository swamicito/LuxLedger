/**
 * POST /api/broker/record-sale
 * Logs a sale + commission between a seller and broker
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { payCommissions } from '../../src/lib/luxbroker/xrpl-commission';
import { TierSystem, createTierUpgradeNotification } from '../../src/lib/luxbroker/tier-system';
import { safeLog } from '../../src/lib/security';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { wallet_address, sale_amount_usd, sale_id } = JSON.parse(event.body || '{}');

    if (!wallet_address || !sale_amount_usd) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing wallet_address or sale_amount_usd' })
      };
    }

    // Get seller and their broker relationship
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select(`
        id, 
        referred_by,
        brokers!sellers_referred_by_fkey (
          id,
          wallet_address,
          commission_rate,
          referral_code
        )
      `)
      .eq('wallet_address', wallet_address)
      .single();

    if (sellerError || !seller) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Seller not found' })
      };
    }

    // If no broker referral, just update seller stats
    if (!seller.referred_by || !seller.brokers) {
      // Update seller stats
      await supabase
        .from('sellers')
        .update({
          total_sales: supabase.raw(`total_sales + ${sale_amount_usd}`),
          items_sold: supabase.raw('items_sold + 1')
        })
        .eq('id', seller.id);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          commission: 0,
          message: 'Sale recorded without broker commission'
        })
      };
    }

    const broker = Array.isArray(seller.brokers) ? seller.brokers[0] : seller.brokers;
    const commission_rate = broker.commission_rate || 0.10; // Default 10%
    const commission_usd = sale_amount_usd * commission_rate;

    // Insert commission record
    const { data: commissionData, error: insertError } = await supabase
      .from('commissions')
      .insert({
        broker_id: broker.id,
        seller_id: seller.id,
        sale_id: sale_id || `sale_${Date.now()}`,
        sale_amount_usd,
        commission_amount_usd: commission_usd,
        commission_rate,
        broker_wallet: broker.wallet_address,
        seller_wallet: wallet_address,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: insertError.message })
      };
    }

    // Update seller stats
    await supabase
      .from('sellers')
      .update({
        total_sales: supabase.raw(`total_sales + ${sale_amount_usd}`),
        items_sold: supabase.raw('items_sold + 1')
      })
      .eq('id', seller.id);

    // Update broker stats (will trigger tier upgrade if needed)
    await supabase
      .from('brokers')
      .update({
        total_sales_volume: supabase.raw(`total_sales_volume + ${sale_amount_usd}`)
      })
      .eq('id', broker.id);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        commission: commission_usd,
        commission_rate,
        broker_referral_code: broker.referral_code,
        commission_id: commissionData.id,
        message: `Sale recorded with ${(commission_rate * 100).toFixed(1)}% commission to broker ${broker.referral_code}`
      })
    };

  } catch (error) {
    safeLog('error', 'Record sale error', { error: (error as Error).message });
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: (error as Error).message
      })
    };
  }
};
