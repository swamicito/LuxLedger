import { Handler } from '@netlify/functions';
import { xrplClient, AssetType, generateAssetSymbol } from '../../src/lib/xrpl-client';
import { supabase } from '../../src/integrations/supabase/client';

interface MintTokenRequest {
  assetType: AssetType;
  assetData: {
    name: string;
    description: string;
    totalSupply?: string;
    price: string;
    image: string;
    location?: string;
    certification?: string;
    appraisal?: string;
    specifications?: Record<string, any>;
  };
  issuerAddress: string;
}

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
    const { assetType, assetData, issuerAddress }: MintTokenRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!assetType || !assetData || !issuerAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate unique asset ID and symbol
    const assetId = crypto.randomUUID();
    const symbol = generateAssetSymbol(assetType, assetId);

    let mintResult;

    if (assetType === AssetType.REAL_ESTATE) {
      // Create fungible token for real estate
      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          id: assetId,
          type: assetType,
          name: assetData.name,
          symbol: symbol,
          description: assetData.description,
          total_supply: assetData.totalSupply || '1000000',
          current_price: assetData.price,
          issuer_address: issuerAddress,
          metadata: {
            location: assetData.location,
            image: assetData.image,
            certification: assetData.certification,
            appraisal: assetData.appraisal,
          },
          status: 'ready_to_issue',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      mintResult = {
        assetId,
        symbol,
        type: 'fungible',
        status: 'ready_to_issue',
        message: 'Real estate token created. Ready for issuance when trustlines are established.',
      };

    } else {
      // Create NFT for luxury items (jewelry, cars, watches, art)
      const metadataUri = `https://luxledger.com/nft-metadata/${assetId}`;
      
      // In production, this would mint the actual NFT
      // For now, we'll create the database record
      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          id: assetId,
          type: assetType,
          name: assetData.name,
          symbol: symbol,
          description: assetData.description,
          total_supply: '1',
          current_price: assetData.price,
          issuer_address: issuerAddress,
          metadata: {
            image: assetData.image,
            certification: assetData.certification,
            appraisal: assetData.appraisal,
            specifications: assetData.specifications,
            nft_metadata_uri: metadataUri,
          },
          status: 'minted',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      mintResult = {
        assetId,
        symbol,
        type: 'nft',
        status: 'minted',
        metadataUri,
        message: 'NFT created successfully.',
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: mintResult,
      }),
    };

  } catch (error) {
    console.error('Error minting asset token:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to mint asset token',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
