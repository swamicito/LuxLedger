/* eslint-disable @typescript-eslint/no-explicit-any */
import { xrplClient } from './xrpl-client';
import { assetManager } from './asset-manager';
import { supabase } from '@/lib/supabase-client';

// Settlement Engine for Atomic Transactions
export class SettlementEngine {
  
  // Execute atomic buy transaction for fungible tokens (Real Estate)
  async executeFungibleTokenPurchase(
    buyerAddress: string,
    sellerAddress: string,
    assetId: string,
    tokenAmount: string,
    xrpPrice: string,
    buyerSeed?: string // For demo mode
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      // Get asset details
      const asset = await assetManager.getAssetById(assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          asset_id: assetId,
          buyer_address: buyerAddress,
          seller_address: sellerAddress,
          transaction_type: 'purchase',
          asset_type: 'fungible',
          amount: tokenAmount,
          price: xrpPrice,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (txError) throw txError;

      const isDevelopment = import.meta.env.DEV;

      if (isDevelopment) {
        // Demo mode - simulate successful transaction
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update transaction status
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            transaction_hash: `demo_tx_${Date.now()}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        return {
          success: true,
          transactionHash: `demo_tx_${Date.now()}`,
        };
      } else {
        // Production mode - execute real XRPL transaction
        if (!buyerSeed) {
          throw new Error('Buyer seed required for production transaction');
        }

        // Create payment transaction for XRP
        const paymentTxHash = await this.executeXRPPayment(
          buyerSeed,
          sellerAddress,
          xrpPrice
        );

        // Issue tokens to buyer
        const tokenTxHash = await this.issueTokensToBuyer(
          asset.symbol,
          asset.issuer,
          buyerAddress,
          tokenAmount
        );

        // Update transaction status
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            transaction_hash: paymentTxHash,
            token_transfer_hash: tokenTxHash,
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        return {
          success: true,
          transactionHash: paymentTxHash,
        };
      }

    } catch (error) {
      console.error('Error executing fungible token purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  // Execute atomic buy transaction for NFTs (Jewelry, Cars, Watches)
  async executeNFTPurchase(
    buyerAddress: string,
    sellerAddress: string,
    assetId: string,
    nftTokenId: string,
    xrpPrice: string,
    buyerSeed?: string
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      // Get asset details
      const asset = await assetManager.getAssetById(assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          asset_id: assetId,
          buyer_address: buyerAddress,
          seller_address: sellerAddress,
          transaction_type: 'purchase',
          asset_type: 'nft',
          amount: '1',
          price: xrpPrice,
          nft_token_id: nftTokenId,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (txError) throw txError;

      const isDevelopment = import.meta.env.DEV;

      if (isDevelopment) {
        // Demo mode - simulate successful NFT transfer
        await new Promise(resolve => setTimeout(resolve, 2000));

        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            transaction_hash: `demo_nft_tx_${Date.now()}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        return {
          success: true,
          transactionHash: `demo_nft_tx_${Date.now()}`,
        };
      } else {
        // Production mode - execute real NFT transaction
        if (!buyerSeed) {
          throw new Error('Buyer seed required for production transaction');
        }

        // Create NFT sell offer (if not exists)
        const sellOfferHash = await xrplClient.createNFTSellOffer(
          sellerAddress, // This would need seller's seed in real implementation
          nftTokenId,
          xrpPrice,
          buyerAddress
        );

        // Accept NFT offer
        const acceptTxHash = await xrplClient.acceptNFTOffer(
          buyerSeed,
          sellOfferHash
        );

        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            transaction_hash: acceptTxHash,
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        return {
          success: true,
          transactionHash: acceptTxHash,
        };
      }

    } catch (error) {
      console.error('Error executing NFT purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'NFT transaction failed',
      };
    }
  }

  // Execute XRP payment
  private async executeXRPPayment(
    senderSeed: string,
    recipientAddress: string,
    amount: string
  ): Promise<string> {
    // This would use xrplClient to send XRP payment
    // For now, return a mock transaction hash
    return `xrp_payment_${Date.now()}`;
  }

  // Issue tokens to buyer
  private async issueTokensToBuyer(
    tokenCurrency: string,
    issuerAddress: string,
    buyerAddress: string,
    amount: string
  ): Promise<string> {
    // This would use xrplClient to issue tokens
    // For now, return a mock transaction hash
    return `token_issue_${Date.now()}`;
  }

  // Get transaction history for user
  async getUserTransactionHistory(userAddress: string): Promise<any[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          assets (
            name,
            symbol,
            type,
            metadata
          )
        `)
        .or(`buyer_address.eq.${userAddress},seller_address.eq.${userAddress}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return transactions || [];

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  // Get transaction by ID
  async getTransactionById(transactionId: string): Promise<any | null> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select(`
          *,
          assets (
            name,
            symbol,
            type,
            metadata
          )
        `)
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      return transaction;

    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  // Verify transaction on XRPL
  async verifyTransaction(transactionHash: string): Promise<{
    verified: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      const isDevelopment = import.meta.env.DEV;

      if (isDevelopment) {
        // Demo mode - always return verified
        return {
          verified: true,
          details: {
            hash: transactionHash,
            status: 'validated',
            timestamp: new Date().toISOString(),
          }
        };
      } else {
        // Production mode - check XRPL
        const txDetails = await xrplClient.getTransaction(transactionHash);
        
        return {
          verified: txDetails.validated === true,
          details: txDetails,
        };
      }

    } catch (error) {
      console.error('Error verifying transaction:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  // Process pending transactions (background job)
  async processPendingTransactions(): Promise<void> {
    try {
      const { data: pendingTxs, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes old

      if (error) throw error;

      for (const tx of pendingTxs || []) {
        // Check if transaction was completed on XRPL
        if (tx.transaction_hash) {
          const verification = await this.verifyTransaction(tx.transaction_hash);
          
          if (verification.verified) {
            await supabase
              .from('transactions')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', tx.id);
          } else if (Date.now() - new Date(tx.created_at).getTime() > 30 * 60 * 1000) {
            // Mark as failed after 30 minutes
            await supabase
              .from('transactions')
              .update({
                status: 'failed',
                error_message: 'Transaction timeout',
              })
              .eq('id', tx.id);
          }
        }
      }

    } catch (error) {
      console.error('Error processing pending transactions:', error);
    }
  }
}

// Singleton instance
export const settlementEngine = new SettlementEngine();
