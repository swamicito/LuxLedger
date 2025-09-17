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
    const url = new URL(event.rawUrl);
    const period = url.searchParams.get('period') || 'all';
    const limit = Number(url.searchParams.get('limit') || 20);
    const offset = Number(url.searchParams.get('offset') || 0);

    // Call enhanced leaderboard RPC
    const { data, error } = await supabase.rpc('broker_public_leaderboard', {
      period: period.toLowerCase(),
      limit_count: limit,
      offset_count: offset,
    });

    if (error) {
      console.error('Leaderboard RPC error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch leaderboard' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        period,
        limit,
        offset,
        items: data || [],
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
