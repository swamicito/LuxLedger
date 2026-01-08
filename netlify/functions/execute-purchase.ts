import { Handler } from '@netlify/functions';
import { settlementEngine } from '../../src/lib/settlement-engine';
import {
  checkRateLimit,
  getClientIdentifier,
  safeLog,
  CORS_HEADERS,
  errorResponse,
  successResponse,
} from '../../src/lib/security';

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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  // Rate limit: sensitive write operation
  const clientId = getClientIdentifier(event);
  const rateCheck = checkRateLimit(clientId, 'sensitive');
  if (!rateCheck.allowed) {
    return errorResponse(429, 'Too many purchase requests', rateCheck.retryAfter);
  }

  try {
    const { assetId, buyerAddress, sellerAddress, amount, price, assetType, nftTokenId }: PurchaseRequest = 
      JSON.parse(event.body || '{}');

    // Validate required fields
    if (!assetId || !buyerAddress || !amount || !price || !assetType) {
      return errorResponse(400, 'Missing required fields');
    }

    // Validate wallet authentication
    const walletHeader = event.headers['x-wallet-address'] || event.headers['x-wallet'];
    if (!walletHeader) {
      return errorResponse(401, 'Missing wallet authentication');
    }

    // Verify the caller is the buyer
    if (walletHeader !== buyerAddress) {
      safeLog('warn', 'Purchase: wallet mismatch', { header: walletHeader.slice(0, 10) });
      return errorResponse(403, 'Wallet address does not match buyer address');
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
        return errorResponse(400, 'NFT token ID required for NFT purchases');
      }

      result = await settlementEngine.executeNFTPurchase(
        buyerAddress,
        sellerAddress || 'issuer',
        assetId,
        nftTokenId,
        price
      );
    } else {
      return errorResponse(400, 'Invalid asset type');
    }

    if (result.success) {
      safeLog('info', 'Purchase executed', { assetId, assetType, txHash: result.transactionHash });
      return successResponse({
        success: true,
        transactionHash: result.transactionHash,
        message: 'Purchase executed successfully',
      });
    } else {
      safeLog('error', 'Purchase failed', { assetId, error: result.error });
      return errorResponse(400, result.error || 'Purchase failed');
    }

  } catch (error) {
    safeLog('error', 'Error executing purchase', { error: (error as Error).message });
    return errorResponse(500, 'Failed to execute purchase');
  }
};
