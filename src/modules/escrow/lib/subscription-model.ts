/**
 * Subscription Model for LuxGuard Escrow
 * Provides tiered pricing with reduced rates for frequent users
 */

export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  escrowDiscount: number; // Percentage discount on escrow fees
  maxMonthlyVolume?: number; // USD limit for the tier
  prioritySupport: boolean;
  customArbitrators: boolean;
  advancedAnalytics: boolean;
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  monthlyVolumeUsed: number;
  totalEscrowsSaved: number;
  nextBillingDate: Date;
  paymentMethod?: string;
}

export interface VolumeDiscount {
  minVolume: number;
  maxVolume: number;
  discountPercent: number;
  description: string;
}

const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  basic: {
    tier: 'basic',
    name: 'Basic',
    description: 'Perfect for occasional luxury transactions',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Standard escrow protection',
      'Community dispute resolution',
      'Basic transaction analytics',
      'Email support'
    ],
    escrowDiscount: 0,
    prioritySupport: false,
    customArbitrators: false,
    advancedAnalytics: false
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    description: 'For regular luxury asset traders and collectors',
    monthlyPrice: 99,
    annualPrice: 990, // 2 months free
    features: [
      'All Basic features',
      '30% discount on escrow fees',
      'Priority dispute resolution',
      'Advanced transaction analytics',
      'Priority email & chat support',
      'Custom escrow conditions',
      'Up to $500K monthly volume'
    ],
    escrowDiscount: 30,
    maxMonthlyVolume: 500000,
    prioritySupport: true,
    customArbitrators: false,
    advancedAnalytics: true
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For luxury dealers, auction houses, and high-volume traders',
    monthlyPrice: 499,
    annualPrice: 4990, // 2 months free
    features: [
      'All Pro features',
      '50% discount on escrow fees',
      'Dedicated expert arbitrators',
      'White-label escrow solutions',
      'Custom integration support',
      'Dedicated account manager',
      'Unlimited monthly volume',
      'Custom contract terms'
    ],
    escrowDiscount: 50,
    prioritySupport: true,
    customArbitrators: true,
    advancedAnalytics: true
  }
};

// Volume-based discounts for non-subscribers
const VOLUME_DISCOUNTS: VolumeDiscount[] = [
  {
    minVolume: 0,
    maxVolume: 25000,
    discountPercent: 0,
    description: 'Standard rates'
  },
  {
    minVolume: 25000,
    maxVolume: 100000,
    discountPercent: 5,
    description: '5% volume discount'
  },
  {
    minVolume: 100000,
    maxVolume: 500000,
    discountPercent: 10,
    description: '10% volume discount'
  },
  {
    minVolume: 500000,
    maxVolume: Infinity,
    discountPercent: 15,
    description: '15% volume discount'
  }
];

export class SubscriptionManager {
  private subscriptions: Map<string, UserSubscription> = new Map();

  /**
   * Get subscription plan details
   */
  getSubscriptionPlan(tier: SubscriptionTier): SubscriptionPlan {
    return SUBSCRIPTION_PLANS[tier];
  }

