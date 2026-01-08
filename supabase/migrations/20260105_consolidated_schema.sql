-- ============================================================================
-- LUXLEDGER CONSOLIDATED SCHEMA MIGRATION
-- Date: 2026-01-05
-- Purpose: Add broker/affiliate system + listings + missing tables to LuxLedger
-- 
-- SAFE TO RUN: Uses IF NOT EXISTS and DROP IF EXISTS throughout
-- ============================================================================

-- ============================================================================
-- PART 1: BROKER TIERS (Configuration table - must be created first)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.broker_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  min_referrals INTEGER NOT NULL DEFAULT 0,
  min_sales_volume DECIMAL(15,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,4) NOT NULL,
  color VARCHAR(7) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers (only if table is empty)
INSERT INTO public.broker_tiers (name, min_referrals, min_sales_volume, commission_rate, color, icon, benefits)
SELECT * FROM (VALUES
  ('Bronze', 0, 0::DECIMAL, 0.10::DECIMAL, '#CD7F32', '🥉', ARRAY['10% commission rate', 'Basic support', 'Monthly reports']),
  ('Silver', 5, 10000::DECIMAL, 0.12::DECIMAL, '#C0C0C0', '🥈', ARRAY['12% commission rate', 'Priority support', 'Weekly reports', 'Marketing materials']),
  ('Gold', 15, 50000::DECIMAL, 0.15::DECIMAL, '#FFD700', '🥇', ARRAY['15% commission rate', 'Dedicated support', 'Daily reports', 'Custom marketing', 'Early access']),
  ('Diamond', 50, 250000::DECIMAL, 0.20::DECIMAL, '#B9F2FF', '💎', ARRAY['20% commission rate', 'VIP support', 'Real-time analytics', 'White-label options', 'Revenue sharing'])
) AS v(name, min_referrals, min_sales_volume, commission_rate, color, icon, benefits)
WHERE NOT EXISTS (SELECT 1 FROM public.broker_tiers LIMIT 1);

