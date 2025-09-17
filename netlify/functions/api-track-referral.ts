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
    const { referralCode, userAgent, timestamp } = JSON.parse(event.body || '{}');

    if (!referralCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing referralCode' }),
      };
    }

    // Get client IP from headers
    const clientIP = event.headers['x-forwarded-for'] || 
                    event.headers['x-real-ip'] || 
                    context.clientContext?.identity?.url || 
                    'unknown';

    // Verify referral code exists
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    if (!broker) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Invalid referral code' }),
      };
    }

    // Record the referral click
    const { error: insertError } = await supabase
      .from('referral_clicks')
      .insert({
        referral_code: referralCode,
        broker_id: broker.id,
        ip_address: clientIP,
        user_agent: userAgent || '',
        clicked_at: timestamp || new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to insert referral click:', insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to track referral' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Referral tracked successfully' }),
    };
  } catch (error) {
    console.error('Referral tracking error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
