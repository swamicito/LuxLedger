/**
 * LuxBroker Tier System
 * Manages broker tier upgrades and commission rates
 */

export interface BrokerTier {
  id: number;
  name: string;
  minReferrals: number;
  minSalesVolume: number;
  commissionRate: number;
  benefits: string[];
  color: string;
  icon: string;
}

export const BROKER_TIERS: BrokerTier[] = [
  {
    id: 1,
    name: 'Bronze',
    minReferrals: 0,
    minSalesVolume: 0,
    commissionRate: 0.03, // 3.0%
    benefits: ['Basic referral tracking', 'Monthly payouts', 'Email support'],
    color: '#CD7F32',
    icon: '🥉'
  },
  {
    id: 2,
    name: 'Silver',
    minReferrals: 5,
    minSalesVolume: 10000,
    commissionRate: 0.04, // 4.0%
    benefits: ['Priority support', 'Bi-weekly payouts', 'Advanced analytics'],
    color: '#C0C0C0',
    icon: '🥈'
  },
  {
    id: 3,
    name: 'Gold',
    minReferrals: 15,
    minSalesVolume: 50000,
    commissionRate: 0.05, // 5.0%
    benefits: ['Weekly payouts', 'Custom referral codes', 'Dedicated account manager'],
    color: '#FFD700',
    icon: '🥇'
  },
  {
    id: 4,
    name: 'Diamond',
    minReferrals: 30,
    minSalesVolume: 150000,
    commissionRate: 0.065, // 6.5%
    benefits: ['Daily payouts', 'VIP events', 'Revenue sharing bonuses'],
    color: '#B9F2FF',
    icon: '💎'
  }
];

export class TierSystem {
  /**
   * Calculate the appropriate tier for a broker based on their stats
   */
  static calculateTier(referralCount: number, totalSalesVolume: number): BrokerTier {
    // Find the highest tier the broker qualifies for
    let qualifiedTier = BROKER_TIERS[0]; // Default to Bronze
    
    for (const tier of BROKER_TIERS) {
      if (referralCount >= tier.minReferrals && totalSalesVolume >= tier.minSalesVolume) {
        qualifiedTier = tier;
      } else {
        break; // Tiers are ordered, so we can break early
      }
    }
    
    return qualifiedTier;
  }

  /**
   * Get tier by ID
   */
  static getTierById(tierId: number): BrokerTier | null {
    return BROKER_TIERS.find(tier => tier.id === tierId) || null;
  }

  /**
   * Get tier by name
   */
  static getTierByName(tierName: string): BrokerTier | null {
    return BROKER_TIERS.find(tier => tier.name.toLowerCase() === tierName.toLowerCase()) || null;
  }

  /**
   * Calculate commission amount based on tier
   */
  static calculateCommission(saleAmount: number, tier: BrokerTier): number {
    return saleAmount * tier.commissionRate;
  }

  /**
   * Get progress to next tier
   */
  static getProgressToNextTier(
    currentTier: BrokerTier, 
    referralCount: number, 
    totalSalesVolume: number
  ): {
    nextTier: BrokerTier | null;
    referralsNeeded: number;
    salesVolumeNeeded: number;
    progressPercentage: number;
  } {
    const currentTierIndex = BROKER_TIERS.findIndex(tier => tier.id === currentTier.id);
    const nextTier = currentTierIndex < BROKER_TIERS.length - 1 
      ? BROKER_TIERS[currentTierIndex + 1] 
      : null;

    if (!nextTier) {
      return {
        nextTier: null,
        referralsNeeded: 0,
        salesVolumeNeeded: 0,
        progressPercentage: 100
      };
    }

    const referralsNeeded = Math.max(0, nextTier.minReferrals - referralCount);
    const salesVolumeNeeded = Math.max(0, nextTier.minSalesVolume - totalSalesVolume);

    // Calculate progress percentage based on the more restrictive requirement
    const referralProgress = referralCount / nextTier.minReferrals;
    const volumeProgress = totalSalesVolume / nextTier.minSalesVolume;
    const progressPercentage = Math.min(referralProgress, volumeProgress) * 100;

    return {
      nextTier,
      referralsNeeded,
      salesVolumeNeeded,
      progressPercentage: Math.min(100, progressPercentage)
    };
  }

  /**
   * Check if broker qualifies for tier upgrade
   */
  static checkForUpgrade(
    currentTierId: number,
    referralCount: number,
    totalSalesVolume: number
  ): BrokerTier | null {
    const newTier = this.calculateTier(referralCount, totalSalesVolume);
    
    if (newTier.id > currentTierId) {
      return newTier;
    }
    
    return null;
  }

  /**
   * Get tier benefits formatted for display
   */
  static formatTierBenefits(tier: BrokerTier): string[] {
    return [
      `${(tier.commissionRate * 100).toFixed(1)}% commission rate`,
      ...tier.benefits
    ];
  }

  /**
   * Get tier requirements formatted for display
   */
  static formatTierRequirements(tier: BrokerTier): string {
    if (tier.id === 1) {
      return 'No requirements - Starting tier';
    }
    
    return `${tier.minReferrals}+ referrals and $${tier.minSalesVolume.toLocaleString()}+ in sales volume`;
  }
}

/**
 * Tier upgrade notification data
 */
export interface TierUpgradeNotification {
  brokerId: string;
  brokerWallet: string;
  oldTier: BrokerTier;
  newTier: BrokerTier;
  referralCount: number;
  totalSalesVolume: number;
  upgradeDate: string;
}

/**
 * Generate tier upgrade notification
 */
export function createTierUpgradeNotification(
  brokerId: string,
  brokerWallet: string,
  oldTier: BrokerTier,
  newTier: BrokerTier,
  referralCount: number,
  totalSalesVolume: number
): TierUpgradeNotification {
  return {
    brokerId,
    brokerWallet,
    oldTier,
    newTier,
    referralCount,
    totalSalesVolume,
    upgradeDate: new Date().toISOString()
  };
}
