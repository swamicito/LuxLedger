/**
 * XRPL Commission Split Logic for LuxBroker
 * Handles automatic commission payments via XRPL multi-payment transactions
 */

import { Client, Payment, TxResponse, validate } from 'xrpl';
import { commissionService, brokerService, sellerService } from '../supabase-client';

export interface CommissionSplit {
  sellerWallet: string;
  brokerWallet: string;
  platformWallet: string;
  totalAmount: number; // USD
  sellerAmount: number; // USD
  brokerAmount: number; // USD
  platformAmount: number; // USD
  commissionRate: number;
}

export interface XRPLCommissionPayment {
  sellerPayment: Payment;
  brokerPayment: Payment;
  platformPayment: Payment;
}

export class XRPLCommissionManager {
  private client: Client;
  private escrowWallet: string;
  private platformWallet: string;

  constructor(
    rpcUrl: string = 'wss://s.altnet.rippletest.net:51233',
    escrowWalletSeed?: string,
    platformWallet: string = 'rPlatformWalletAddress123456789'
  ) {
    this.client = new Client(rpcUrl);
    this.escrowWallet = escrowWalletSeed ? this.deriveWalletFromSeed(escrowWalletSeed) : '';
    this.platformWallet = platformWallet;
  }

  /**
   * Calculate commission split based on sale amount and broker tier
   */
  async calculateCommissionSplit(
    saleAmountUSD: number,
    sellerWallet: string,
    brokerReferralCode?: string
  ): Promise<CommissionSplit> {
    let brokerWallet = '';
    let commissionRate = 0;
    let brokerAmount = 0;

    // Get broker info if referral exists
    if (brokerReferralCode) {
      const { data: broker } = await brokerService.getByReferralCode(brokerReferralCode);
      if (broker) {
        brokerWallet = broker.wallet_address;
        commissionRate = broker.commission_rate;
        brokerAmount = saleAmountUSD * commissionRate;
      }
    }

    // Platform fee: 5% base, reduced by broker commission
    const platformRate = 0.05;
    const platformAmount = saleAmountUSD * platformRate;
    
    // Seller gets remainder
    const sellerAmount = saleAmountUSD - brokerAmount - platformAmount;

    return {
      sellerWallet,
      brokerWallet,
      platformWallet: this.platformWallet,
      totalAmount: saleAmountUSD,
      sellerAmount,
      brokerAmount,
      platformAmount,
      commissionRate
    };
  }

