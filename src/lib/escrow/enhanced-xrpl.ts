/**
 * Enhanced XRPL Escrow Implementation
 * Based on provided examples with improved error handling and validation
 */

import { Client, Wallet, EscrowCreate, EscrowFinish, EscrowCancel, convertStringToHex, xrpToDrops } from 'xrpl';

export interface EnhancedEscrowParams {
  amountUSD: number;
  assetType?: string;
  buyerAddress: string;
  sellerAddress: string;
  expirationSeconds: number;
  escrowSequence?: number;
  finalize?: boolean;
}

export interface EscrowResult {
  success: boolean;
  txHash?: string;
  escrowSequence?: number;
  explorerUrl?: string;
  error?: string;
  preview?: any;
}

export class EnhancedXRPLEscrowManager {
  private client: Client;
  private wallet: Wallet;

  constructor() {
    const rpcUrl = process.env.XRPL_RPC_URL || "wss://s.altnet.rippletest.net:51233";
    const escrowSeed = process.env.XRPL_ESCROW_SEED || "";
    
    this.client = new Client(rpcUrl);
    this.wallet = Wallet.fromSeed(escrowSeed);
  }

  async createEscrow(params: EnhancedEscrowParams): Promise<EscrowResult> {
    try {
      await this.client.connect();

      // Enhanced validation
      if (!params.buyerAddress?.startsWith('r') || !params.sellerAddress?.startsWith('r')) {
        throw new Error('Invalid XRPL address format');
      }

      if (params.amountUSD < 100 || params.amountUSD > 10_000_000) {
        throw new Error('Amount must be between $100 and $10M USD');
      }

      // Convert USD to XRP drops with better precision
      const xrpRate = 0.5; // $0.50 per XRP for demo
      const xrpAmount = params.amountUSD / xrpRate;
      const drops = String(Math.floor(xrpAmount * 1_000_000));

      const expirationTimestamp = Math.floor(Date.now() / 1000) + params.expirationSeconds;

      const escrowTx: EscrowCreate = {
        TransactionType: "EscrowCreate",
        Account: params.buyerAddress,
        Destination: params.sellerAddress,
        Amount: drops,
        CancelAfter: expirationTimestamp,
        Condition: convertStringToHex("luxledger-escrow-condition"),
      };

      const prepared = await this.client.autofill(escrowTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      await this.client.disconnect();

      // Extract sequence from transaction result
      const sequence = (result as any).result?.Sequence || Date.now();
      const explorerUrl = `https://testnet.xrpl.org/transactions/${signed.hash}`;

      return {
        success: true,
        txHash: signed.hash,
        escrowSequence: sequence,
        explorerUrl,
        preview: signed.tx_json
      };

    } catch (error) {
      await this.client.disconnect();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async finishEscrow(params: EnhancedEscrowParams): Promise<EscrowResult> {
    try {
      if (!params.escrowSequence) {
        throw new Error('Escrow sequence required for finalization');
      }

      await this.client.connect();

      const finishTx: EscrowFinish = {
        TransactionType: "EscrowFinish",
        Account: params.buyerAddress,
        Owner: params.buyerAddress,
        OfferSequence: params.escrowSequence,
        Condition: convertStringToHex("luxledger-escrow-condition"),
        Fulfillment: convertStringToHex("luxledger-escrow-fulfillment")
      };

      const prepared = await this.client.autofill(finishTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      await this.client.disconnect();

      const explorerUrl = `https://testnet.xrpl.org/transactions/${signed.hash}`;

      return {
        success: true,
        txHash: signed.hash,
        explorerUrl,
        preview: signed.tx_json
      };

    } catch (error) {
      await this.client.disconnect();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cancelEscrow(params: EnhancedEscrowParams): Promise<EscrowResult> {
    try {
      if (!params.escrowSequence) {
        throw new Error('Escrow sequence required for cancellation');
      }

      await this.client.connect();

      const cancelTx: EscrowCancel = {
        TransactionType: "EscrowCancel",
        Account: params.buyerAddress,
        Owner: params.buyerAddress,
        OfferSequence: params.escrowSequence
      };

      const prepared = await this.client.autofill(cancelTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      await this.client.disconnect();

      const explorerUrl = `https://testnet.xrpl.org/transactions/${signed.hash}`;

      return {
        success: true,
        txHash: signed.hash,
        explorerUrl,
        preview: signed.tx_json
      };

    } catch (error) {
      await this.client.disconnect();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const enhancedXrplEscrowManager = new EnhancedXRPLEscrowManager();
