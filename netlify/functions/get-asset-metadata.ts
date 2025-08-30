import { Handler } from '@netlify/functions';
import { assetManager } from '../../src/lib/asset-manager';
import { supabase } from '../../src/integrations/supabase/client';

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
    const { assetId, type } = event.queryStringParameters || {};

    if (assetId) {
      // Get specific asset by ID
      const asset = await assetManager.getAssetById(assetId);
      
      if (!asset) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Asset not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: asset,
        }),
      };

    } else if (type) {
      // Get assets by type
      const assets = await assetManager.getAssetsByType(type as any);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: assets,
        }),
      };

    } else {
      // Get all assets
      const assets = await assetManager.getAllAssets();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: assets,
        }),
      };
    }

  } catch (error) {
    console.error('Error fetching asset metadata:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch asset metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
