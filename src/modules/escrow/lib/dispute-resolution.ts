/**
 * Decentralized Dispute Resolution System for LuxGuard Escrow
 */

export type ArbitratorTier = 'community' | 'verified' | 'expert';
export type VoteWeight = 1 | 2 | 3; // Based on arbitrator tier
export type DisputeOutcome = 'buyer_wins' | 'seller_wins' | 'split_funds';

export interface Arbitrator {
  id: string;
  address: string;
  tier: ArbitratorTier;
  reputation: number; // 0-100 score
  totalCases: number;
  successRate: number;
  specializations: string[];
  stakeAmount: number; // Amount staked to be arbitrator
  isActive: boolean;
}

export interface DisputeCase {
  disputeId: string;
  escrowId: string;
  title: string;
  description: string;
  category: string; // jewelry, cars, real_estate, etc.
  amountUSD: number;
  initiatedBy: 'buyer' | 'seller';
  evidence: Evidence[];
  assignedArbitrators: string[];
  votes: ArbitratorVote[];
  status: 'open' | 'voting' | 'resolved' | 'appealed';
  createdAt: Date;
  votingDeadline: Date;
  resolution?: DisputeResolution;
}

export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'video' | 'transaction' | 'communication';
  title: string;
  description: string;
  fileHash?: string; // IPFS hash
  submittedBy: 'buyer' | 'seller';
  submittedAt: Date;
  verified: boolean;
}

export interface ArbitratorVote {
  arbitratorId: string;
  vote: DisputeOutcome;
  confidence: number; // 1-10 scale
  reasoning: string;
  votedAt: Date;
  weight: VoteWeight;
}

export interface DisputeResolution {
  outcome: DisputeOutcome;
  buyerAmount: number;
  sellerAmount: number;
  confidence: number;
  reasoning: string;
  arbitratorRewards: Record<string, number>;
  resolvedAt: Date;
}

export class DisputeResolutionDAO {
  private arbitrators: Map<string, Arbitrator> = new Map();
  private disputes: Map<string, DisputeCase> = new Map();
  private categories: Map<string, string[]> = new Map(); // category -> specialized arbitrator IDs

  constructor() {
    this.initializeCategories();
  }

  private initializeCategories() {
    this.categories.set('jewelry', []);
    this.categories.set('cars', []);
    this.categories.set('real_estate', []);
    this.categories.set('art', []);
    this.categories.set('collectibles', []);
  }

