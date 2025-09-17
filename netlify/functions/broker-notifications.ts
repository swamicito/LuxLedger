import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { notificationService, handleCommissionWebhook, handleTierUpgradeWebhook } from '../../src/lib/luxbroker/notifications';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event, context) => {
  // CORS headers
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
    const { type, data } = JSON.parse(event.body || '{}');

    switch (type) {
      case 'commission_earned':
        await handleCommissionEarned(data);
        break;
      case 'tier_upgrade':
        await handleTierUpgrade(data);
        break;
      case 'test_notification':
        await handleTestNotification(data);
        break;
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid notification type' }),
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Notification sent' }),
    };
  } catch (error) {
    console.error('Notification error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send notification' }),
    };
  }
};

async function handleCommissionEarned(data: any) {
  const { brokerId, brokerWallet, commissionAmount, saleAmount, sellerWallet, itemName, transactionHash } = data;

  // Fetch broker details for personalized notification
  const { data: broker } = await supabase
    .from('brokers')
    .select('*')
    .eq('id', brokerId)
    .single();

  if (!broker) {
    throw new Error('Broker not found');
  }

  await handleCommissionWebhook(brokerId, {
    brokerWallet,
    commissionAmount,
    saleAmount,
    sellerWallet,
    itemName,
    transactionHash,
    timestamp: new Date().toISOString(),
  });

  // Log notification in database
  await supabase.from('broker_notifications').insert({
    broker_id: brokerId,
    type: 'commission_earned',
    title: 'Commission Earned',
    message: `You earned $${commissionAmount.toLocaleString()} commission from a $${saleAmount.toLocaleString()} sale`,
    data: { commissionAmount, saleAmount, itemName, transactionHash },
    sent_at: new Date().toISOString(),
  });
}

async function handleTierUpgrade(data: any) {
  const { brokerId, brokerWallet, oldTier, newTier, newCommissionRate } = data;

  await handleTierUpgradeWebhook(brokerId, {
    brokerWallet,
    oldTier,
    newTier,
    newCommissionRate,
    timestamp: new Date().toISOString(),
  });

  // Log notification in database
  await supabase.from('broker_notifications').insert({
    broker_id: brokerId,
    type: 'tier_upgrade',
    title: 'Tier Upgrade',
    message: `Congratulations! You've been upgraded from ${oldTier} to ${newTier}`,
    data: { oldTier, newTier, newCommissionRate },
    sent_at: new Date().toISOString(),
  });
}

async function handleTestNotification(data: any) {
  const { brokerWallet } = data;

  await notificationService.sendCommissionNotification({
    brokerId: 'test-broker-id',
    brokerWallet,
    commissionAmount: 150.00,
    saleAmount: 1500.00,
    sellerWallet: 'rTestSeller123...',
    itemName: 'Test Luxury Watch',
    transactionHash: 'test-tx-hash-123',
    timestamp: new Date().toISOString(),
  });
}
