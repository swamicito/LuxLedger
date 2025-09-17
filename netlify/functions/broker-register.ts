/**
 * LuxBroker Registration API
 * Registers new affiliate brokers with unique referral codes
 */

import { Handler } from '@netlify/functions';
import { brokerService } from '../../src/lib/supabase-client';
import { ReferralCodeGenerator } from '../../src/lib/luxbroker/referral-generator';

export const handler: Handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-wallet, x-auth-token',
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
    const body = JSON.parse(event.body || '{}');
    const { walletAddress, email, name, preferredCode } = body;

    // Validate required fields
    if (!walletAddress) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Wallet address is required' })
      };
    }

    // Validate XRPL address format
    if (!walletAddress.startsWith('r') || walletAddress.length < 25) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid XRPL wallet address format' })
      };
    }

    // Check if broker already exists
    const { data: existingBroker } = await brokerService.getByWallet(walletAddress);
    if (existingBroker) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Broker already registered',
          referralCode: existingBroker.referral_code
        })
      };
    }

    // Generate unique referral code
    let referralCode = preferredCode;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      if (!referralCode || attempts > 0) {
        referralCode = ReferralCodeGenerator.generate({
          type: 'memorable'
        });
      }

      // Check if code is already taken
      const { data: existingCode } = await brokerService.getByReferralCode(referralCode);
      if (!existingCode) {
        break; // Code is available
      }

      referralCode = null;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Unable to generate unique referral code' })
      };
    }

    // Register the broker
    const { data: broker, error } = await brokerService.register(
      walletAddress,
      referralCode!,
      email,
      name
    );

    if (error) {
      console.error('Broker registration error:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to register broker',
          details: error.message
        })
      };
    }

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        broker: {
          id: broker.id,
          walletAddress: broker.wallet_address,
          referralCode: broker.referral_code,
          tier: broker.tier,
          commissionRate: broker.commission_rate,
          status: broker.status
        },
        referralUrls: {
          listing: `${process.env.NEXT_PUBLIC_APP_URL || 'https://luxledger.app'}/list?ref=${broker.referral_code}`,
          marketplace: `${process.env.NEXT_PUBLIC_APP_URL || 'https://luxledger.app'}/marketplace?ref=${broker.referral_code}`,
          short: `${process.env.NEXT_PUBLIC_APP_URL || 'https://luxledger.app'}/r/${broker.referral_code}`
        }
      })
    };

  } catch (error) {
    console.error('Broker registration error:', error);
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
