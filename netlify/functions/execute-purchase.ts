import { Handler } from '@netlify/functions';
import { settlementEngine } from '../../src/lib/settlement-engine';
import { supabase } from '../../src/integrations/supabase/client';

interface PurchaseRequest {
  assetId: string;
  buyerAddress: string;
  sellerAddress?: string;
  amount: string;
  price: string;
  assetType: 'fungible' | 'nft';
  nftTokenId?: string;
}

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
    const { assetId, buyerAddress, sellerAddress, amount, price, assetType, nftTokenId }: PurchaseRequest = 
      JSON.parse(event.body || '{}');

    // Validate required fields
    if (!assetId || !buyerAddress || !amount || !price || !assetType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    let result;

    if (assetType === 'fungible') {
      // Execute fungible token purchase
      result = await settlementEngine.executeFungibleTokenPurchase(
        buyerAddress,
        sellerAddress || 'issuer',
        assetId,
        amount,
        price
      );
    } else if (assetType === 'nft') {
      // Execute NFT purchase
      if (!nftTokenId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'NFT token ID required for NFT purchases' }),
        };
      }

      result = await settlementEngine.executeNFTPurchase(
        buyerAddress,
        sellerAddress || 'issuer',
        assetId,
        nftTokenId,
        price
      );
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid asset type' }),
      };
    }

    if (result.success) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          transactionHash: result.transactionHash,
          message: 'Purchase executed successfully',
        }),
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: result.error,
        }),
      };
    }

  } catch (error) {
    console.error('Error executing purchase:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to execute purchase',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
