/**
 * LuxGuard Escrow Configuration
 * XRPL-first modular escrow layer with multi-chain expansion capability
 */

export interface EscrowTier {
  upTo: number;
  rate: number;
}

export interface EscrowChainConfig {
  label: string;
  network?: string;
  currency: string;
  escrowEnabled: boolean;
  module?: string;
  requiresDestinationTag?: boolean;
  comingSoon?: boolean;
  disputes: {
    enabled: boolean;
    resolver: string;
  };
  fees: {
    flatRate: number | null;
    tiers: EscrowTier[];
    capUSD: number;
  };
  explorer: string;
  rpcUrl?: string;
}

export const escrowChains: Record<string, EscrowChainConfig> = {
  xrpl: {
    label: "XRP Ledger",
    network: "testnet", // use 'mainnet' for production
    currency: "XRP",
    escrowEnabled: true,
    module: "xrpl",
    requiresDestinationTag: true,
    disputes: {
      enabled: true,
      resolver: "luxledger.dao"
    },
    fees: {
      flatRate: null,
      tiers: [
        { upTo: 10_000, rate: 0.015 },   // 1.5% under $10K
        { upTo: 50_000, rate: 0.01 },    // 1.0% between $10K-$50K
        { upTo: Infinity, rate: 0.005 }  // 0.5% over $50K
      ],
      capUSD: 1500
    },
    explorer: "https://testnet.xrpl.org/accounts/",
    rpcUrl: import.meta.env.VITE_XRPL_RPC_URL || "wss://s.altnet.rippletest.net:51233"
  },

  solana: {
    label: "Solana",
    currency: "SOL",
    escrowEnabled: false,
    comingSoon: true,
    disputes: {
      enabled: false,
      resolver: ""
    },
    fees: {
      flatRate: null,
      tiers: [],
      capUSD: 0
    },
    explorer: "https://explorer.solana.com/"
  },

  evm: {
    label: "Ethereum / Polygon",
    currency: "ETH",
    escrowEnabled: false,
    comingSoon: true,
    disputes: {
      enabled: false,
      resolver: ""
    },
    fees: {
      flatRate: null,
      tiers: [],
      capUSD: 0
    },
    explorer: "https://etherscan.io/"
  }
};

/**
 * Calculate escrow fee based on amount and chain configuration
 */
export function calculateEscrowFee(amountUSD: number, chain: string = 'xrpl'): {
  feeUSD: number;
  feeRate: number;
  tier: string;
  cappedAt: boolean;
} {
  const chainConfig = escrowChains[chain];
  
  if (!chainConfig || !chainConfig.escrowEnabled) {
    throw new Error(`Escrow not enabled for chain: ${chain}`);
  }

  // Find applicable tier
  const tier = chainConfig.fees.tiers.find(t => amountUSD <= t.upTo);
  
  if (!tier) {
    throw new Error('No applicable fee tier found');
  }

  let feeUSD = amountUSD * tier.rate;
  let cappedAt = false;

  // Apply fee cap if configured
  if (chainConfig.fees.capUSD > 0 && feeUSD > chainConfig.fees.capUSD) {
    feeUSD = chainConfig.fees.capUSD;
    cappedAt = true;
  }

  const tierLabel = tier.upTo === Infinity ? 'Premium' : 
                   tier.upTo === 50_000 ? 'Standard' : 'Basic';

  return {
    feeUSD: Math.round(feeUSD * 100) / 100, // Round to 2 decimals
    feeRate: tier.rate,
    tier: tierLabel,
    cappedAt
  };
}

/**
 * Get supported chains for escrow
 */
export function getSupportedEscrowChains(): string[] {
  return Object.keys(escrowChains).filter(chain => escrowChains[chain].escrowEnabled);
}

/**
 * Check if chain supports escrow
 */
export function isEscrowSupported(chain: string): boolean {
  return escrowChains[chain]?.escrowEnabled || false;
}

/**
 * Get chain configuration
 */
export function getChainConfig(chain: string): EscrowChainConfig | null {
  return escrowChains[chain] || null;
}

/**
 * Convert USD amount to chain native currency (mock conversion)
 * In production, this would use real-time exchange rates
 */
export function convertUSDToChainCurrency(amountUSD: number, chain: string): {
  amount: number;
  currency: string;
  exchangeRate: number;
} {
  const chainConfig = escrowChains[chain];
  
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  // Mock exchange rates - in production use real-time data
  const mockRates: Record<string, number> = {
    XRP: 0.52,  // 1 USD = ~1.92 XRP
    SOL: 140,   // 1 USD = ~0.007 SOL
    ETH: 2500   // 1 USD = ~0.0004 ETH
  };

  const rate = mockRates[chainConfig.currency] || 1;
  const amount = amountUSD / rate;

  return {
    amount: Math.round(amount * 1000000) / 1000000, // 6 decimal precision
    currency: chainConfig.currency,
    exchangeRate: rate
  };
}

/**
 * Generate escrow metadata
 */
export function generateEscrowMetadata(params: {
  assetId?: string;
  assetTitle?: string;
  assetCategory?: string;
  buyerAddress: string;
  sellerAddress: string;
  amountUSD: number;
  conditions?: string[];
}): string {
  return JSON.stringify({
    version: "1.0",
    platform: "luxledger",
    timestamp: Date.now(),
    asset: {
      id: params.assetId,
      title: params.assetTitle,
      category: params.assetCategory
    },
    parties: {
      buyer: params.buyerAddress,
      seller: params.sellerAddress
    },
    amount: {
      usd: params.amountUSD
    },
    conditions: params.conditions || [
      "Asset delivery confirmed",
      "Condition verification completed",
      "No disputes raised within 72 hours"
    ],
    disputeResolver: "luxledger.dao"
  });
}
