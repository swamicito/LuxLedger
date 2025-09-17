/**
 * LuxBroker Referral Tracking API
 * Tracks referral clicks and conversions
 */

import { Handler } from '@netlify/functions';
import { referralService } from '../../src/lib/supabase-client';

export const handler: Handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod === 'GET') {
    // Track referral click via query params
    const referralCode = event.queryStringParameters?.ref;
    
    if (!referralCode) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Referral code required' })
      };
    }

    try {
      const clientIP = event.headers['x-forwarded-for'] || 
                      event.headers['x-real-ip'] || 
                      'unknown';
      const userAgent = event.headers['user-agent'] || '';
      const referrer = event.headers['referer'] || '';

      // Track the click
      await referralService.trackClick(
        referralCode,
        clientIP,
        userAgent,
        referrer
      );

      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: pixel.toString('base64'),
        isBase64Encoded: true
      };

    } catch (error) {
      console.error('Referral tracking error:', error);
      
      // Still return pixel even on error
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'image/gif'
        },
        body: pixel.toString('base64'),
        isBase64Encoded: true
      };
    }
  }

  if (event.httpMethod === 'POST') {
    // Track referral conversion
    try {
      const body = JSON.parse(event.body || '{}');
      const { referralCode } = body;

      if (!referralCode) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Referral code required' })
        };
      }

      const clientIP = event.headers['x-forwarded-for'] || 
                      event.headers['x-real-ip'] || 
                      'unknown';

      // Mark as converted
      const { data, error } = await referralService.markConverted(referralCode, clientIP);

      if (error) {
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Failed to track conversion' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: true, data })
      };

    } catch (error) {
      console.error('Conversion tracking error:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