  /**
   * Get all available subscription plans
   */
  getAllPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Create new subscription
   */
  async createSubscription(params: {
    userId: string;
    tier: SubscriptionTier;
    billingCycle: BillingCycle;
    paymentMethod?: string;
  }): Promise<UserSubscription> {
    const plan = SUBSCRIPTION_PLANS[params.tier];
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (params.billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription: UserSubscription = {
      userId: params.userId,
      tier: params.tier,
      billingCycle: params.billingCycle,
      startDate,
      endDate,
      status: 'active',
      monthlyVolumeUsed: 0,
      totalEscrowsSaved: 0,
      nextBillingDate: new Date(endDate),
      paymentMethod: params.paymentMethod
    };

    this.subscriptions.set(params.userId, subscription);
    return subscription;
  }

  /**
   * Get user subscription
   */
  getUserSubscription(userId: string): UserSubscription | null {
    return this.subscriptions.get(userId) || null;
  }

  /**
   * Update subscription tier
   */
  async upgradeSubscription(
    userId: string, 
    newTier: SubscriptionTier,
    billingCycle?: BillingCycle
  ): Promise<UserSubscription> {
    const currentSub = this.subscriptions.get(userId);
    
    if (!currentSub) {
      throw new Error('No active subscription found');
    }

    const newPlan = SUBSCRIPTION_PLANS[newTier];
    const updatedSub: UserSubscription = {
      ...currentSub,
      tier: newTier,
      billingCycle: billingCycle || currentSub.billingCycle
    };

    this.subscriptions.set(userId, updatedSub);
    return updatedSub;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = this.subscriptions.get(userId);
    
    if (!subscription) {
      throw new Error('No subscription found');
    }

    subscription.status = 'cancelled';
    // Subscription remains active until end date
  }

  /**
   * Calculate escrow discount for user
   */
  calculateEscrowDiscount(
    userId: string, 
    transactionAmount: number,
    monthlyVolume: number
  ): {
    subscriptionDiscount: number;
    volumeDiscount: number;
    totalDiscount: number;
    tier: SubscriptionTier;
    savings: number;
  } {
    const subscription = this.getUserSubscription(userId);
    let subscriptionDiscount = 0;
    let tier: SubscriptionTier = 'basic';

    if (subscription && subscription.status === 'active') {
      const plan = SUBSCRIPTION_PLANS[subscription.tier];
      subscriptionDiscount = plan.escrowDiscount;
      tier = subscription.tier;
    }

    // Calculate volume discount for basic users
    let volumeDiscount = 0;
    if (tier === 'basic') {
      const volumeTier = VOLUME_DISCOUNTS.find(
        vd => monthlyVolume >= vd.minVolume && monthlyVolume < vd.maxVolume
      );
      volumeDiscount = volumeTier?.discountPercent || 0;
    }

    // Use the higher of subscription or volume discount
    const totalDiscount = Math.max(subscriptionDiscount, volumeDiscount);
    
    // Calculate base escrow fee (using the fee engine logic)
    const baseFeeRate = transactionAmount > 50000 ? 0.005 : 
                       transactionAmount > 10000 ? 0.01 : 0.015;
    const baseFee = transactionAmount * baseFeeRate;
    const savings = baseFee * (totalDiscount / 100);

    return {
      subscriptionDiscount,
      volumeDiscount,
      totalDiscount,
      tier,
      savings
    };
  }

  /**
   * Track escrow usage for subscription analytics
   */
  async trackEscrowUsage(
    userId: string, 
    transactionAmount: number, 
    feesSaved: number
  ): Promise<void> {
    const subscription = this.subscriptions.get(userId);
    
    if (subscription) {
      subscription.monthlyVolumeUsed += transactionAmount;
      subscription.totalEscrowsSaved += feesSaved;
    }
  }

  /**
   * Calculate ROI for subscription upgrade
   */
  calculateUpgradeROI(
    userId: string,
    targetTier: SubscriptionTier,
    projectedMonthlyVolume: number
  ): {
    currentMonthlyCost: number;
    newMonthlyCost: number;
    monthlySavings: number;
    breakEvenVolume: number;
    roi: number;
    recommendation: 'upgrade' | 'stay' | 'consider';
  } {
    const currentSub = this.getUserSubscription(userId);
    const currentTier = currentSub?.tier || 'basic';
    
    const currentPlan = SUBSCRIPTION_PLANS[currentTier];
    const targetPlan = SUBSCRIPTION_PLANS[targetTier];

    // Calculate current monthly costs
    const currentSubscriptionCost = currentPlan.monthlyPrice;
    const currentEscrowFees = this.calculateMonthlyEscrowFees(
      projectedMonthlyVolume, 
      currentPlan.escrowDiscount
    );
    const currentMonthlyCost = currentSubscriptionCost + currentEscrowFees;

    // Calculate new monthly costs
    const newSubscriptionCost = targetPlan.monthlyPrice;
    const newEscrowFees = this.calculateMonthlyEscrowFees(
      projectedMonthlyVolume, 
      targetPlan.escrowDiscount
    );
    const newMonthlyCost = newSubscriptionCost + newEscrowFees;

    const monthlySavings = currentMonthlyCost - newMonthlyCost;
    const roi = monthlySavings > 0 ? (monthlySavings / newSubscriptionCost) * 100 : 0;

    // Calculate break-even volume
    const subscriptionCostDiff = targetPlan.monthlyPrice - currentPlan.monthlyPrice;
    const discountDiff = (targetPlan.escrowDiscount - currentPlan.escrowDiscount) / 100;
    const breakEvenVolume = discountDiff > 0 ? subscriptionCostDiff / (0.015 * discountDiff) : Infinity;

    let recommendation: 'upgrade' | 'stay' | 'consider';
    if (roi > 50) recommendation = 'upgrade';
    else if (roi > 20) recommendation = 'consider';
    else recommendation = 'stay';

    return {
      currentMonthlyCost,
      newMonthlyCost,
      monthlySavings,
      breakEvenVolume,
      roi,
      recommendation
    };
  }

  private calculateMonthlyEscrowFees(volume: number, discountPercent: number): number {
    // Simplified calculation - would use actual fee engine
    const baseFeeRate = 0.015; // 1.5% average
    const baseFees = volume * baseFeeRate;
    return baseFees * (1 - discountPercent / 100);
  }

  /**
   * Get subscription analytics
   */
  getSubscriptionAnalytics(userId: string): {
    totalSaved: number;
    volumeThisMonth: number;
    escrowsThisMonth: number;
    averageTransactionSize: number;
    projectedAnnualSavings: number;
  } | null {
    const subscription = this.getUserSubscription(userId);
    
    if (!subscription) return null;

    const averageTransactionSize = subscription.monthlyVolumeUsed > 0 ? 
      subscription.monthlyVolumeUsed / Math.max(1, subscription.totalEscrowsSaved) : 0;

    return {
      totalSaved: subscription.totalEscrowsSaved,
      volumeThisMonth: subscription.monthlyVolumeUsed,
      escrowsThisMonth: Math.floor(subscription.monthlyVolumeUsed / Math.max(averageTransactionSize, 1)),
      averageTransactionSize,
      projectedAnnualSavings: subscription.totalEscrowsSaved * 12
    };
  }

  /**
   * Check if user is within volume limits
   */
  checkVolumeLimit(userId: string, transactionAmount: number): {
    withinLimit: boolean;
    currentVolume: number;
    limit: number;
    remainingVolume: number;
  } {
    const subscription = this.getUserSubscription(userId);
    
    if (!subscription || subscription.tier === 'enterprise') {
      return {
        withinLimit: true,
        currentVolume: subscription?.monthlyVolumeUsed || 0,
        limit: Infinity,
        remainingVolume: Infinity
      };
    }

    const plan = SUBSCRIPTION_PLANS[subscription.tier];
    const limit = plan.maxMonthlyVolume || Infinity;
    const currentVolume = subscription.monthlyVolumeUsed;
    const newVolume = currentVolume + transactionAmount;
    
    return {
      withinLimit: newVolume <= limit,
      currentVolume,
      limit,
      remainingVolume: Math.max(0, limit - currentVolume)
    };
  }
}

// Global subscription manager instance
export const subscriptionManager = new SubscriptionManager();
