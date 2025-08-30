import { Handler } from '@netlify/functions';
import { settlementEngine } from '../../src/lib/settlement-engine';

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
    const { txHash } = event.queryStringParameters || {};

    if (!txHash) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Transaction hash required' }),
      };
    }

    const verification = await settlementEngine.verifyTransaction(txHash);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        verified: verification.verified,
        details: verification.details,
        error: verification.error,
      }),
    };

  } catch (error) {
    console.error('Error verifying transaction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to verify transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
