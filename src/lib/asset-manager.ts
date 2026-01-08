/* eslint-disable @typescript-eslint/no-explicit-any */
import { xrplClient, AssetType, AssetToken, generateAssetSymbol } from './xrpl-client';
import { supabase } from '@/lib/supabase-client';

// Asset Management Service
export class AssetManager {
  
  // Create new asset token (Real Estate - Fungible Token)
  async createRealEstateToken(
    assetData: {
      name: string;
      description: string;
      location: string;
      totalValue: string;
      totalSupply: string;
      image: string;
      certification?: string;
      appraisal?: string;
    },
    issuerSeed: string
  ): Promise<AssetToken> {
    try {
      // Generate unique asset ID and symbol
      const assetId = crypto.randomUUID();
      const symbol = generateAssetSymbol(AssetType.REAL_ESTATE, assetId);
      
      // Store asset metadata in Supabase
      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          id: assetId,
          type: AssetType.REAL_ESTATE,
          name: assetData.name,
          symbol: symbol,
          description: assetData.description,
          total_supply: assetData.totalSupply,
          current_price: assetData.totalValue,
          metadata: {
            location: assetData.location,
            image: assetData.image,
            certification: assetData.certification,
            appraisal: assetData.appraisal,
          },
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create the asset token on XRPL (this would be done by the issuer)
      // For now, we'll store the issuer info for later token issuance
      await supabase
        .from('asset_issuers')
        .insert({
          asset_id: assetId,
          issuer_address: 'placeholder', // Will be set when issuer connects wallet
          token_currency: symbol,
          status: 'ready_to_issue'
        });

      return {
        id: assetId,
        type: AssetType.REAL_ESTATE,
        name: assetData.name,
        symbol: symbol,
        issuer: 'pending',
        totalSupply: assetData.totalSupply,
        currentPrice: assetData.totalValue,
        metadata: {
          description: assetData.description,
          image: assetData.image,
          location: assetData.location,
          certification: assetData.certification,
          appraisal: assetData.appraisal,
        }
      };

    } catch (error) {
      console.error('Error creating real estate token:', error);
      throw new Error('Failed to create real estate token');
    }
  }