-- ============================================================================
-- PART 2: BROKERS TABLE (Affiliate partners)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(50) UNIQUE NOT NULL,
  referral_code VARCHAR(12) UNIQUE NOT NULL,
  tier_id INTEGER REFERENCES public.broker_tiers(id) DEFAULT 1,
  total_earnings DECIMAL(15,2) DEFAULT 0,
  referred_sellers_count INTEGER DEFAULT 0,
  total_sales_volume DECIMAL(15,2) DEFAULT 0,
  email TEXT,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  kyc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 3: SELLERS TABLE (Users who list items, may be referred by brokers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(50) UNIQUE NOT NULL,
  referred_by_broker_id UUID REFERENCES public.brokers(id),
  referral_locked_until TIMESTAMP WITH TIME ZONE,
  total_sales DECIMAL(15,2) DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 4: COMMISSIONS TABLE (Track commission payments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.brokers(id),
  seller_id UUID REFERENCES public.sellers(id),
  sale_amount_usd DECIMAL(15,2) NOT NULL,
  commission_usd DECIMAL(15,2) NOT NULL,
  platform_fee_usd DECIMAL(15,2),
  commission_rate DECIMAL(5,4),
  category VARCHAR(50),
  pay_method VARCHAR(20),
  auction BOOLEAN DEFAULT FALSE,
  transaction_hash VARCHAR(128),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 5: REFERRAL CLICKS TABLE (Track referral link performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code VARCHAR(12) NOT NULL,
  broker_id UUID REFERENCES public.brokers(id),
  ip_address INET,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  conversion_date TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 6: BROKER NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.broker_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES public.brokers(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 7: LISTINGS TABLE (Marketplace listings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to asset (optional - can list without tokenized asset)
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  
  -- Seller info
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_address TEXT NOT NULL,
  
  -- Listing details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Pricing
  price_usd DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  accepts_offers BOOLEAN DEFAULT FALSE,
  minimum_offer DECIMAL(15,2),
  
  -- Media
  media_url TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Token type
  token_type TEXT DEFAULT 'offchain' CHECK (token_type IN ('nft', 'iou', 'offchain')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sold', 'cancelled', 'expired')),
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Shipping
  shipping_tier TEXT DEFAULT 'seller_managed',
  ships_from_country TEXT,
  ships_from_state TEXT,
  
  -- Metadata
  specifications JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- PART 8: ESCROW TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id),
  asset_id UUID REFERENCES public.assets(id),
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  buyer_address TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  
  -- Amounts
  amount_usd DECIMAL(15,2) NOT NULL,
  amount_xrp DECIMAL(20,6),
  platform_fee_usd DECIMAL(15,2),
  
  -- XRPL escrow details
  escrow_sequence INTEGER,
  escrow_condition TEXT,
  escrow_fulfillment TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'funded', 'shipped', 'delivered', 
    'confirmed', 'disputed', 'released', 'refunded', 'cancelled'
  )),
  
  -- Shipping
  tracking_number TEXT,
  carrier TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Dispute
  dispute_reason TEXT,
  dispute_filed_at TIMESTAMP WITH TIME ZONE,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  funded_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- PART 9: NOTIFICATIONS TABLE (General user notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 10: SUBSCRIPTIONS TABLE (For premium features)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 11: ADD COLUMNS TO PROFILES TABLE (if not exists)
-- ============================================================================

DO $$ 
BEGIN
  -- Add role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' 
      CHECK (role IN ('user', 'seller', 'broker', 'admin'));
  END IF;
  
  -- Add wallet_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN wallet_address TEXT;
  END IF;
  
  -- Add is_broker column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_broker'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_broker BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add is_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add username column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;
END $$;

-- ============================================================================
-- PART 12: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Broker indexes
CREATE INDEX IF NOT EXISTS idx_brokers_wallet ON public.brokers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_brokers_referral_code ON public.brokers(referral_code);
CREATE INDEX IF NOT EXISTS idx_brokers_tier ON public.brokers(tier_id);

-- Seller indexes
CREATE INDEX IF NOT EXISTS idx_sellers_wallet ON public.sellers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sellers_referred_by ON public.sellers(referred_by_broker_id);

-- Commission indexes
CREATE INDEX IF NOT EXISTS idx_commissions_broker ON public.commissions(broker_id);
CREATE INDEX IF NOT EXISTS idx_commissions_seller ON public.commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON public.commissions(created_at);

-- Referral clicks indexes
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON public.referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_broker ON public.referral_clicks(broker_id);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller_address ON public.listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_approved ON public.listings(approved);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price_usd);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at);

-- Escrow indexes
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON public.escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON public.escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_created_at ON public.escrow_transactions(created_at);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Broker notifications indexes
CREATE INDEX IF NOT EXISTS idx_broker_notifications_broker ON public.broker_notifications(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_notifications_read ON public.broker_notifications(broker_id, read);

-- ============================================================================
-- PART 13: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.broker_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 14: RLS POLICIES
-- ============================================================================

-- Broker tiers (public read)
DROP POLICY IF EXISTS "Broker tiers are public" ON public.broker_tiers;
CREATE POLICY "Broker tiers are public" ON public.broker_tiers FOR SELECT USING (true);

-- Brokers policies
DROP POLICY IF EXISTS "Public can view brokers" ON public.brokers;
CREATE POLICY "Public can view brokers" ON public.brokers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Brokers can update own data" ON public.brokers;
CREATE POLICY "Brokers can update own data" ON public.brokers 
  FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true));

-- Sellers policies
DROP POLICY IF EXISTS "Public can view sellers" ON public.sellers;
CREATE POLICY "Public can view sellers" ON public.sellers FOR SELECT USING (true);

-- Commissions policies
DROP POLICY IF EXISTS "Brokers can view own commissions" ON public.commissions;
CREATE POLICY "Brokers can view own commissions" ON public.commissions 
  FOR SELECT USING (
    broker_id IN (SELECT id FROM public.brokers WHERE wallet_address = current_setting('app.current_wallet', true))
  );

-- Referral clicks policies
DROP POLICY IF EXISTS "Brokers can view own clicks" ON public.referral_clicks;
CREATE POLICY "Brokers can view own clicks" ON public.referral_clicks 
  FOR SELECT USING (
    broker_id IN (SELECT id FROM public.brokers WHERE wallet_address = current_setting('app.current_wallet', true))
  );

-- Broker notifications policies
DROP POLICY IF EXISTS "Brokers can view own notifications" ON public.broker_notifications;
CREATE POLICY "Brokers can view own notifications" ON public.broker_notifications 
  FOR SELECT USING (
    broker_id IN (SELECT id FROM public.brokers WHERE wallet_address = current_setting('app.current_wallet', true))
  );

DROP POLICY IF EXISTS "Brokers can update own notifications" ON public.broker_notifications;
CREATE POLICY "Brokers can update own notifications" ON public.broker_notifications 
  FOR UPDATE USING (
    broker_id IN (SELECT id FROM public.brokers WHERE wallet_address = current_setting('app.current_wallet', true))
  );

-- Listings policies
DROP POLICY IF EXISTS "Anyone can view approved listings" ON public.listings;
CREATE POLICY "Anyone can view approved listings" ON public.listings
  FOR SELECT USING (approved = true AND status = 'approved');

DROP POLICY IF EXISTS "Sellers can view own listings" ON public.listings;
CREATE POLICY "Sellers can view own listings" ON public.listings
  FOR SELECT USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;
CREATE POLICY "Sellers can create listings" ON public.listings
  FOR INSERT WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can update own listings" ON public.listings;
CREATE POLICY "Sellers can update own listings" ON public.listings
  FOR UPDATE USING (seller_id = auth.uid() AND status IN ('pending', 'approved'));

DROP POLICY IF EXISTS "Sellers can delete own pending listings" ON public.listings;
CREATE POLICY "Sellers can delete own pending listings" ON public.listings
  FOR DELETE USING (seller_id = auth.uid() AND status = 'pending');

-- Escrow policies
DROP POLICY IF EXISTS "Users can view own escrows" ON public.escrow_transactions;
CREATE POLICY "Users can view own escrows" ON public.escrow_transactions
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- PART 15: HELPER FUNCTIONS
-- ============================================================================

-- Function to update broker stats
CREATE OR REPLACE FUNCTION public.update_broker_stats(
  p_broker_id UUID,
  p_commission_amount DECIMAL,
  p_sale_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.brokers 
  SET 
    total_earnings = total_earnings + p_commission_amount,
    total_sales_volume = total_sales_volume + p_sale_amount,
    updated_at = NOW()
  WHERE id = p_broker_id;
END;
$$;

-- Function to increment broker seller count
CREATE OR REPLACE FUNCTION public.increment_broker_sellers(p_broker_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.brokers 
  SET 
    referred_sellers_count = referred_sellers_count + 1,
    updated_at = NOW()
  WHERE id = p_broker_id;
END;
$$;

-- Function to check and upgrade broker tier
CREATE OR REPLACE FUNCTION public.check_broker_tier_upgrade(p_broker_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  broker_record RECORD;
  new_tier_id INTEGER;
BEGIN
  SELECT * INTO broker_record FROM public.brokers WHERE id = p_broker_id;
  
  SELECT id INTO new_tier_id
  FROM public.broker_tiers
  WHERE min_referrals <= broker_record.referred_sellers_count
    AND min_sales_volume <= broker_record.total_sales_volume
  ORDER BY commission_rate DESC
  LIMIT 1;
  
  IF new_tier_id IS NOT NULL AND new_tier_id > broker_record.tier_id THEN
    UPDATE public.brokers 
    SET tier_id = new_tier_id, updated_at = NOW()
    WHERE id = p_broker_id;
    
    INSERT INTO public.broker_notifications (broker_id, type, title, message, data)
    VALUES (
      p_broker_id,
      'tier_upgrade',
      'Tier Upgrade!',
      'Congratulations! You have been upgraded to a new tier.',
      jsonb_build_object('old_tier_id', broker_record.tier_id, 'new_tier_id', new_tier_id)
    );
  END IF;
END;
$$;

-- Function to mark listing as sold
CREATE OR REPLACE FUNCTION public.mark_listing_sold(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.listings 
  SET 
    status = 'sold',
    sold_at = NOW(),
    updated_at = NOW()
  WHERE id = p_listing_id;
END;
$$;

-- Function for broker leaderboard (from LuxBroker backup)
CREATE OR REPLACE FUNCTION public.broker_public_leaderboard(
  period TEXT DEFAULT 'all',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  referral_code TEXT,
  tier_name TEXT,
  tier_color TEXT,
  tier_icon TEXT,
  total_sales_usd NUMERIC,
  total_commission_usd NUMERIC,
  sellers_count INTEGER,
  last_sale TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_commissions AS (
    SELECT c.*, b.referral_code as ref_code, bt.name as t_name, bt.color as t_color, bt.icon as t_icon
    FROM public.commissions c
    JOIN public.brokers b ON b.id = c.broker_id
    JOIN public.broker_tiers bt ON b.tier_id = bt.id
    WHERE
      CASE
        WHEN period = 'week' THEN c.created_at >= date_trunc('week', NOW())
        WHEN period = 'month' THEN c.created_at >= date_trunc('month', NOW())
        ELSE TRUE
      END
  )
  SELECT
    fc.ref_code::TEXT as referral_code,
    fc.t_name::TEXT as tier_name,
    fc.t_color::TEXT as tier_color,
    fc.t_icon::TEXT as tier_icon,
    COALESCE(SUM(fc.sale_amount_usd), 0) as total_sales_usd,
    COALESCE(SUM(fc.commission_usd), 0) as total_commission_usd,
    COUNT(DISTINCT fc.seller_id)::INTEGER as sellers_count,
    MAX(fc.created_at) as last_sale
  FROM filtered_commissions fc
  GROUP BY fc.ref_code, fc.t_name, fc.t_color, fc.t_icon
  ORDER BY total_commission_usd DESC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================================================
-- PART 16: TRIGGERS
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_brokers_updated_at ON public.brokers;
CREATE TRIGGER set_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_sellers_updated_at ON public.sellers;
CREATE TRIGGER set_sellers_updated_at
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_listings_updated_at ON public.listings;
CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_escrow_updated_at ON public.escrow_transactions;
CREATE TRIGGER set_escrow_updated_at
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================================
-- PART 17: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.broker_tiers TO anon, authenticated;
GRANT SELECT ON public.brokers TO anon, authenticated;
GRANT SELECT ON public.sellers TO anon, authenticated;
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT ALL ON public.listings TO authenticated;
GRANT ALL ON public.escrow_transactions TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- 
-- Tables added:
--   - broker_tiers (with default data)
--   - brokers
--   - sellers
--   - commissions
--   - referral_clicks
--   - broker_notifications
--   - listings
--   - escrow_transactions
--   - notifications
--   - subscriptions
--
-- Columns added to profiles:
--   - role, wallet_address, is_broker, is_verified, username
--
-- Functions added:
--   - update_broker_stats
--   - increment_broker_sellers
--   - check_broker_tier_upgrade
--   - mark_listing_sold
--   - broker_public_leaderboard
-- ============================================================================