  /**
   * Create XRPL payment transactions for commission split
   */
  async createCommissionPayments(
    split: CommissionSplit,
    buyerWallet: string,
    xrpRate: number = 0.5 // USD per XRP
  ): Promise<XRPLCommissionPayment> {
    // Convert USD amounts to XRP drops
    const sellerXRP = this.usdToXRPDrops(split.sellerAmount, xrpRate);
    const brokerXRP = split.brokerAmount > 0 ? this.usdToXRPDrops(split.brokerAmount, xrpRate) : '0';
    const platformXRP = this.usdToXRPDrops(split.platformAmount, xrpRate);

    // Create payment transactions
    const sellerPayment: Payment = {
      TransactionType: 'Payment',
      Account: buyerWallet,
      Destination: split.sellerWallet,
      Amount: sellerXRP,
      Fee: '12', // 12 drops fee
      Memos: [{
        Memo: {
          MemoType: Buffer.from('luxbroker/seller', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(JSON.stringify({
            type: 'seller_payment',
            saleAmount: split.totalAmount,
            commission: split.commissionRate
          }), 'utf8').toString('hex').toUpperCase()
        }
      }]
    };

    const platformPayment: Payment = {
      TransactionType: 'Payment',
      Account: buyerWallet,
      Destination: split.platformWallet,
      Amount: platformXRP,
      Fee: '12',
      Memos: [{
        Memo: {
          MemoType: Buffer.from('luxbroker/platform', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(JSON.stringify({
            type: 'platform_fee',
            saleAmount: split.totalAmount
          }), 'utf8').toString('hex').toUpperCase()
        }
      }]
    };

    let brokerPayment: Payment | null = null;
    if (split.brokerAmount > 0 && split.brokerWallet) {
      brokerPayment = {
        TransactionType: 'Payment',
        Account: buyerWallet,
        Destination: split.brokerWallet,
        Amount: brokerXRP,
        Fee: '12',
        Memos: [{
          Memo: {
            MemoType: Buffer.from('luxbroker/commission', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(JSON.stringify({
              type: 'broker_commission',
              saleAmount: split.totalAmount,
              commissionRate: split.commissionRate
            }), 'utf8').toString('hex').toUpperCase()
          }
        }]
      };
    }

    const totalXRP = (
      parseInt(sellerXRP) + 
      parseInt(platformXRP) + 
      (brokerPayment ? parseInt(brokerXRP) : 0)
    ).toString();

    return {
      sellerPayment,
      brokerPayment: brokerPayment!,
      platformPayment,
      totalXRP
    };
  }

  /**
   * Execute commission split payments
   */
  async executeCommissionSplit(
    split: CommissionSplit,
    buyerWallet: string,
    buyerWalletSeed: string,
    saleId: string,
    xrpRate: number = 0.5
  ): Promise<{
    success: boolean;
    transactions: string[];
    commissionId?: string;
    error?: string;
  }> {
    try {
      await this.client.connect();

      // Create payment transactions
      const payments = await this.createCommissionPayments(split, buyerWallet, xrpRate);
      const transactions: string[] = [];

      // Submit seller payment
      const sellerTx = await this.submitPayment(payments.sellerPayment, buyerWalletSeed);
      if (sellerTx.success) {
        transactions.push(sellerTx.hash!);
      } else {
        throw new Error(`Seller payment failed: ${sellerTx.error}`);
      }

      // Submit platform payment
      const platformTx = await this.submitPayment(payments.platformPayment, buyerWalletSeed);
      if (platformTx.success) {
        transactions.push(platformTx.hash!);
      } else {
        throw new Error(`Platform payment failed: ${platformTx.error}`);
      }

      // Submit broker commission if applicable
      let commissionId: string | undefined;
      if (payments.brokerPayment && split.brokerAmount > 0) {
        const brokerTx = await this.submitPayment(payments.brokerPayment, buyerWalletSeed);
        if (brokerTx.success) {
          transactions.push(brokerTx.hash!);

          // Record commission in database
          const { data: seller } = await sellerService.getByWallet(split.sellerWallet);
          const { data: broker } = await brokerService.getByWallet(split.brokerWallet);

          if (seller && broker) {
            const { data: commission } = await commissionService.create({
              broker_id: broker.id,
              seller_id: seller.id,
              sale_id: saleId,
              sale_amount_usd: split.totalAmount,
              commission_amount_usd: split.brokerAmount,
              commission_rate: split.commissionRate,
              broker_wallet: split.brokerWallet,
              seller_wallet: split.sellerWallet,
              tx_hash: brokerTx.hash!,
              status: 'paid'
            });

            if (commission) {
              commissionId = commission.id;
            }
          }
        } else {
          throw new Error(`Broker payment failed: ${brokerTx.error}`);
        }
      }

      await this.client.disconnect();

      return {
        success: true,
        transactions,
        commissionId
      };

    } catch (error) {
      await this.client.disconnect();
      console.error('Commission split execution error:', error);
      
      return {
        success: false,
        transactions: [],
        error: (error as Error).message
      };
    }
  }

  /**
   * Submit individual payment transaction
   */
  private async submitPayment(
    payment: Payment,
    walletSeed: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      // Validate payment
      validate(payment);

      // Get wallet from seed (simplified for demo)
      const { Wallet } = await import('xrpl');
      const wallet = Wallet.fromSeed(walletSeed);
      
      // Prepare and submit transaction
      const prepared = await this.client.autofill(payment);
      const signed = wallet.sign(prepared);
      const result: TxResponse = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta && result.result.meta.TransactionResult === 'tesSUCCESS') {
        return {
          success: true,
          hash: result.result.hash
        };
      } else {
        const errorCode = result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta 
          ? result.result.meta.TransactionResult 
          : 'Unknown error';
        return {
          success: false,
          error: `Transaction failed: ${errorCode}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Convert USD to XRP drops
   */
  private usdToXRPDrops(usdAmount: number, xrpRate: number): string {
    const xrpAmount = usdAmount / xrpRate;
    const drops = Math.floor(xrpAmount * 1000000); // Convert to drops
    return drops.toString();
  }

  /**
   * Derive wallet address from seed (simplified)
   */
  private deriveWalletFromSeed(seed: string): string {
    // In production, use proper XRPL wallet derivation
    // This is a placeholder
    return 'rEscrowWalletAddress123456789';
  }

  /**
   * Get current XRP/USD rate from exchange
   */
  async getCurrentXRPRate(): Promise<number> {
    try {
      // In production, integrate with price API
      // For now, return mock rate
      return 0.5; // $0.50 per XRP
    } catch {
      return 0.5; // Fallback rate
    }
  }

  /**
   * Validate commission split before execution
   */
  validateCommissionSplit(split: CommissionSplit): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check wallet addresses
    if (!split.sellerWallet.startsWith('r')) {
      errors.push('Invalid seller wallet address');
    }

    if (split.brokerWallet && !split.brokerWallet.startsWith('r')) {
      errors.push('Invalid broker wallet address');
    }

    if (!split.platformWallet.startsWith('r')) {
      errors.push('Invalid platform wallet address');
    }

    // Check amounts
    if (split.totalAmount <= 0) {
      errors.push('Total amount must be positive');
    }

    const calculatedTotal = split.sellerAmount + split.brokerAmount + split.platformAmount;
    if (Math.abs(calculatedTotal - split.totalAmount) > 0.01) {
      errors.push('Commission split amounts do not add up to total');
    }

    // Check commission rate
    if (split.commissionRate < 0 || split.commissionRate > 0.5) {
      errors.push('Commission rate must be between 0% and 50%');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export commission payment function for Netlify functions
export async function payCommissions(
  saleAmountUSD: number,
  sellerWallet: string,
  buyerWalletSeed: string,
  saleId: string,
  brokerReferralCode?: string
): Promise<{ success: boolean; transactions: string[]; commissionId?: string; error?: string }> {
  const manager = new XRPLCommissionManager(
    process.env.XRPL_RPC_URL,
    process.env.XRPL_ESCROW_SEED,
    process.env.XRPL_PLATFORM_WALLET
  );
  
  const split = await manager.calculateCommissionSplit(saleAmountUSD, sellerWallet, brokerReferralCode);
  return await manager.executeCommissionSplit(split, buyerWalletSeed, saleId);
}

// Default export for easy use
export const commissionManager = new XRPLCommissionManager();
