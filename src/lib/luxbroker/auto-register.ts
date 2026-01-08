/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Auto-register seller functionality
 * Automatically registers sellers when they connect their wallet
 */

import { toast } from 'sonner';

export interface AutoRegisterConfig {
  apiEndpoint?: string;
  enableToasts?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export class AutoRegisterService {
  private config: AutoRegisterConfig;

  constructor(config: AutoRegisterConfig = {}) {
    this.config = {
      apiEndpoint: '/.netlify/functions/api-broker-register',
      enableToasts: true,
      ...config
    };
  }

  /**
   * Auto-register seller on wallet connection
   */
  async registerSeller(walletAddress: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!walletAddress || !walletAddress.startsWith('r')) {
        throw new Error('Invalid wallet address');
      }

      const response = await fetch(this.config.apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for referral tracking
        body: JSON.stringify({ wallet_address: walletAddress })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Handle success
      if (this.config.enableToasts) {
        if (result.referredBy) {
          toast.success(`🎉 Welcome! You've been referred by ${result.referredBy}`);
        } else if (result.message?.includes('already registered')) {
          // Don't show toast for already registered users
        } else {
          toast.success('Successfully registered as seller!');
        }
      }

      this.config.onSuccess?.(result);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (this.config.enableToasts) {
        toast.error(`Registration failed: ${errorMessage}`);
      }

      this.config.onError?.(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if seller is already registered
   */
  async checkSellerStatus(walletAddress: string): Promise<{ isRegistered: boolean; seller?: any }> {
    try {
      // This would typically be a separate endpoint, but we can use the register endpoint
      // which returns existing seller data if already registered
      const response = await fetch(this.config.apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ wallet_address: walletAddress })
      });

      const result = await response.json();

      if (response.ok && result.seller) {
        return {
          isRegistered: true,
          seller: result.seller
        };
      }

      return { isRegistered: false };

    } catch (error) {
      console.error('Error checking seller status:', error);
      return { isRegistered: false };
    }
  }

  /**
   * Get referral code from cookie
   */
  getReferralFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'ref' || name === 'lux_referral') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Record a sale and trigger commission calculation
   */
  async recordSale(walletAddress: string, saleAmountUSD: number, saleId?: string): Promise<{ success: boolean; commission?: number; error?: string }> {
    try {
      const response = await fetch('/.netlify/functions/api-record-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          sale_amount_usd: saleAmountUSD,
          sale_id: saleId || `sale_${Date.now()}`
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record sale');
      }

      if (this.config.enableToasts && result.commission > 0) {
        toast.success(`💰 Commission of $${result.commission.toFixed(2)} recorded for broker!`);
      }

      return {
        success: true,
        commission: result.commission
      };

    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (this.config.enableToasts) {
        toast.error(`Failed to record sale: ${errorMessage}`);
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

// Default instance for easy use
export const autoRegister = new AutoRegisterService();

// React hook for auto-registration
export function useAutoRegister(config?: AutoRegisterConfig) {
  const service = new AutoRegisterService(config);

  return {
    registerSeller: service.registerSeller.bind(service),
    checkSellerStatus: service.checkSellerStatus.bind(service),
    getReferralFromCookie: service.getReferralFromCookie.bind(service),
    recordSale: service.recordSale.bind(service)
  };
}
