/**
 * POST /api/broker/register
 * Registers a seller and links them to a broker (via referral cookie)
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { supabase } from '../../src/lib/supabase-client';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
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
    const { wallet_address } = JSON.parse(event.body || '{}');

    if (!wallet_address) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing wallet address' })
      };
    }

    // Extract referral code from cookies
    let referral_code: string | null = null;
    const cookies = event.headers.cookie;
    
    if (cookies) {
      const cookieMatch = cookies.match(/ref=([^;]+)/);
      if (cookieMatch) {
        referral_code = decodeURIComponent(cookieMatch[1]);
      }
    }

    let brokerId = null;
    if (referral_code) {
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('referral_code', referral_code)
        .single();
      brokerId = broker?.id;
    }

    // Check if seller already exists
    const { data: existingSeller } = await supabase
      .from('sellers')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    if (existingSeller) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          seller: existingSeller,
          message: 'Seller already registered'
        })
      };
    }

    const { data, error } = await supabase
      .from('sellers')
      .insert({
        wallet_address,
        referred_by: referral_code,
        referral_locked_until: referral_code ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null
      })
      .select()
      .single();

    if (error) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: error.message })
      };
    }

    // Update broker's referred sellers count if applicable
    if (brokerId) {
      await supabase
        .from('brokers')
        .update({ 
          referred_sellers_count: supabase.raw('referred_sellers_count + 1')
        })
        .eq('id', brokerId);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        seller: data,
        referredBy: referral_code,
        message: referral_code ? `Registered with referral ${referral_code}` : 'Registered successfully'
      })
    };

  } catch (error) {
    console.error('Seller registration error:', error);
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