  // Create NFT for luxury items (Jewelry, Cars, Watches)
  async createLuxuryNFT(
    assetData: {
      name: string;
      description: string;
      type: AssetType.JEWELRY | AssetType.EXOTIC_CAR | AssetType.WATCH | AssetType.ART;
      price: string;
      image: string;
      certification?: string;
      appraisal?: string;
      specifications?: Record<string, any>;
    },
    minterSeed: string
  ): Promise<AssetToken> {
    try {
      const assetId = crypto.randomUUID();
      const symbol = generateAssetSymbol(assetData.type, assetId);

      // Create metadata URI for NFT
      const metadataUri = `https://luxledger.com/nft-metadata/${assetId}`;

      // Mint NFT on XRPL
      const mintTxHash = await xrplClient.mintNFT(
        minterSeed,
        parseInt(assetId.replace(/-/g, '').slice(0, 8), 16), // Convert to taxon
        metadataUri,
        8 // tfTransferable flag
      );

      // Store asset metadata in Supabase
      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          id: assetId,
          type: assetData.type,
          name: assetData.name,
          symbol: symbol,
          description: assetData.description,
          total_supply: '1', // NFTs have supply of 1
          current_price: assetData.price,
          metadata: {
            image: assetData.image,
            certification: assetData.certification,
            appraisal: assetData.appraisal,
            specifications: assetData.specifications,
            nft_metadata_uri: metadataUri,
          },
          status: 'minted',
          mint_tx_hash: mintTxHash,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: assetId,
        type: assetData.type,
        name: assetData.name,
        symbol: symbol,
        issuer: 'minted',
        totalSupply: '1',
        currentPrice: assetData.price,
        metadata: {
          description: assetData.description,
          image: assetData.image,
          certification: assetData.certification,
          appraisal: assetData.appraisal,
        }
      };

    } catch (error) {
      console.error('Error creating luxury NFT:', error);
      throw new Error('Failed to create luxury NFT');
    }
  }

  // Get all assets
  async getAllAssets(): Promise<AssetToken[]> {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return assets.map(asset => ({
        id: asset.id,
        type: asset.type as AssetType,
        name: asset.name,
        symbol: asset.symbol,
        issuer: asset.issuer_address || 'pending',
        totalSupply: asset.total_supply,
        currentPrice: asset.current_price,
        metadata: {
          description: asset.description,
          image: asset.metadata?.image || '',
          location: asset.metadata?.location,
          certification: asset.metadata?.certification,
          appraisal: asset.metadata?.appraisal,
        }
      }));

    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  }

  // Get asset by ID
  async getAssetById(assetId: string): Promise<AssetToken | null> {
    try {
      const { data: asset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;

      return {
        id: asset.id,
        type: asset.type as AssetType,
        name: asset.name,
        symbol: asset.symbol,
        issuer: asset.issuer_address || 'pending',
        totalSupply: asset.total_supply,
        currentPrice: asset.current_price,
        metadata: {
          description: asset.description,
          image: asset.metadata?.image || '',
          location: asset.metadata?.location,
          certification: asset.metadata?.certification,
          appraisal: asset.metadata?.appraisal,
        }
      };

    } catch (error) {
      console.error('Error fetching asset:', error);
      return null;
    }
  }

  // Get assets by type
  async getAssetsByType(type: AssetType): Promise<AssetToken[]> {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return assets.map(asset => ({
        id: asset.id,
        type: asset.type as AssetType,
        name: asset.name,
        symbol: asset.symbol,
        issuer: asset.issuer_address || 'pending',
        totalSupply: asset.total_supply,
        currentPrice: asset.current_price,
        metadata: {
          description: asset.description,
          image: asset.metadata?.image || '',
          location: asset.metadata?.location,
          certification: asset.metadata?.certification,
          appraisal: asset.metadata?.appraisal,
        }
      }));

    } catch (error) {
      console.error('Error fetching assets by type:', error);
      return [];
    }
  }

  // Create buy order for asset
  async createBuyOrder(
    assetId: string,
    buyerAddress: string,
    amount: string,
    price: string
  ): Promise<string> {
    try {
      const { data: order, error } = await supabase
        .from('asset_orders')
        .insert({
          asset_id: assetId,
          buyer_address: buyerAddress,
          order_type: 'buy',
          amount: amount,
          price: price,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return order.id;

    } catch (error) {
      console.error('Error creating buy order:', error);
      throw new Error('Failed to create buy order');
    }
  }

  // Create sell order for asset
  async createSellOrder(
    assetId: string,
    sellerAddress: string,
    amount: string,
    price: string
  ): Promise<string> {
    try {
      const { data: order, error } = await supabase
        .from('asset_orders')
        .insert({
          asset_id: assetId,
          seller_address: sellerAddress,
          order_type: 'sell',
          amount: amount,
          price: price,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return order.id;

    } catch (error) {
      console.error('Error creating sell order:', error);
      throw new Error('Failed to create sell order');
    }
  }

  // Get user's asset holdings
  async getUserAssetHoldings(userAddress: string): Promise<any[]> {
    try {
      // Get from XRPL trustlines and NFTs
      const trustlines = await xrplClient.getAccountTrustlines(userAddress);
      const nfts = await xrplClient.getAccountNFTs(userAddress);

      // Combine and format holdings
      const holdings = [];

      // Add fungible token holdings
      for (const trustline of trustlines) {
        if (trustline.balance && parseFloat(trustline.balance) > 0) {
          const asset = await this.getAssetBySymbol(trustline.currency);
          if (asset) {
            holdings.push({
              asset,
              balance: trustline.balance,
              type: 'fungible'
            });
          }
        }
      }

      // Add NFT holdings
      for (const nft of nfts) {
        const asset = await this.getAssetByNFTId(nft.NFTokenID);
        if (asset) {
          holdings.push({
            asset,
            nftId: nft.NFTokenID,
            type: 'nft'
          });
        }
      }

      return holdings;

    } catch (error) {
      console.error('Error fetching user holdings:', error);
      return [];
    }
  }

  // Helper method to get asset by symbol
  private async getAssetBySymbol(symbol: string): Promise<AssetToken | null> {
    try {
      const { data: asset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (error) return null;

      return {
        id: asset.id,
        type: asset.type as AssetType,
        name: asset.name,
        symbol: asset.symbol,
        issuer: asset.issuer_address || 'pending',
        totalSupply: asset.total_supply,
        currentPrice: asset.current_price,
        metadata: {
          description: asset.description,
          image: asset.metadata?.image || '',
          location: asset.metadata?.location,
          certification: asset.metadata?.certification,
          appraisal: asset.metadata?.appraisal,
        }
      };

    } catch (error) {
      return null;
    }
  }

  // Helper method to get asset by NFT ID
  private async getAssetByNFTId(nftId: string): Promise<AssetToken | null> {
    try {
      const { data: asset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('nft_token_id', nftId)
        .single();

      if (error) return null;

      return {
        id: asset.id,
        type: asset.type as AssetType,
        name: asset.name,
        symbol: asset.symbol,
        issuer: asset.issuer_address || 'pending',
        totalSupply: asset.total_supply,
        currentPrice: asset.current_price,
        metadata: {
          description: asset.description,
          image: asset.metadata?.image || '',
          location: asset.metadata?.location,
          certification: asset.metadata?.certification,
          appraisal: asset.metadata?.appraisal,
        }
      };

    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
export const assetManager = new AssetManager();
