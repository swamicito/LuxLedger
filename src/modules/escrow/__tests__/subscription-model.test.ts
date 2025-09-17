/**
 * Test suite for LuxGuard Subscription Model
 */

import { subscriptionManager, SubscriptionTier } from '../lib/subscription-model';

describe('LuxGuard Subscription Model', () => {
  beforeEach(() => {
    // Clear subscriptions between tests
    subscriptionManager['subscriptions'].clear();
  });

  describe('Subscription Plans', () => {
    it('should return correct plan details', () => {
      const basicPlan = subscriptionManager.getSubscriptionPlan('basic');
      const proPlan = subscriptionManager.getSubscriptionPlan('pro');
      const enterprisePlan = subscriptionManager.getSubscriptionPlan('enterprise');

      expect(basicPlan.monthlyPrice).toBe(0);
      expect(basicPlan.escrowDiscount).toBe(0);
      
      expect(proPlan.monthlyPrice).toBe(99);
      expect(proPlan.escrowDiscount).toBe(30);
      
      expect(enterprisePlan.monthlyPrice).toBe(499);
      expect(enterprisePlan.escrowDiscount).toBe(50);
    });

    it('should return all available plans', () => {
      const allPlans = subscriptionManager.getAllPlans();
      
      expect(allPlans).toHaveLength(3);
      expect(allPlans.map(p => p.tier)).toEqual(['basic', 'pro', 'enterprise']);
    });
  });

  describe('Subscription Creation', () => {
    it('should create monthly subscription', async () => {
      const subscription = await subscriptionManager.createSubscription({
        userId: 'user_123',
        tier: 'pro',
        billingCycle: 'monthly',
        paymentMethod: 'stripe_card_123'
      });

      expect(subscription.userId).toBe('user_123');
      expect(subscription.tier).toBe('pro');
      expect(subscription.billingCycle).toBe('monthly');
      expect(subscription.status).toBe('active');
      expect(subscription.monthlyVolumeUsed).toBe(0);
      expect(subscription.totalEscrowsSaved).toBe(0);
    });

    it('should create annual subscription with correct end date', async () => {
      const subscription = await subscriptionManager.createSubscription({
        userId: 'user_456',
        tier: 'enterprise',
        billingCycle: 'annual'
      });

      const yearFromNow = new Date();
      yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);
      
      expect(subscription.billingCycle).toBe('annual');
      expect(subscription.endDate.getFullYear()).toBe(yearFromNow.getFullYear());
    });
  });

  describe('Subscription Management', () => {
    let userId: string;

    beforeEach(async () => {
      userId = 'user_789';
      await subscriptionManager.createSubscription({
        userId,
        tier: 'basic',
        billingCycle: 'monthly'
      });
    });

    it('should upgrade subscription tier', async () => {
      const upgraded = await subscriptionManager.upgradeSubscription(userId, 'pro');
      
      expect(upgraded.tier).toBe('pro');
      expect(upgraded.userId).toBe(userId);
    });

    it('should change billing cycle during upgrade', async () => {
      const upgraded = await subscriptionManager.upgradeSubscription(userId, 'pro', 'annual');
      
      expect(upgraded.tier).toBe('pro');
      expect(upgraded.billingCycle).toBe('annual');
    });

    it('should cancel subscription', async () => {
      await subscriptionManager.cancelSubscription(userId);
      
      const subscription = subscriptionManager.getUserSubscription(userId);
      expect(subscription?.status).toBe('cancelled');
    });

    it('should handle non-existent subscription upgrades', async () => {
      await expect(subscriptionManager.upgradeSubscription('nonexistent', 'pro'))
        .rejects.toThrow('No active subscription found');
    });
  });

  describe('Escrow Discount Calculations', () => {
    it('should calculate subscription discounts correctly', async () => {
      const userId = 'user_discount';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'pro',
        billingCycle: 'monthly'
      });

      const discount = subscriptionManager.calculateEscrowDiscount(userId, 50000, 100000);
      
      expect(discount.subscriptionDiscount).toBe(30);
      expect(discount.volumeDiscount).toBe(0); // Pro users don't get volume discounts
      expect(discount.totalDiscount).toBe(30);
      expect(discount.tier).toBe('pro');
      expect(discount.savings).toBeGreaterThan(0);
    });

    it('should calculate volume discounts for basic users', () => {
      const userId = 'user_volume';
      
      // Basic user with high volume
      const discount = subscriptionManager.calculateEscrowDiscount(userId, 50000, 200000);
      
      expect(discount.subscriptionDiscount).toBe(0);
      expect(discount.volumeDiscount).toBe(10); // 100K-500K range
      expect(discount.totalDiscount).toBe(10);
      expect(discount.tier).toBe('basic');
    });

    it('should use higher of subscription or volume discount', () => {
      const userId = 'user_max';
      
      // Basic user with very high volume (15% discount)
      const basicDiscount = subscriptionManager.calculateEscrowDiscount(userId, 50000, 600000);
      expect(basicDiscount.totalDiscount).toBe(15);
      
      // Create pro subscription (30% discount)
      subscriptionManager.createSubscription({
        userId,
        tier: 'pro',
        billingCycle: 'monthly'
      });
      
      const proDiscount = subscriptionManager.calculateEscrowDiscount(userId, 50000, 600000);
      expect(proDiscount.totalDiscount).toBe(30); // Higher subscription discount
    });
  });

  describe('ROI Calculations', () => {
    it('should calculate upgrade ROI correctly', async () => {
      const userId = 'user_roi';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'basic',
        billingCycle: 'monthly'
      });

      const roi = subscriptionManager.calculateUpgradeROI(userId, 'pro', 100000);
      
      expect(roi.currentMonthlyCost).toBeGreaterThan(0);
      expect(roi.newMonthlyCost).toBeGreaterThan(0);
      expect(roi.breakEvenVolume).toBeGreaterThan(0);
      expect(['upgrade', 'stay', 'consider']).toContain(roi.recommendation);
    });

    it('should recommend upgrade for high-volume users', async () => {
      const userId = 'user_highvol';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'basic',
        billingCycle: 'monthly'
      });

      // High monthly volume should recommend upgrade
      const roi = subscriptionManager.calculateUpgradeROI(userId, 'pro', 500000);
      
      expect(roi.monthlySavings).toBeGreaterThan(0);
      expect(roi.roi).toBeGreaterThan(50);
      expect(roi.recommendation).toBe('upgrade');
    });

    it('should recommend staying for low-volume users', async () => {
      const userId = 'user_lowvol';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'basic',
        billingCycle: 'monthly'
      });

      // Low monthly volume should recommend staying
      const roi = subscriptionManager.calculateUpgradeROI(userId, 'pro', 5000);
      
      expect(roi.monthlySavings).toBeLessThanOrEqual(0);
      expect(roi.recommendation).toBe('stay');
    });
  });

  describe('Volume Limits', () => {
    it('should check volume limits for pro users', async () => {
      const userId = 'user_limits';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'pro',
        billingCycle: 'monthly'
      });

      // Track some volume usage
      const subscription = subscriptionManager.getUserSubscription(userId);
      if (subscription) {
        subscription.monthlyVolumeUsed = 400000;
      }

      const limitCheck = subscriptionManager.checkVolumeLimit(userId, 150000);
      
      expect(limitCheck.withinLimit).toBe(false); // Would exceed 500K limit
      expect(limitCheck.currentVolume).toBe(400000);
      expect(limitCheck.limit).toBe(500000);
      expect(limitCheck.remainingVolume).toBe(100000);
    });

    it('should allow unlimited volume for enterprise users', async () => {
      const userId = 'user_enterprise';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'enterprise',
        billingCycle: 'monthly'
      });

      const limitCheck = subscriptionManager.checkVolumeLimit(userId, 10000000);
      
      expect(limitCheck.withinLimit).toBe(true);
      expect(limitCheck.limit).toBe(Infinity);
      expect(limitCheck.remainingVolume).toBe(Infinity);
    });
  });

  describe('Usage Tracking', () => {
    it('should track escrow usage correctly', async () => {
      const userId = 'user_tracking';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'pro',
        billingCycle: 'monthly'
      });

      await subscriptionManager.trackEscrowUsage(userId, 50000, 500);
      await subscriptionManager.trackEscrowUsage(userId, 30000, 300);

      const subscription = subscriptionManager.getUserSubscription(userId);
      
      expect(subscription?.monthlyVolumeUsed).toBe(80000);
      expect(subscription?.totalEscrowsSaved).toBe(800);
    });

    it('should generate subscription analytics', async () => {
      const userId = 'user_analytics';
      
      await subscriptionManager.createSubscription({
        userId,
        tier: 'pro',
        billingCycle: 'monthly'
      });

      // Simulate usage
      const subscription = subscriptionManager.getUserSubscription(userId);
      if (subscription) {
        subscription.monthlyVolumeUsed = 150000;
        subscription.totalEscrowsSaved = 1200;
      }

      const analytics = subscriptionManager.getSubscriptionAnalytics(userId);
      
      expect(analytics).toBeDefined();
      expect(analytics?.totalSaved).toBe(1200);
      expect(analytics?.volumeThisMonth).toBe(150000);
      expect(analytics?.projectedAnnualSavings).toBe(14400);
    });

    it('should return null analytics for non-subscribers', () => {
      const analytics = subscriptionManager.getSubscriptionAnalytics('nonexistent');
      expect(analytics).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle subscription expiration', async () => {
      const userId = 'user_expired';
      
      const subscription = await subscriptionManager.createSubscription({
        userId,
        tier: 'pro',
        billingCycle: 'monthly'
      });

      // Manually set expiration date to past
      subscription.endDate = new Date(Date.now() - 86400000); // Yesterday
      subscription.status = 'expired';

      const discount = subscriptionManager.calculateEscrowDiscount(userId, 50000, 100000);
      
      // Expired subscription should not provide discounts
      expect(discount.subscriptionDiscount).toBe(0);
      expect(discount.tier).toBe('basic');
    });

    it('should handle suspended subscriptions', async () => {
      const userId = 'user_suspended';
      
      const subscription = await subscriptionManager.createSubscription({
        userId,
        tier: 'enterprise',
        billingCycle: 'monthly'
      });

      subscription.status = 'suspended';

      const discount = subscriptionManager.calculateEscrowDiscount(userId, 50000, 100000);
      
      // Suspended subscription should not provide discounts
      expect(discount.subscriptionDiscount).toBe(0);
      expect(discount.tier).toBe('basic');
    });
  });
});
