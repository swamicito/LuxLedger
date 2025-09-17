export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';
export type Chain = 'xrpl' | 'ethereum' | 'polygon' | 'solana';

export interface EscrowFeeInput {
  amountUSD: number;
  subscription?: SubscriptionTier;
  chain?: Chain;
}

export interface EscrowFeeOutput {
  feeUSD: number;
  feeRate: number;
  originalRate: number;
  discountApplied: number;
  flatCapApplied: boolean;
  notes: string[];
}

const FLAT_CAP_USD = 1000; // Maximum fee cap for very large transactions

const SUBSCRIPTION_DISCOUNTS = {
  basic: 0,
  pro: 0.3, // 30% discount
  enterprise: 0.5 // 50% discount
};

const CHAIN_MULTIPLIERS = {
  xrpl: 1.0,
  ethereum: 1.2, // Higher gas costs
  polygon: 0.9, // Lower costs
  solana: 0.95
};

export function calculateEscrowFee({ 
  amountUSD, 
  subscription = 'basic',
  chain = 'xrpl'
}: EscrowFeeInput): EscrowFeeOutput {
  const notes: string[] = [];
  
  // Determine base rate based on tiered structure
  let baseRate = 0.015; // 1.5% default
  
  if (amountUSD > 50000) {
    baseRate = 0.005; // 0.5% for >$50k
    notes.push('Tier: High-value transaction (0.5% base rate)');
  } else if (amountUSD > 10000) {
    baseRate = 0.01; // 1% for $10k-$50k
    notes.push('Tier: Mid-value transaction (1% base rate)');
  } else {
    notes.push('Tier: Standard transaction (1.5% base rate)');
  }

  // Apply chain multiplier
  const chainMultiplier = CHAIN_MULTIPLIERS[chain];
  let adjustedRate = baseRate * chainMultiplier;
  
  if (chainMultiplier !== 1.0) {
    notes.push(`Chain adjustment: ${chain} (${chainMultiplier}x)`);
  }

  // Apply subscription discount
  const discount = SUBSCRIPTION_DISCOUNTS[subscription];
  const discountedRate = adjustedRate * (1 - discount);
  
  if (discount > 0) {
    notes.push(`${subscription} subscription discount: ${(discount * 100).toFixed(0)}% off`);
  }

  // Calculate fee
  let feeUSD = amountUSD * discountedRate;
  let flatCapApplied = false;

  // Apply flat cap for very large transactions
  if (feeUSD > FLAT_CAP_USD) {
    feeUSD = FLAT_CAP_USD;
    flatCapApplied = true;
    notes.push(`Flat cap applied: Maximum fee of $${FLAT_CAP_USD.toLocaleString()}`);
  }

  return {
    feeUSD: +feeUSD.toFixed(2),
    feeRate: +discountedRate.toFixed(6),
    originalRate: +baseRate.toFixed(6),
    discountApplied: +((baseRate - discountedRate) / baseRate * 100).toFixed(1),
    flatCapApplied,
    notes
  };
}

// Subscription pricing calculator
export function calculateSubscriptionSavings(
  monthlyVolumeUSD: number,
  tier: SubscriptionTier
): { monthlySavings: number; breakEvenVolume: number } {
  const basicFees = calculateEscrowFee({ amountUSD: monthlyVolumeUSD, subscription: 'basic' });
  const tierFees = calculateEscrowFee({ amountUSD: monthlyVolumeUSD, subscription: tier });
  
  const monthlySavings = basicFees.feeUSD - tierFees.feeUSD;
  
  // Subscription costs (example pricing)
  const subscriptionCosts = {
    basic: 0,
    pro: 99, // $99/month
    enterprise: 499 // $499/month
  };
  
  const subscriptionCost = subscriptionCosts[tier];
  const breakEvenVolume = subscriptionCost / (basicFees.feeRate - tierFees.feeRate);
  
  return {
    monthlySavings: +monthlySavings.toFixed(2),
    breakEvenVolume: +breakEvenVolume.toFixed(0)
  };
}
