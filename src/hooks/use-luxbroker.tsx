/**
 * LuxBroker React Hook
 * Manages broker registration, seller attribution, and referral tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './use-wallet';
import { brokerService, sellerService, Database } from '../lib/supabase-client';
import { toast } from 'sonner';

type Broker = Database['public']['Tables']['brokers']['Row'];
type Seller = Database['public']['Tables']['sellers']['Row'];

interface UseLuxBrokerReturn {
  // Broker state
  broker: Broker | null;
  isBroker: boolean;
  brokerLoading: boolean;
  
  // Seller state
  seller: Seller | null;
  isSeller: boolean;
  sellerLoading: boolean;
  
  // Actions
  registerAsBroker: (email?: string, name?: string) => Promise<boolean>;
  registerAsSeller: () => Promise<boolean>;
  refreshBrokerData: () => Promise<void>;
  refreshSellerData: () => Promise<void>;
  
  // Referral utilities
  getReferralFromCookie: () => string | null;
  trackReferralClick: (referralCode: string) => void;
}

export const useLuxBroker = (): UseLuxBrokerReturn => {
  const { account } = useWallet();
  
  const [broker, setBroker] = useState<Broker | null>(null);
  const [brokerLoading, setBrokerLoading] = useState(false);
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);

  // Load broker data when wallet connects
  useEffect(() => {
    if (account?.address) {
      refreshBrokerData();
      refreshSellerData();
    } else {
      setBroker(null);
      setSeller(null);
    }
  }, [account?.address]);

  const refreshBrokerData = useCallback(async () => {
    if (!account?.address) return;

    try {
      setBrokerLoading(true);
      const { data, error } = await brokerService.getByWallet(account.address);
      
      if (error && !error.message.includes('No rows')) {
        throw error;
      }
      
      setBroker(data);
    } catch (error) {
      console.error('Error loading broker data:', error);
    } finally {
      setBrokerLoading(false);
    }
  }, [account?.address]);

  const refreshSellerData = useCallback(async () => {
    if (!account?.address) return;

    try {
      setSellerLoading(true);
      const { data, error } = await sellerService.getByWallet(account.address);
      
      if (error && !error.message.includes('No rows')) {
        throw error;
      }
      
      setSeller(data);
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setSellerLoading(false);
    }
  }, [account?.address]);

  const registerAsBroker = useCallback(async (email?: string, name?: string): Promise<boolean> => {
    if (!account?.address) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      setBrokerLoading(true);

      const response = await fetch('/.netlify/functions/broker-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.address,
          email,
          name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success('Successfully registered as LuxBroker affiliate!');
      await refreshBrokerData();
      return true;

    } catch (error) {
      console.error('Broker registration error:', error);
      toast.error((error as Error).message);
      return false;
    } finally {
      setBrokerLoading(false);
    }
  }, [account?.address, refreshBrokerData]);

  const registerAsSeller = useCallback(async (): Promise<boolean> => {
    if (!account?.address) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      setSellerLoading(true);

      const response = await fetch('/.netlify/functions/seller-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for referral tracking
        body: JSON.stringify({
          walletAddress: account.address
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      if (result.seller.referredBy) {
        toast.success(`Successfully registered with referral from ${result.seller.referredBy}!`);
      } else {
        toast.success('Successfully registered as seller!');
      }

      await refreshSellerData();
      return true;

    } catch (error) {
      console.error('Seller registration error:', error);
      toast.error((error as Error).message);
      return false;
    } finally {
      setSellerLoading(false);
    }
  }, [account?.address, refreshSellerData]);

  const getReferralFromCookie = useCallback((): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'lux_referral') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }, []);

  const trackReferralClick = useCallback((referralCode: string) => {
    // Create tracking pixel
    const img = new Image();
    img.src = `/.netlify/functions/track-referral?ref=${encodeURIComponent(referralCode)}&t=${Date.now()}`;
    
    // No need to append to DOM, just loading the image triggers the request
  }, []);

  return {
    // Broker state
    broker,
    isBroker: !!broker,
    brokerLoading,
    
    // Seller state
    seller,
    isSeller: !!seller,
    sellerLoading,
    
    // Actions
    registerAsBroker,
    registerAsSeller,
    refreshBrokerData,
    refreshSellerData,
    
    // Referral utilities
    getReferralFromCookie,
    trackReferralClick
  };
};
