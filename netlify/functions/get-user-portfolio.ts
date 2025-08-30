import { Handler } from '@netlify/functions';
import { assetManager } from '../../src/lib/asset-manager';
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
    const { userAddress } = event.queryStringParameters || {};

    if (!userAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User address required' }),
      };
    }

    // Get user's asset holdings
    const holdings = await assetManager.getUserAssetHoldings(userAddress);
    
    // Get user's transaction history
    const transactions = await settlementEngine.getUserTransactionHistory(userAddress);

    // Calculate portfolio value
    let totalValue = 0;
    const portfolioBreakdown = {
      realEstate: 0,
      jewelry: 0,
      exoticCars: 0,
      watches: 0,
      art: 0,
    };

    holdings.forEach(holding => {
      const value = parseFloat(holding.asset.currentPrice) * 
        (holding.type === 'nft' ? 1 : parseFloat(holding.balance));
      totalValue += value;

      // Add to breakdown
      switch (holding.asset.type) {
        case 'REAL_ESTATE':
          portfolioBreakdown.realEstate += value;
          break;
        case 'JEWELRY':
          portfolioBreakdown.jewelry += value;
          break;
        case 'EXOTIC_CAR':
          portfolioBreakdown.exoticCars += value;
          break;
        case 'WATCH':
          portfolioBreakdown.watches += value;
          break;
        case 'ART':
          portfolioBreakdown.art += value;
          break;
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          userAddress,
          totalValue,
          portfolioBreakdown,
          holdings,
          recentTransactions: transactions.slice(0, 10), // Last 10 transactions
          totalTransactions: transactions.length,
        },
      }),
    };

  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch user portfolio',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
