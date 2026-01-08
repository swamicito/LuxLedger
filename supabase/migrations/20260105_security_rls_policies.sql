-- ============================================================
-- LuxLedger Security RLS Policies Migration
-- Date: 2026-01-05
-- Purpose: Enforce server-side role-based access control
-- ============================================================

-- Enable RLS on all critical tables
ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES TABLE POLICIES
-- ============================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- ASSETS TABLE POLICIES
-- ============================================================

-- Anyone can view live/public assets
DROP POLICY IF EXISTS "Anyone can view public assets" ON assets;
CREATE POLICY "Anyone can view public assets" ON assets
  FOR SELECT USING (status = 'live');

-- Sellers can view their own assets (any status)
DROP POLICY IF EXISTS "Sellers can view own assets" ON assets;
CREATE POLICY "Sellers can view own assets" ON assets
  FOR SELECT USING (owner_id = auth.uid());

-- Sellers can create assets
DROP POLICY IF EXISTS "Sellers can create assets" ON assets;
CREATE POLICY "Sellers can create assets" ON assets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Sellers can update their own assets (except status changes to 'live')
DROP POLICY IF EXISTS "Sellers can update own assets" ON assets;
CREATE POLICY "Sellers can update own assets" ON assets
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid() 
    AND (status != 'live' OR status = (SELECT status FROM assets WHERE id = assets.id))
  );

-- Sellers can delete their own draft/rejected assets
DROP POLICY IF EXISTS "Sellers can delete own draft assets" ON assets;
CREATE POLICY "Sellers can delete own draft assets" ON assets
  FOR DELETE USING (
    owner_id = auth.uid() 
    AND status IN ('draft', 'rejected', 'archived')
  );

-- Admins can do everything with assets
DROP POLICY IF EXISTS "Admins full access to assets" ON assets;
CREATE POLICY "Admins full access to assets" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================

-- Users can view transactions where they are buyer or seller
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );

-- Admins can view all transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- ESCROW TRANSACTIONS TABLE POLICIES
-- ============================================================

-- Users can view escrow transactions where they are buyer or seller
DROP POLICY IF EXISTS "Users can view own escrow transactions" ON escrow_transactions;
CREATE POLICY "Users can view own escrow transactions" ON escrow_transactions
  FOR SELECT USING (
    buyer_id = auth.uid() OR seller_id = auth.uid()
  );

-- Admins can view all escrow transactions
DROP POLICY IF EXISTS "Admins can view all escrow transactions" ON escrow_transactions;
CREATE POLICY "Admins can view all escrow transactions" ON escrow_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================

-- Users can only view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================

-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- BROKERS TABLE POLICIES (Enhanced)
-- ============================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Brokers can view own data" ON brokers;
DROP POLICY IF EXISTS "Brokers can update own data" ON brokers;

-- Brokers can view their own data
CREATE POLICY "Brokers can view own data" ON brokers
  FOR SELECT USING (
    wallet_address = (
      SELECT wallet_address FROM profiles WHERE id = auth.uid()
    )
  );

-- Brokers can update limited fields on their own record
CREATE POLICY "Brokers can update own data" ON brokers
  FOR UPDATE USING (
    wallet_address = (
      SELECT wallet_address FROM profiles WHERE id = auth.uid()
    )
  );

-- Public can view broker tier info (for leaderboard)
DROP POLICY IF EXISTS "Public can view broker tiers" ON brokers;
CREATE POLICY "Public can view broker tiers" ON brokers
  FOR SELECT USING (true);

-- Admins can do everything with brokers
DROP POLICY IF EXISTS "Admins full access to brokers" ON brokers;
CREATE POLICY "Admins full access to brokers" ON brokers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- COMMISSIONS TABLE POLICIES (Enhanced)
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Brokers can view own commissions" ON commissions;

-- Brokers can view their own commissions
CREATE POLICY "Brokers can view own commissions" ON commissions
  FOR SELECT USING (
    broker_id IN (
      SELECT b.id FROM brokers b
      JOIN profiles p ON b.wallet_address = p.wallet_address
      WHERE p.id = auth.uid()
    )
  );

-- Admins can view all commissions
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
CREATE POLICY "Admins can view all commissions" ON commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only service role can insert/update commissions (via serverless functions)
-- No direct user access for writes

-- ============================================================
-- SELLERS TABLE POLICIES (Enhanced)
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Sellers can view own data" ON sellers;

-- Sellers can view their own data
CREATE POLICY "Sellers can view own data" ON sellers
  FOR SELECT USING (
    wallet_address = (
      SELECT wallet_address FROM profiles WHERE id = auth.uid()
    )
  );

-- Brokers can view their referred sellers (limited data)
DROP POLICY IF EXISTS "Brokers can view referred sellers" ON sellers;
CREATE POLICY "Brokers can view referred sellers" ON sellers
  FOR SELECT USING (
    referred_by_broker_id IN (
      SELECT b.id FROM brokers b
      JOIN profiles p ON b.wallet_address = p.wallet_address
      WHERE p.id = auth.uid()
    )
  );

-- Admins can view all sellers
DROP POLICY IF EXISTS "Admins can view all sellers" ON sellers;
CREATE POLICY "Admins can view all sellers" ON sellers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- REFERRAL CLICKS TABLE POLICIES
-- ============================================================

-- Brokers can view their own referral clicks
DROP POLICY IF EXISTS "Brokers can view own referral clicks" ON referral_clicks;
CREATE POLICY "Brokers can view own referral clicks" ON referral_clicks
  FOR SELECT USING (
    broker_id IN (
      SELECT b.id FROM brokers b
      JOIN profiles p ON b.wallet_address = p.wallet_address
      WHERE p.id = auth.uid()
    )
  );

-- ============================================================
-- BROKER NOTIFICATIONS TABLE POLICIES
-- ============================================================

-- Brokers can view their own notifications
DROP POLICY IF EXISTS "Brokers can view own notifications" ON broker_notifications;
CREATE POLICY "Brokers can view own notifications" ON broker_notifications
  FOR SELECT USING (
    broker_id IN (
      SELECT b.id FROM brokers b
      JOIN profiles p ON b.wallet_address = p.wallet_address
      WHERE p.id = auth.uid()
    )
  );

-- Brokers can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Brokers can update own notifications" ON broker_notifications;
CREATE POLICY "Brokers can update own notifications" ON broker_notifications
  FOR UPDATE USING (
    broker_id IN (
      SELECT b.id FROM brokers b
      JOIN profiles p ON b.wallet_address = p.wallet_address
      WHERE p.id = auth.uid()
    )
  );

-- ============================================================
-- Add role column to profiles if not exists
-- ============================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' 
      CHECK (role IN ('user', 'seller', 'broker', 'admin'));
  END IF;
END $$;

-- ============================================================
-- Add wallet_address column to profiles if not exists
-- ============================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN wallet_address TEXT;
    CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet_address);
  END IF;
END $$;

-- ============================================================
-- Grant necessary permissions
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON assets TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;
GRANT UPDATE ON broker_notifications TO authenticated;
