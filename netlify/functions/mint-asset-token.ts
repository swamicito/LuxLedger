import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { xrplClient, AssetType, generateAssetSymbol } from '../../src/lib/xrpl-client';
import {
  verifyWalletAuth,
  requireAdmin,
  checkRateLimit,
  safeLog,
  CORS_HEADERS,
  errorResponse,
  successResponse,
} from '../../src/lib/security';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  // Rate limit: sensitive operation
  const clientIP = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const rateCheck = checkRateLimit(clientIP, 'sensitive');
  if (!rateCheck.allowed) {
    return errorResponse(429, 'Too many requests', rateCheck.retryAfter);
  }

  // SECURITY: Minting tokens requires admin privileges
  const walletAddress = event.headers['x-wallet-address'];
  const authResult = await verifyWalletAuth(walletAddress, undefined, undefined, supabase);
  
  if (!authResult.success) {
    return errorResponse(authResult.statusCode, authResult.error || 'Authentication failed');
  }

  const roleCheck = requireAdmin(authResult.context);
  if (!roleCheck.success) {
    safeLog('warn', 'Unauthorized mint attempt', { wallet: walletAddress?.slice(0, 10) });
    return errorResponse(roleCheck.statusCode, roleCheck.error || 'Admin access required');
  }

  try {
    const { assetType, assetData, issuerAddress }: MintTokenRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!assetType || !assetData || !issuerAddress) {
      return errorResponse(400, 'Missing required fields');
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

    safeLog('info', 'Asset token minted', { assetId: mintResult.assetId, type: mintResult.type });
    return successResponse({ success: true, data: mintResult });

  } catch (error) {
    safeLog('error', 'Error minting asset token', { error: (error as Error).message });
    return errorResponse(500, 'Failed to mint asset token');
  }
};