  /**
   * Register a new arbitrator
   */
  async registerArbitrator(params: {
    address: string;
    tier: ArbitratorTier;
    specializations: string[];
    stakeAmount: number;
  }): Promise<Arbitrator> {
    const arbitrator: Arbitrator = {
      id: `arbitrator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      address: params.address,
      tier: params.tier,
      reputation: 50, // Start with neutral reputation
      totalCases: 0,
      successRate: 0,
      specializations: params.specializations,
      stakeAmount: params.stakeAmount,
      isActive: true
    };

    this.arbitrators.set(arbitrator.id, arbitrator);

    // Add to category mappings
    params.specializations.forEach(spec => {
      const categoryArbitrators = this.categories.get(spec) || [];
      categoryArbitrators.push(arbitrator.id);
      this.categories.set(spec, categoryArbitrators);
    });

    return arbitrator;
  }

  /**
   * Create a new dispute case
   */
  async createDispute(params: {
    escrowId: string;
    title: string;
    description: string;
    category: string;
    amountUSD: number;
    initiatedBy: 'buyer' | 'seller';
    evidence: Omit<Evidence, 'id' | 'submittedAt' | 'verified'>[];
  }): Promise<DisputeCase> {
    const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Select appropriate arbitrators
    const assignedArbitrators = await this.selectArbitrators(params.category, params.amountUSD);
    
    const dispute: DisputeCase = {
      disputeId,
      escrowId: params.escrowId,
      title: params.title,
      description: params.description,
      category: params.category,
      amountUSD: params.amountUSD,
      initiatedBy: params.initiatedBy,
      evidence: params.evidence.map(e => ({
        ...e,
        id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        submittedAt: new Date(),
        verified: false
      })),
      assignedArbitrators,
      votes: [],
      status: 'open',
      createdAt: new Date(),
      votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.disputes.set(disputeId, dispute);
    return dispute;
  }

  /**
   * Select appropriate arbitrators for a dispute
   */
  private async selectArbitrators(category: string, amountUSD: number): Promise<string[]> {
    const categoryArbitrators = this.categories.get(category) || [];
    const allArbitrators = Array.from(this.arbitrators.values())
      .filter(a => a.isActive)
      .sort((a, b) => b.reputation - a.reputation);

    // For high-value disputes, prefer expert arbitrators
    const minTier: ArbitratorTier = amountUSD > 100000 ? 'expert' : 
                                   amountUSD > 25000 ? 'verified' : 'community';

    const eligibleArbitrators = allArbitrators.filter(a => {
      const tierScore = { community: 1, verified: 2, expert: 3 };
      return tierScore[a.tier] >= tierScore[minTier] &&
             (categoryArbitrators.includes(a.id) || a.specializations.length === 0);
    });

    // Select 3-5 arbitrators based on dispute value
    const numArbitrators = amountUSD > 50000 ? 5 : amountUSD > 10000 ? 3 : 3;
    return eligibleArbitrators.slice(0, numArbitrators).map(a => a.id);
  }

  /**
   * Submit arbitrator vote
   */
  async submitVote(params: {
    disputeId: string;
    arbitratorId: string;
    vote: DisputeOutcome;
    confidence: number;
    reasoning: string;
  }): Promise<void> {
    const dispute = this.disputes.get(params.disputeId);
    if (!dispute) throw new Error('Dispute not found');

    const arbitrator = this.arbitrators.get(params.arbitratorId);
    if (!arbitrator) throw new Error('Arbitrator not found');

    if (!dispute.assignedArbitrators.includes(params.arbitratorId)) {
      throw new Error('Arbitrator not assigned to this dispute');
    }

    // Check if already voted
    if (dispute.votes.some(v => v.arbitratorId === params.arbitratorId)) {
      throw new Error('Arbitrator has already voted');
    }

    const weight = this.getVoteWeight(arbitrator.tier);
    
    const vote: ArbitratorVote = {
      arbitratorId: params.arbitratorId,
      vote: params.vote,
      confidence: params.confidence,
      reasoning: params.reasoning,
      votedAt: new Date(),
      weight
    };

    dispute.votes.push(vote);
    dispute.status = 'voting';

    // Check if we have enough votes to resolve
    if (this.canResolveDispute(dispute)) {
      await this.resolveDispute(params.disputeId);
    }
  }

  /**
   * Get vote weight based on arbitrator tier
   */
  private getVoteWeight(tier: ArbitratorTier): VoteWeight {
    switch (tier) {
      case 'community': return 1;
      case 'verified': return 2;
      case 'expert': return 3;
    }
  }

  /**
   * Check if dispute has enough votes to resolve
   */
  private canResolveDispute(dispute: DisputeCase): boolean {
    const totalAssigned = dispute.assignedArbitrators.length;
    const totalVotes = dispute.votes.length;
    
    // Need at least 60% of assigned arbitrators to vote
    return totalVotes >= Math.ceil(totalAssigned * 0.6);
  }

  /**
   * Resolve dispute based on weighted votes
   */
  private async resolveDispute(disputeId: string): Promise<void> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    // Calculate weighted vote totals
    const voteTotals = {
      buyer_wins: 0,
      seller_wins: 0,
      split_funds: 0
    };

    let totalWeight = 0;
    let totalConfidence = 0;

    dispute.votes.forEach(vote => {
      const weight = vote.weight * (vote.confidence / 10); // Confidence-weighted
      voteTotals[vote.vote] += weight;
      totalWeight += vote.weight;
      totalConfidence += vote.confidence;
    });

    // Determine outcome
    const outcome = Object.entries(voteTotals).reduce((a, b) => 
      voteTotals[a[0] as DisputeOutcome] > voteTotals[b[0] as DisputeOutcome] ? a : b
    )[0] as DisputeOutcome;

    // Calculate fund distribution
    let buyerAmount = 0;
    let sellerAmount = 0;

    switch (outcome) {
      case 'buyer_wins':
        buyerAmount = dispute.amountUSD;
        break;
      case 'seller_wins':
        sellerAmount = dispute.amountUSD;
        break;
      case 'split_funds':
        buyerAmount = dispute.amountUSD * 0.5;
        sellerAmount = dispute.amountUSD * 0.5;
        break;
    }

    // Calculate arbitrator rewards
    const arbitratorRewards: Record<string, number> = {};
    const rewardPool = dispute.amountUSD * 0.01; // 1% of dispute amount
    
    dispute.votes.forEach(vote => {
      const isCorrectVote = vote.vote === outcome;
      const baseReward = rewardPool / dispute.votes.length;
      const bonusMultiplier = isCorrectVote ? 1.5 : 0.5;
      arbitratorRewards[vote.arbitratorId] = baseReward * bonusMultiplier;
    });

    const resolution: DisputeResolution = {
      outcome,
      buyerAmount,
      sellerAmount,
      confidence: totalConfidence / dispute.votes.length,
      reasoning: this.generateResolutionReasoning(dispute.votes, outcome),
      arbitratorRewards,
      resolvedAt: new Date()
    };

    dispute.resolution = resolution;
    dispute.status = 'resolved';

    // Update arbitrator reputations
    await this.updateArbitratorReputations(dispute);
  }

  /**
   * Generate resolution reasoning based on votes
   */
  private generateResolutionReasoning(votes: ArbitratorVote[], outcome: DisputeOutcome): string {
    const outcomeVotes = votes.filter(v => v.vote === outcome);
    const avgConfidence = outcomeVotes.reduce((sum, v) => sum + v.confidence, 0) / outcomeVotes.length;
    
    const commonReasons = outcomeVotes
      .map(v => v.reasoning)
      .join('; ');

    return `Resolution: ${outcome.replace('_', ' ')} (${outcomeVotes.length}/${votes.length} votes, ${avgConfidence.toFixed(1)}/10 confidence). Key reasoning: ${commonReasons}`;
  }

  /**
   * Update arbitrator reputations based on dispute outcome
   */
  private async updateArbitratorReputations(dispute: DisputeCase): Promise<void> {
    if (!dispute.resolution) return;

    dispute.votes.forEach(vote => {
      const arbitrator = this.arbitrators.get(vote.arbitratorId);
      if (!arbitrator) return;

      const wasCorrect = vote.vote === dispute.resolution!.outcome;
      const reputationChange = wasCorrect ? 2 : -1;
      
      arbitrator.reputation = Math.max(0, Math.min(100, arbitrator.reputation + reputationChange));
      arbitrator.totalCases += 1;
      
      // Recalculate success rate
      const correctVotes = arbitrator.totalCases * (arbitrator.successRate / 100) + (wasCorrect ? 1 : 0);
      arbitrator.successRate = (correctVotes / arbitrator.totalCases) * 100;
    });
  }

  /**
   * Get dispute details
   */
  getDispute(disputeId: string): DisputeCase | undefined {
    return this.disputes.get(disputeId);
  }

  /**
   * Get arbitrator details
   */
  getArbitrator(arbitratorId: string): Arbitrator | undefined {
    return this.arbitrators.get(arbitratorId);
  }

  /**
   * Get disputes for arbitrator
   */
  getArbitratorDisputes(arbitratorId: string): DisputeCase[] {
    return Array.from(this.disputes.values()).filter(d => 
      d.assignedArbitrators.includes(arbitratorId)
    );
  }

  /**
   * Get active disputes by category
   */
  getDisputesByCategory(category: string): DisputeCase[] {
    return Array.from(this.disputes.values()).filter(d => 
      d.category === category && d.status !== 'resolved'
    );
  }
}

// Global dispute resolution instance
export const disputeResolutionDAO = new DisputeResolutionDAO();
