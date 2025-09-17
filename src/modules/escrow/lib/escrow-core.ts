export type EscrowStatus = 'pending' | 'locked' | 'released' | 'disputed' | 'resolved' | 'cancelled';
export type DisputeStatus = 'none' | 'initiated' | 'voting' | 'resolved';
export type Chain = 'xrpl' | 'ethereum' | 'polygon' | 'solana';

export interface EscrowDetails {
  escrowId: string;
  chain: Chain;
  amountUSD: number;
  assetAmount: string;
  assetSymbol: string;
  buyerAddress: string;
  sellerAddress: string;
  arbitratorAddress?: string;
  status: EscrowStatus;
  createdAt: Date;
  expiresAt: Date;
  conditions: EscrowCondition[];
  metadata: EscrowMetadata;
}

export interface EscrowCondition {
  type: 'delivery_confirmation' | 'inspection_period' | 'custom';
  description: string;
  fulfilled: boolean;
  fulfilledAt?: Date;
  fulfilledBy?: string;
}

export interface EscrowMetadata {
  assetTokenId?: string;
  deliveryMethod?: string;
  inspectionPeriodDays?: number;
  requiresBothParties: boolean;
  autoReleaseEnabled: boolean;
}

export interface DisputeDetails {
  disputeId: string;
  escrowId: string;
  initiatedBy: 'buyer' | 'seller';
  reason: string;
  evidence: DisputeEvidence[];
  status: DisputeStatus;
  votes: DisputeVote[];
  resolution?: DisputeResolution;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface DisputeEvidence {
  type: 'text' | 'image' | 'document' | 'transaction';
  content: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DisputeVote {
  arbitratorId: string;
  vote: 'buyer' | 'seller' | 'split';
  reasoning?: string;
  votedAt: Date;
}

export interface DisputeResolution {
  outcome: 'buyer_wins' | 'seller_wins' | 'split_funds';
  buyerAmount: number;
  sellerAmount: number;
  reasoning: string;
}

export class EscrowManager {
  private escrows: Map<string, EscrowDetails> = new Map();
  private disputes: Map<string, DisputeDetails> = new Map();

  async createEscrow(params: {
    chain: Chain;
    amountUSD: number;
    assetAmount: string;
    assetSymbol: string;
    buyerAddress: string;
    sellerAddress: string;
    arbitratorAddress?: string;
    expirationDays?: number;
    conditions?: Partial<EscrowCondition>[];
    metadata?: Partial<EscrowMetadata>;
  }): Promise<EscrowDetails> {
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const escrow: EscrowDetails = {
      escrowId,
      chain: params.chain,
      amountUSD: params.amountUSD,
      assetAmount: params.assetAmount,
      assetSymbol: params.assetSymbol,
      buyerAddress: params.buyerAddress,
      sellerAddress: params.sellerAddress,
      arbitratorAddress: params.arbitratorAddress,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (params.expirationDays || 14) * 24 * 60 * 60 * 1000),
      conditions: [
        {
          type: 'delivery_confirmation',
          description: 'Buyer confirms receipt of asset',
          fulfilled: false
        },
        ...(params.conditions || []).map(c => ({
          type: c.type || 'custom' as const,
          description: c.description || '',
          fulfilled: false
        }))
      ],
      metadata: {
        requiresBothParties: true,
        autoReleaseEnabled: true,
        inspectionPeriodDays: 7,
        ...params.metadata
      }
    };

    this.escrows.set(escrowId, escrow);
    return escrow;
  }

  async lockFunds(escrowId: string): Promise<{ success: boolean; txHash?: string }> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error('Escrow not found');

    // Simulate blockchain transaction
    const txHash = await this.executeChainTransaction(escrow.chain, 'lock', escrow);
    
    escrow.status = 'locked';
    return { success: true, txHash };
  }

  async confirmCondition(
    escrowId: string, 
    conditionType: string, 
    confirmedBy: string
  ): Promise<boolean> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error('Escrow not found');

    const condition = escrow.conditions.find(c => c.type === conditionType);
    if (!condition) throw new Error('Condition not found');

    condition.fulfilled = true;
    condition.fulfilledAt = new Date();
    condition.fulfilledBy = confirmedBy;

    // Check if all conditions are met
    const allConditionsMet = escrow.conditions.every(c => c.fulfilled);
    
    if (allConditionsMet && escrow.metadata.autoReleaseEnabled) {
      await this.releaseFunds(escrowId);
    }

