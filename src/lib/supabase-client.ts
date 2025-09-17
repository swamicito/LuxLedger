/**
 * Supabase Client Configuration for LuxBroker
 * World-class database client with type safety
 */

import { createClient } from '@supabase/supabase-js';

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      brokers: {
        Row: {
          id: string;
          wallet_address: string;
          referral_code: string;
          email: string | null;
          name: string | null;
          tier: 'bronze' | 'silver' | 'gold' | 'diamond';
          commission_rate: number;
          total_sales_volume: number;
          total_commissions_earned: number;
          referred_sellers_count: number;
          status: 'active' | 'suspended' | 'pending';
          kyc_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wallet_address: string;
          referral_code: string;
          email?: string;
          name?: string;
          tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
          commission_rate?: number;
        };
        Update: {
          email?: string;
          name?: string;
          tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
          commission_rate?: number;
          total_sales_volume?: number;
          total_commissions_earned?: number;
          referred_sellers_count?: number;
          status?: 'active' | 'suspended' | 'pending';
          kyc_verified?: boolean;
        };
      };
      sellers: {
        Row: {
          id: string;
          wallet_address: string;
          referred_by: string | null;
          referral_locked_until: string | null;
          total_sales: number;
          items_sold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wallet_address: string;
          referred_by?: string;
          referral_locked_until?: string;
        };
        Update: {
          total_sales?: number;
          items_sold?: number;
        };
      };
      commissions: {
        Row: {
          id: string;
          broker_id: string;
          seller_id: string;
          sale_id: string | null;
          sale_amount_usd: number;
          commission_amount_usd: number;
          commission_rate: number;
          broker_wallet: string;
          seller_wallet: string;
          tx_hash: string | null;
          status: 'pending' | 'paid' | 'failed' | 'cancelled';
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          broker_id: string;
          seller_id: string;
          sale_id?: string;
          sale_amount_usd: number;
          commission_amount_usd: number;
          commission_rate: number;
          broker_wallet: string;
          seller_wallet: string;
          tx_hash?: string;
          status?: 'pending' | 'paid' | 'failed' | 'cancelled';
        };
        Update: {
          tx_hash?: string;
          status?: 'pending' | 'paid' | 'failed' | 'cancelled';
          paid_at?: string;
        };
      };
      referral_clicks: {
        Row: {
          id: string;
          broker_id: string;
          referral_code: string;
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          converted: boolean;
          conversion_date: string | null;
          created_at: string;
        };
        Insert: {
          broker_id: string;
          referral_code: string;
          ip_address?: string;
          user_agent?: string;
          referrer?: string;
          converted?: boolean;
        };
        Update: {
          converted?: boolean;
          conversion_date?: string;
        };
      };
      broker_tiers: {
        Row: {
          tier: string;
          min_sales_volume: number;
          commission_rate: number;
          benefits: any;
          created_at: string;
        };
      };
    };
    Views: {
      broker_analytics: {
        Row: {
          id: string;
          wallet_address: string;
          referral_code: string;
          tier: string;
          commission_rate: number;
          total_sales_volume: number;
          total_commissions_earned: number;
          referred_sellers_count: number;
          total_commissions: number;
          total_clicks: number;
          conversion_rate: number;
          benefits: any;
        };
      };
    };
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to set wallet context for RLS
export const setWalletContext = async (walletAddress: string) => {
  await supabase.rpc('set_config', {
    setting_name: 'app.current_wallet',
    setting_value: walletAddress,
    is_local: true
  });
};

// Broker service functions
export const brokerService = {
  // Register new broker
  async register(walletAddress: string, referralCode: string, email?: string, name?: string) {
    const { data, error } = await supabase
      .from('brokers')
      .insert({
        wallet_address: walletAddress,
        referral_code: referralCode,
        email,
        name
      })
      .select()
      .single();

    return { data, error };
  },

  // Get broker by wallet address
  async getByWallet(walletAddress: string) {
    await setWalletContext(walletAddress);
    
    const { data, error } = await supabase
      .from('brokers')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    return { data, error };
  },

  // Get broker analytics
  async getAnalytics(walletAddress: string) {
    await setWalletContext(walletAddress);
    
    const { data, error } = await supabase
      .from('broker_analytics')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    return { data, error };
  },

  // Get broker by referral code
  async getByReferralCode(referralCode: string) {
    const { data, error } = await supabase
      .from('brokers')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    return { data, error };
  },

  // Update broker profile
  async updateProfile(walletAddress: string, updates: Database['public']['Tables']['brokers']['Update']) {
    await setWalletContext(walletAddress);
    
    const { data, error } = await supabase
      .from('brokers')
      .update(updates)
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    return { data, error };
  }
};

// Seller service functions
export const sellerService = {
  // Register new seller with optional referral
  async register(walletAddress: string, referralCode?: string) {
    const insertData: Database['public']['Tables']['sellers']['Insert'] = {
      wallet_address: walletAddress
    };

    if (referralCode) {
      // Verify referral code exists and set lock period
      const { data: broker } = await brokerService.getByReferralCode(referralCode);
      if (broker) {
        insertData.referred_by = referralCode;
        insertData.referral_locked_until = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days
      }
    }

    const { data, error } = await supabase
      .from('sellers')
      .insert(insertData)
      .select()
      .single();

    // Update broker's referred sellers count
    if (referralCode && !error) {
      await supabase.rpc('increment_referred_sellers', { referral_code: referralCode });
    }

    return { data, error };
  },

  // Get seller by wallet address
  async getByWallet(walletAddress: string) {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    return { data, error };
  }
};

// Commission service functions
export const commissionService = {
  // Create new commission record
  async create(commission: Database['public']['Tables']['commissions']['Insert']) {
    const { data, error } = await supabase
      .from('commissions')
      .insert(commission)
      .select()
      .single();

    return { data, error };
  },

  // Get commissions for broker
  async getForBroker(walletAddress: string) {
    await setWalletContext(walletAddress);
    
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('broker_wallet', walletAddress)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Update commission status
  async updateStatus(commissionId: string, status: 'pending' | 'paid' | 'failed' | 'cancelled', txHash?: string) {
    const updateData: Database['public']['Tables']['commissions']['Update'] = { status };
    
    if (txHash) updateData.tx_hash = txHash;
    if (status === 'paid') updateData.paid_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('commissions')
      .update(updateData)
      .eq('id', commissionId)
      .select()
      .single();

    return { data, error };
  }
};

// Referral tracking service
export const referralService = {
  // Track referral click
  async trackClick(referralCode: string, ipAddress?: string, userAgent?: string, referrer?: string) {
    // Get broker by referral code
    const { data: broker } = await brokerService.getByReferralCode(referralCode);
    if (!broker) return { data: null, error: new Error('Invalid referral code') };

    const { data, error } = await supabase
      .from('referral_clicks')
      .insert({
        broker_id: broker.id,
        referral_code: referralCode,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer
      })
      .select()
      .single();

    return { data, error };
  },

  // Mark referral as converted
  async markConverted(referralCode: string, ipAddress?: string) {
    const { data, error } = await supabase
      .from('referral_clicks')
      .update({
        converted: true,
        conversion_date: new Date().toISOString()
      })
      .eq('referral_code', referralCode)
      .eq('ip_address', ipAddress)
      .eq('converted', false)
      .select()
      .single();

    return { data, error };
  }
};

export type { Database };
