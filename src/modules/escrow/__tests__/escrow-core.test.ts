/**
 * Test suite for LuxGuard Escrow Core functionality
 */

import { escrowManager, EscrowStatus, DisputeStatus } from '../lib/escrow-core';
import { disputeResolution } from '../lib/dispute-resolution';

describe('LuxGuard Escrow Core', () => {
  beforeEach(() => {
    // Reset state between tests
    escrowManager['escrows'].clear();
    escrowManager['disputes'].clear();
  });

  describe('Escrow Creation', () => {
    it('should create a new escrow with correct parameters', async () => {
      const escrowParams = {
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: 50000,
        chain: 'xrpl' as const,
        expirationDays: 7,
        metadata: JSON.stringify({ assetId: 'asset_789' })
      };

      const escrow = await escrowManager.createEscrow(escrowParams);

      expect(escrow).toBeDefined();
      expect(escrow.seller).toBe(escrowParams.seller);
      expect(escrow.buyer).toBe(escrowParams.buyer);
      expect(escrow.amount).toBe(escrowParams.amount);
      expect(escrow.chain).toBe(escrowParams.chain);
      expect(escrow.status).toBe(EscrowStatus.CREATED);
      expect(escrow.metadata).toBe(escrowParams.metadata);
    });

    it('should calculate correct fees for different amounts', async () => {
      const smallEscrow = await escrowManager.createEscrow({
        seller: 'seller_1',
        buyer: 'buyer_1',
        amount: 5000,
        chain: 'xrpl',
        expirationDays: 7
      });

      const largeEscrow = await escrowManager.createEscrow({
        seller: 'seller_2',
        buyer: 'buyer_2',
        amount: 100000,
        chain: 'xrpl',
        expirationDays: 7
      });

      expect(smallEscrow.fees.escrowFee).toBeGreaterThan(0);
      expect(largeEscrow.fees.escrowFee).toBeGreaterThan(0);
      // Larger amounts should have lower percentage fees
      expect(largeEscrow.fees.escrowFee / largeEscrow.amount).toBeLessThan(
        smallEscrow.fees.escrowFee / smallEscrow.amount
      );
    });

    it('should apply subscription discounts correctly', async () => {
      const basicEscrow = await escrowManager.createEscrow({
        seller: 'seller_1',
        buyer: 'buyer_1',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: 7,
        subscriptionTier: 'basic'
      });

      const proEscrow = await escrowManager.createEscrow({
        seller: 'seller_2',
        buyer: 'buyer_2',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: 7,
        subscriptionTier: 'pro'
      });

      expect(proEscrow.fees.escrowFee).toBeLessThan(basicEscrow.fees.escrowFee);
      expect(proEscrow.fees.discount).toBeGreaterThan(0);
    });
  });

  describe('Escrow Lifecycle', () => {
    let escrowId: string;

    beforeEach(async () => {
      const escrow = await escrowManager.createEscrow({
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: 7
      });
      escrowId = escrow.id;
    });

    it('should lock funds successfully', async () => {
      const result = await escrowManager.lockFunds(escrowId, 'mock_tx_hash');
      
      expect(result.success).toBe(true);
      
      const escrow = escrowManager.getEscrow(escrowId);
      expect(escrow?.status).toBe(EscrowStatus.FUNDED);
      expect(escrow?.transactionHash).toBe('mock_tx_hash');
    });

    it('should confirm delivery conditions', async () => {
      await escrowManager.lockFunds(escrowId, 'mock_tx_hash');
      
      const result = await escrowManager.confirmConditions(escrowId, 'buyer_456', {
        deliveryConfirmed: true,
        conditionsMet: true,
        notes: 'Asset received in perfect condition'
      });

      expect(result.success).toBe(true);
      
      const escrow = escrowManager.getEscrow(escrowId);
      expect(escrow?.status).toBe(EscrowStatus.CONDITIONS_MET);
    });

    it('should release funds to seller', async () => {
      await escrowManager.lockFunds(escrowId, 'mock_tx_hash');
      await escrowManager.confirmConditions(escrowId, 'buyer_456', {
        deliveryConfirmed: true,
        conditionsMet: true
      });

      const result = await escrowManager.releaseFunds(escrowId);
      
      expect(result.success).toBe(true);
      
      const escrow = escrowManager.getEscrow(escrowId);
      expect(escrow?.status).toBe(EscrowStatus.COMPLETED);
      expect(escrow?.completedAt).toBeDefined();
    });

    it('should handle escrow expiration', async () => {
      // Create expired escrow
      const expiredEscrow = await escrowManager.createEscrow({
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: -1 // Already expired
      });

      const result = await escrowManager.handleExpiration(expiredEscrow.id);
      
      expect(result.success).toBe(true);
      
      const escrow = escrowManager.getEscrow(expiredEscrow.id);
      expect(escrow?.status).toBe(EscrowStatus.EXPIRED);
    });
  });

  describe('Dispute Management', () => {
    let escrowId: string;

    beforeEach(async () => {
      const escrow = await escrowManager.createEscrow({
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: 7
      });
      escrowId = escrow.id;
      await escrowManager.lockFunds(escrowId, 'mock_tx_hash');
    });

    it('should initiate dispute successfully', async () => {
      const disputeParams = {
        escrowId,
        initiator: 'buyer_456',
        reason: 'Asset not as described',
        evidence: ['photo1.jpg', 'photo2.jpg'],
        description: 'The watch has scratches not mentioned in listing'
      };

      const dispute = await escrowManager.initiateDispute(disputeParams);
      
      expect(dispute).toBeDefined();
      expect(dispute.escrowId).toBe(escrowId);
      expect(dispute.initiator).toBe(disputeParams.initiator);
      expect(dispute.status).toBe(DisputeStatus.OPEN);
      
      const escrow = escrowManager.getEscrow(escrowId);
      expect(escrow?.status).toBe(EscrowStatus.DISPUTED);
    });

    it('should assign arbitrators to dispute', async () => {
      const dispute = await escrowManager.initiateDispute({
        escrowId,
        initiator: 'buyer_456',
        reason: 'Asset not as described',
        evidence: [],
        description: 'Issue with asset'
      });

      // Mock arbitrator assignment
      const arbitrators = await disputeResolution.assignArbitrators(dispute.id, 3);
      
      expect(arbitrators).toHaveLength(3);
      expect(arbitrators.every(arb => arb.isActive)).toBe(true);
    });

    it('should resolve dispute with majority vote', async () => {
      const dispute = await escrowManager.initiateDispute({
        escrowId,
        initiator: 'buyer_456',
        reason: 'Asset not as described',
        evidence: [],
        description: 'Issue with asset'
      });

      // Mock voting process
      await disputeResolution.submitVote(dispute.id, 'arbitrator_1', {
        decision: 'buyer',
        reasoning: 'Evidence supports buyer claim',
        refundPercentage: 100
      });

      await disputeResolution.submitVote(dispute.id, 'arbitrator_2', {
        decision: 'buyer',
        reasoning: 'Asset condition not as described',
        refundPercentage: 100
      });

      await disputeResolution.submitVote(dispute.id, 'arbitrator_3', {
        decision: 'seller',
        reasoning: 'Normal wear and tear',
        refundPercentage: 0
      });

      const resolution = await disputeResolution.resolveDispute(dispute.id);
      
      expect(resolution.decision).toBe('buyer');
      expect(resolution.refundPercentage).toBe(100);
      
      const updatedDispute = disputeResolution.getDispute(dispute.id);
      expect(updatedDispute?.status).toBe(DisputeStatus.RESOLVED);
    });
  });

  describe('Multi-chain Support', () => {
    it('should create escrows on different chains', async () => {
      const chains = ['xrpl', 'ethereum', 'polygon'] as const;
      
      for (const chain of chains) {
        const escrow = await escrowManager.createEscrow({
          seller: 'seller_123',
          buyer: 'buyer_456',
          amount: 50000,
          chain,
          expirationDays: 7
        });

        expect(escrow.chain).toBe(chain);
        expect(escrow.fees.chainMultiplier).toBeGreaterThan(0);
      }
    });

    it('should apply correct chain multipliers', async () => {
      const xrplEscrow = await escrowManager.createEscrow({
        seller: 'seller_1',
        buyer: 'buyer_1',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: 7
      });

      const ethEscrow = await escrowManager.createEscrow({
        seller: 'seller_2',
        buyer: 'buyer_2',
        amount: 50000,
        chain: 'ethereum',
        expirationDays: 7
      });

      // Ethereum should have higher fees due to gas costs
      expect(ethEscrow.fees.escrowFee).toBeGreaterThan(xrplEscrow.fees.escrowFee);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid escrow operations', async () => {
      await expect(escrowManager.lockFunds('invalid_id', 'tx_hash'))
        .rejects.toThrow('Escrow not found');

      await expect(escrowManager.confirmConditions('invalid_id', 'buyer', {}))
        .rejects.toThrow('Escrow not found');

      await expect(escrowManager.releaseFunds('invalid_id'))
        .rejects.toThrow('Escrow not found');
    });

    it('should prevent unauthorized operations', async () => {
      const escrow = await escrowManager.createEscrow({
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: 7
      });

      await escrowManager.lockFunds(escrow.id, 'tx_hash');

      // Wrong user trying to confirm conditions
      await expect(escrowManager.confirmConditions(escrow.id, 'wrong_user', {}))
        .rejects.toThrow('Unauthorized');
    });

    it('should handle duplicate operations gracefully', async () => {
      const escrow = await escrowManager.createEscrow({
        seller: 'seller_123',
        buyer: 'buyer_456',
        amount: 50000,
        chain: 'xrpl',
        expirationDays: 7
      });

      await escrowManager.lockFunds(escrow.id, 'tx_hash');
      
      // Try to lock funds again
      await expect(escrowManager.lockFunds(escrow.id, 'tx_hash_2'))
        .rejects.toThrow('Invalid escrow status');
    });
  });

  describe('Analytics and Reporting', () => {
    it('should track escrow metrics correctly', async () => {
      // Create multiple escrows
      const escrows = await Promise.all([
        escrowManager.createEscrow({
          seller: 'seller_1',
          buyer: 'buyer_1',
          amount: 25000,
          chain: 'xrpl',
          expirationDays: 7
        }),
        escrowManager.createEscrow({
          seller: 'seller_2',
          buyer: 'buyer_2',
          amount: 75000,
          chain: 'ethereum',
          expirationDays: 7
        })
      ]);

      // Complete one escrow
      await escrowManager.lockFunds(escrows[0].id, 'tx1');
      await escrowManager.confirmConditions(escrows[0].id, 'buyer_1', {
        deliveryConfirmed: true,
        conditionsMet: true
      });
      await escrowManager.releaseFunds(escrows[0].id);

      const metrics = escrowManager.getAnalytics();
      
      expect(metrics.totalEscrows).toBe(2);
      expect(metrics.completedEscrows).toBe(1);
      expect(metrics.totalVolume).toBe(100000);
      expect(metrics.averageAmount).toBe(50000);
    });

    it('should generate user-specific analytics', async () => {
      const userId = 'user_123';
      
      await escrowManager.createEscrow({
        seller: userId,
        buyer: 'buyer_1',
        amount: 30000,
        chain: 'xrpl',
        expirationDays: 7
      });

      await escrowManager.createEscrow({
        seller: 'seller_2',
        buyer: userId,
        amount: 45000,
        chain: 'ethereum',
        expirationDays: 7
      });

      const userMetrics = escrowManager.getUserAnalytics(userId);
      
      expect(userMetrics.totalEscrows).toBe(2);
      expect(userMetrics.asSellerCount).toBe(1);
      expect(userMetrics.asBuyerCount).toBe(1);
      expect(userMetrics.totalVolume).toBe(75000);
    });
  });
});
