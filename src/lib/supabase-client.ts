/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supabase Client Configuration for LuxBroker
 * World-class database client with type safety
 */

import { createClient } from '@supabase/supabase-js';
import type { Database as GeneratedDatabase } from '@/integrations/supabase/types';

// Compose generated Supabase types with LuxBroker tables used by services below
type ExtendedDatabase = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Tables' | 'Views' | 'Functions'> & {
    Tables: GeneratedDatabase['public']['Tables'] & {
      profiles: {
        Row: GeneratedDatabase['public']['Tables']['profiles']['Row'] & {
          wallet_address: string | null;
          role: string | null;
          is_broker: boolean | null;
          is_verified: boolean | null;
          username: string | null;
        };
        Insert: GeneratedDatabase['public']['Tables']['profiles']['Insert'] & {
          wallet_address?: string | null;
          role?: string | null;
          is_broker?: boolean | null;
          is_verified?: boolean | null;
          username?: string | null;
        };
        Update: GeneratedDatabase['public']['Tables']['profiles']['Update'] & {
          wallet_address?: string | null;
          role?: string | null;
          is_broker?: boolean | null;
          is_verified?: boolean | null;
          username?: string | null;
        };
        Relationships: GeneratedDatabase['public']['Tables']['profiles']['Relationships'];
      };

      assets: {
        Row: Omit<GeneratedDatabase['public']['Tables']['assets']['Row'], 'status'> & {
          status: string | null;
          has_video: boolean | null;
          video_url: string | null;
        };
        Insert: Omit<GeneratedDatabase['public']['Tables']['assets']['Insert'], 'status'> & {
          status?: string | null;
          has_video?: boolean | null;
          video_url?: string | null;
        };
        Update: Omit<GeneratedDatabase['public']['Tables']['assets']['Update'], 'status'> & {
          status?: string | null;
          has_video?: boolean | null;
          video_url?: string | null;
        };
        Relationships: GeneratedDatabase['public']['Tables']['assets']['Relationships'];
      };

      brokers: {
        Row: {
          id: string;
          wallet_address: string;
          referral_code: string;
          email: string | null;
          name: string | null;

          // Legacy schema (20250901)
          tier: 'bronze' | 'silver' | 'gold' | 'diamond' | string | null;
          commission_rate: number | null;
          total_sales_volume: number;
          total_commissions_earned: number | null;

          // Consolidated schema (20250902/20260105)
          tier_id: number | null;
          total_earnings: number | null;
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

          tier?: 'bronze' | 'silver' | 'gold' | 'diamond' | string;
          tier_id?: number;
          commission_rate?: number;

          total_sales_volume?: number;
          total_commissions_earned?: number;
          total_earnings?: number;
        };
        Update: {
          email?: string;
          name?: string;

          tier?: 'bronze' | 'silver' | 'gold' | 'diamond' | string;
          tier_id?: number;
          commission_rate?: number;

          total_sales_volume?: number;
          total_commissions_earned?: number;
          total_earnings?: number;
          referred_sellers_count?: number;
          status?: 'active' | 'suspended' | 'pending';
          kyc_verified?: boolean;
        };
        Relationships: [];
      };
      sellers: {
        Row: {
          id: string;
          wallet_address: string;
          // Legacy schema (20250901)
          referred_by: string | null;

          // Consolidated schema (20250902/20260105)
          referred_by_broker_id: string | null;
          referral_locked_until: string | null;
          total_sales: number;
          items_sold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wallet_address: string;
          referred_by?: string;
          referred_by_broker_id?: string | null;
          referral_locked_until?: string;
          total_sales?: number;
          items_sold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          referred_by?: string;
          referred_by_broker_id?: string | null;
          referral_locked_until?: string;
          total_sales?: number;
          items_sold?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      commissions: {
        Row: {
          id: string;
          broker_id: string;
          seller_id: string;
          sale_amount_usd: number;
          platform_fee_usd: number | null;
          commission_rate: number | null;
          status: 'pending' | 'paid' | 'failed' | 'cancelled' | string | null;

          // Legacy schema (20250901)
          sale_id: string | null;
          commission_amount_usd: number | null;
          broker_wallet: string | null;
          seller_wallet: string | null;
          tx_hash: string | null;

          // Consolidated schema (20260105)
          commission_usd: number | null;
          category: string | null;
          pay_method: string | null;
          auction: boolean | null;
          transaction_hash: string | null;

          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          broker_id: string;
          seller_id: string;
          sale_amount_usd: number;

          platform_fee_usd?: number | null;
          commission_rate?: number | null;
          status?: 'pending' | 'paid' | 'failed' | 'cancelled' | string | null;

          // Legacy fields
          sale_id?: string | null;
          commission_amount_usd?: number | null;
          broker_wallet?: string | null;
          seller_wallet?: string | null;
          tx_hash?: string | null;

          // Consolidated fields
          commission_usd?: number | null;
          category?: string | null;
          pay_method?: string | null;
          auction?: boolean | null;
          transaction_hash?: string | null;

          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          sale_amount_usd?: number;
          platform_fee_usd?: number | null;
          commission_rate?: number | null;
          status?: 'pending' | 'paid' | 'failed' | 'cancelled' | string | null;

          // Legacy fields
          sale_id?: string | null;
          commission_amount_usd?: number | null;
          broker_wallet?: string | null;
          seller_wallet?: string | null;
          tx_hash?: string | null;

          // Consolidated fields
          commission_usd?: number | null;
          category?: string | null;
          pay_method?: string | null;
          auction?: boolean | null;
          transaction_hash?: string | null;

          paid_at?: string | null;
        };
        Relationships: [];
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
          // Legacy schema (20250901)
          created_at: string | null;

          // Consolidated schema (20260105)
          clicked_at: string | null;
        };
        Insert: {
          broker_id: string;
          referral_code: string;
          ip_address?: string;
          user_agent?: string;
          referrer?: string;
          converted?: boolean;
          conversion_date?: string | null;
          created_at?: string;
          clicked_at?: string;
        };
        Update: {
          converted?: boolean;
          conversion_date?: string;
        };
        Relationships: [];
      };
      broker_tiers: {
        Row: {
          // Consolidated schema (20250902/20260105)
          id: number | null;
          name: string | null;
          min_referrals: number | null;
          min_sales_volume: number | null;
          commission_rate: number | null;
          color: string | null;
          icon: string | null;
          benefits: any;
          created_at: string | null;

          // Legacy schema (20250901)
          tier: string | null;
        };
        Insert: {
          id?: number;
          name?: string;
          min_referrals?: number;
          min_sales_volume?: number;
          commission_rate?: number;
          color?: string;
          icon?: string;
          benefits?: any;
          created_at?: string;

          tier?: string;
        };
        Update: {
          id?: number;
          name?: string;
          min_referrals?: number;
          min_sales_volume?: number;
          commission_rate?: number;
          color?: string;
          icon?: string;
          benefits?: any;
          created_at?: string;

          tier?: string;
        };
        Relationships: [];
      };

      listings: {
        Row: {
          id: string;
          asset_id: string | null;
          seller_id: string | null;
          seller_address: string;
          title: string;
          description: string | null;
          category: string;
          price_usd: number;
          currency: string | null;
          accepts_offers: boolean | null;
          minimum_offer: number | null;
          media_url: string | null;
          images: string[] | null;
          token_type: 'nft' | 'iou' | 'offchain' | string | null;
          status: 'pending' | 'approved' | 'sold' | 'cancelled' | 'expired' | string | null;
          approved: boolean | null;
          approved_at: string | null;
          approved_by: string | null;
          shipping_tier: string | null;
          ships_from_country: string | null;
          ships_from_state: string | null;
          specifications: any;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          sold_at: string | null;
        };
        Insert: {
          id?: string;
          asset_id?: string | null;
          seller_id?: string | null;
          seller_address: string;
          title: string;
          description?: string | null;
          category: string;
          price_usd: number;
          currency?: string | null;
          accepts_offers?: boolean | null;
          minimum_offer?: number | null;
          media_url?: string | null;
          images?: string[] | null;
          token_type?: 'nft' | 'iou' | 'offchain' | string | null;
          status?: 'pending' | 'approved' | 'sold' | 'cancelled' | 'expired' | string | null;
          approved?: boolean | null;
          approved_at?: string | null;
          approved_by?: string | null;
          shipping_tier?: string | null;
          ships_from_country?: string | null;
          ships_from_state?: string | null;
          specifications?: any;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          sold_at?: string | null;
        };
        Update: {
          asset_id?: string | null;
          seller_id?: string | null;
          seller_address?: string;
          title?: string;
          description?: string | null;
          category?: string;
          price_usd?: number;
          currency?: string | null;
          accepts_offers?: boolean | null;
          minimum_offer?: number | null;
          media_url?: string | null;
          images?: string[] | null;
          token_type?: 'nft' | 'iou' | 'offchain' | string | null;
          status?: 'pending' | 'approved' | 'sold' | 'cancelled' | 'expired' | string | null;
          approved?: boolean | null;
          approved_at?: string | null;
          approved_by?: string | null;
          shipping_tier?: string | null;
          ships_from_country?: string | null;
          ships_from_state?: string | null;
          specifications?: any;
          updated_at?: string;
          expires_at?: string | null;
          sold_at?: string | null;
        };
        Relationships: [];
      };

      escrow_transactions: {
        Row: {
          id: string;
          listing_id: string | null;
          asset_id: string | null;
          buyer_id: string | null;
          seller_id: string | null;
          buyer_address: string;
          seller_address: string;
          amount_usd: number;
          amount_xrp: number | null;
          platform_fee_usd: number | null;
          escrow_sequence: number | null;
          escrow_condition: string | null;
          escrow_fulfillment: string | null;
          status:
            | 'pending'
            | 'funded'
            | 'shipped'
            | 'delivered'
            | 'confirmed'
            | 'disputed'
            | 'released'
            | 'refunded'
            | 'cancelled'
            | string
            | null;
          tracking_number: string | null;
          carrier: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          dispute_reason: string | null;
          dispute_filed_at: string | null;
          dispute_resolved_at: string | null;
          created_at: string;
          updated_at: string;
          funded_at: string | null;
          released_at: string | null;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          asset_id?: string | null;
          buyer_id?: string | null;
          seller_id?: string | null;
          buyer_address: string;
          seller_address: string;
          amount_usd: number;
          amount_xrp?: number | null;
          platform_fee_usd?: number | null;
          escrow_sequence?: number | null;
          escrow_condition?: string | null;
          escrow_fulfillment?: string | null;
          status?:
            | 'pending'
            | 'funded'
            | 'shipped'
            | 'delivered'
            | 'confirmed'
            | 'disputed'
            | 'released'
            | 'refunded'
            | 'cancelled'
            | string
            | null;
          tracking_number?: string | null;
          carrier?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          dispute_reason?: string | null;
          dispute_filed_at?: string | null;
          dispute_resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          funded_at?: string | null;
          released_at?: string | null;
        };
        Update: {
          listing_id?: string | null;
          asset_id?: string | null;
          buyer_id?: string | null;
          seller_id?: string | null;
          buyer_address?: string;
          seller_address?: string;
          amount_usd?: number;
          amount_xrp?: number | null;
          platform_fee_usd?: number | null;
          escrow_sequence?: number | null;
          escrow_condition?: string | null;
          escrow_fulfillment?: string | null;
          status?:
            | 'pending'
            | 'funded'
            | 'shipped'
            | 'delivered'
            | 'confirmed'
            | 'disputed'
            | 'released'
            | 'refunded'
            | 'cancelled'
            | string
            | null;
          tracking_number?: string | null;
          carrier?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          dispute_reason?: string | null;
          dispute_filed_at?: string | null;
          dispute_resolved_at?: string | null;
          updated_at?: string;
          funded_at?: string | null;
          released_at?: string | null;
        };
        Relationships: [];
      };

      subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          plan: 'free' | 'pro' | 'enterprise' | string;
          status: 'active' | 'cancelled' | 'expired' | 'past_due' | string | null;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          plan?: 'free' | 'pro' | 'enterprise' | string;
          status?: 'active' | 'cancelled' | 'expired' | 'past_due' | string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          plan?: 'free' | 'pro' | 'enterprise' | string;
          status?: 'active' | 'cancelled' | 'expired' | 'past_due' | string | null;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          title: string;
          message: string;
          data: any;
          read: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          title: string;
          message: string;
          data?: any;
          read?: boolean | null;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          data?: any;
          read?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: GeneratedDatabase['public']['Views'] & {
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
        Relationships: [];
      };
    };
    Functions: GeneratedDatabase['public']['Functions'] & {
      set_config: {
        Args: {
          setting_name: string;
          new_value: string;
          is_local: boolean;
        };
        Returns: string;
      };
      increment_broker_sellers: {
        Args: {
          p_broker_id: string;
        };
        Returns: void;
      };
      mark_listing_sold: {
        Args: {
          p_listing_id: string;
        };
        Returns: void;
      };
      update_broker_stats: {
        Args: {
          p_broker_id: string;
          p_commission_amount: number;
          p_sale_amount: number;
        };
        Returns: void;
      };
      check_broker_tier_upgrade: {
        Args: {
          p_broker_id: string;
        };
        Returns: void;
      };
    };
  };
};

export type Database = ExtendedDatabase;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to set wallet context for RLS
export const setWalletContext = async (walletAddress: string) => {
  await (supabase as any).rpc('set_config', {
    setting_name: 'app.current_wallet',
    new_value: walletAddress,
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
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (broker?.id) {
        await supabase.rpc('increment_broker_sellers', { p_broker_id: broker.id });
      }
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