    return allConditionsMet;
  }

  async releaseFunds(escrowId: string): Promise<{ success: boolean; txHash?: string }> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error('Escrow not found');

    const txHash = await this.executeChainTransaction(escrow.chain, 'release', escrow);
    
    escrow.status = 'released';
    return { success: true, txHash };
  }

  async initiateDispute(
    escrowId: string,
    initiatedBy: 'buyer' | 'seller',
    reason: string,
    evidence: Omit<DisputeEvidence, 'uploadedAt'>[]
  ): Promise<DisputeDetails> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error('Escrow not found');

    const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dispute: DisputeDetails = {
      disputeId,
      escrowId,
      initiatedBy,
      reason,
      evidence: evidence.map(e => ({ ...e, uploadedAt: new Date() })),
      status: 'initiated',
      votes: [],
      createdAt: new Date()
    };

    escrow.status = 'disputed';
    this.disputes.set(disputeId, dispute);
    
    return dispute;
  }

  async submitArbitratorVote(
    disputeId: string,
    arbitratorId: string,
    vote: 'buyer' | 'seller' | 'split',
    reasoning?: string
  ): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    dispute.votes.push({
      arbitratorId,
      vote,
      reasoning,
      votedAt: new Date()
    });

    // Check if we have enough votes to resolve (simplified: 1 vote for demo)
    if (dispute.votes.length >= 1) {
      await this.resolveDispute(disputeId);
    }
  }

  private async resolveDispute(disputeId: string): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    const escrow = this.escrows.get(dispute.escrowId);
    if (!escrow) throw new Error('Escrow not found');

    // Simple majority vote resolution
    const votes = dispute.votes;
    const buyerVotes = votes.filter(v => v.vote === 'buyer').length;
    const sellerVotes = votes.filter(v => v.vote === 'seller').length;
    const splitVotes = votes.filter(v => v.vote === 'split').length;

    let resolution: DisputeResolution;

    if (buyerVotes > sellerVotes && buyerVotes > splitVotes) {
      resolution = {
        outcome: 'buyer_wins',
        buyerAmount: escrow.amountUSD,
        sellerAmount: 0,
        reasoning: 'Majority vote in favor of buyer'
      };
    } else if (sellerVotes > buyerVotes && sellerVotes > splitVotes) {
      resolution = {
        outcome: 'seller_wins',
        buyerAmount: 0,
        sellerAmount: escrow.amountUSD,
        reasoning: 'Majority vote in favor of seller'
      };
    } else {
      resolution = {
        outcome: 'split_funds',
        buyerAmount: escrow.amountUSD * 0.5,
        sellerAmount: escrow.amountUSD * 0.5,
        reasoning: 'Split decision or tie vote'
      };
    }

    dispute.resolution = resolution;
    dispute.status = 'resolved';
    dispute.resolvedAt = new Date();
    
    escrow.status = 'resolved';

    // Execute the resolution on-chain
    await this.executeDisputeResolution(escrow, resolution);
  }

  private async executeChainTransaction(
    chain: Chain, 
    action: 'lock' | 'release', 
    escrow: EscrowDetails
  ): Promise<string> {
    // Simulate chain-specific transaction logic
    switch (chain) {
      case 'xrpl':
        return this.executeXRPLTransaction(action, escrow);
      case 'ethereum':
      case 'polygon':
        return this.executeEVMTransaction(action, escrow);
      case 'solana':
        return this.executeSolanaTransaction(action, escrow);
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
  }

  private async executeXRPLTransaction(action: string, escrow: EscrowDetails): Promise<string> {
    // XRPL escrow transaction simulation
    console.log(`XRPL ${action} transaction for escrow ${escrow.escrowId}`);
    return `xrpl_tx_${Date.now()}`;
  }

  private async executeEVMTransaction(action: string, escrow: EscrowDetails): Promise<string> {
    // EVM smart contract interaction simulation
    console.log(`EVM ${action} transaction for escrow ${escrow.escrowId}`);
    return `evm_tx_${Date.now()}`;
  }

  private async executeSolanaTransaction(action: string, escrow: EscrowDetails): Promise<string> {
    // Solana program interaction simulation
    console.log(`Solana ${action} transaction for escrow ${escrow.escrowId}`);
    return `sol_tx_${Date.now()}`;
  }

  private async executeDisputeResolution(
    escrow: EscrowDetails, 
    resolution: DisputeResolution
  ): Promise<void> {
    console.log(`Executing dispute resolution for escrow ${escrow.escrowId}:`, resolution);
    // Chain-specific resolution execution would go here
  }

  // Getter methods
  getEscrow(escrowId: string): EscrowDetails | undefined {
    return this.escrows.get(escrowId);
  }

  getDispute(disputeId: string): DisputeDetails | undefined {
    return this.disputes.get(disputeId);
  }

  getUserEscrows(userAddress: string): EscrowDetails[] {
    return Array.from(this.escrows.values()).filter(
      e => e.buyerAddress === userAddress || e.sellerAddress === userAddress
    );
  }
}

// Global escrow manager instance
export const escrowManager = new EscrowManager();
