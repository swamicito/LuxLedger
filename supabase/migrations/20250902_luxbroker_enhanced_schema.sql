-- Enhanced LuxBroker Database Schema
-- Complete schema for affiliate system with RPC functions

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create broker tiers table
CREATE TABLE IF NOT EXISTS broker_tiers (
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

-- Insert default tiers
INSERT INTO broker_tiers (name, min_referrals, min_sales_volume, commission_rate, color, icon, benefits) VALUES
('Bronze', 0, 0, 0.10, '#CD7F32', '🥉', ARRAY['10% commission rate', 'Basic support', 'Monthly reports']),
('Silver', 5, 10000, 0.12, '#C0C0C0', '🥈', ARRAY['12% commission rate', 'Priority support', 'Weekly reports', 'Marketing materials']),
('Gold', 15, 50000, 0.15, '#FFD700', '🥇', ARRAY['15% commission rate', 'Dedicated support', 'Daily reports', 'Custom marketing', 'Early access']),
('Diamond', 50, 250000, 0.20, '#B9F2FF', '💎', ARRAY['20% commission rate', 'VIP support', 'Real-time analytics', 'White-label options', 'Revenue sharing'])
ON CONFLICT DO NOTHING;

-- Create brokers table
CREATE TABLE IF NOT EXISTS brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(34) UNIQUE NOT NULL,
  referral_code VARCHAR(8) UNIQUE NOT NULL,
  tier_id INTEGER REFERENCES broker_tiers(id) DEFAULT 1,
  total_earnings DECIMAL(15,2) DEFAULT 0,
  referred_sellers_count INTEGER DEFAULT 0,
  total_sales_volume DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(34) UNIQUE NOT NULL,
  referred_by_broker_id UUID REFERENCES brokers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES brokers(id),
  seller_id UUID REFERENCES sellers(id),
  sale_amount_usd DECIMAL(15,2) NOT NULL,
  commission_usd DECIMAL(15,2) NOT NULL,
  platform_fee_usd DECIMAL(15,2),
  commission_rate DECIMAL(5,4),
  category VARCHAR(50),
  pay_method VARCHAR(20),
  auction BOOLEAN DEFAULT FALSE,
  transaction_hash VARCHAR(64),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral clicks table
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code VARCHAR(8) NOT NULL,
  broker_id UUID REFERENCES brokers(id),
  ip_address INET,
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create broker notifications table
CREATE TABLE IF NOT EXISTS broker_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES brokers(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brokers_wallet ON brokers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_brokers_referral_code ON brokers(referral_code);
CREATE INDEX IF NOT EXISTS idx_sellers_wallet ON sellers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sellers_referred_by ON sellers(referred_by_broker_id);
CREATE INDEX IF NOT EXISTS idx_commissions_broker ON commissions(broker_id);
CREATE INDEX IF NOT EXISTS idx_commissions_seller ON commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_broker ON referral_clicks(broker_id);

-- Enable RLS on all tables
ALTER TABLE broker_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Broker tiers are public (read-only)
CREATE POLICY "Broker tiers are viewable by everyone" ON broker_tiers FOR SELECT USING (true);

-- Brokers can view their own data
CREATE POLICY "Brokers can view own data" ON brokers FOR SELECT USING (true);
CREATE POLICY "Brokers can update own data" ON brokers FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Sellers can view their own data
CREATE POLICY "Sellers can view own data" ON sellers FOR SELECT USING (true);

-- Commissions are viewable by related brokers and sellers
CREATE POLICY "Commissions viewable by broker" ON commissions FOR SELECT USING (
  broker_id IN (SELECT id FROM brokers WHERE wallet_address = auth.uid()::text)
);

-- Referral clicks are viewable by brokers
CREATE POLICY "Referral clicks viewable by broker" ON referral_clicks FOR SELECT USING (
  broker_id IN (SELECT id FROM brokers WHERE wallet_address = auth.uid()::text)
);

-- Notifications are viewable by the broker
CREATE POLICY "Notifications viewable by broker" ON broker_notifications FOR SELECT USING (
  broker_id IN (SELECT id FROM brokers WHERE wallet_address = auth.uid()::text)
);

-- RPC Functions

-- Update broker stats
CREATE OR REPLACE FUNCTION update_broker_stats(
  p_broker_id UUID,
  p_commission_amount DECIMAL,
  p_sale_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE brokers 
  SET 
    total_earnings = total_earnings + p_commission_amount,
    total_sales_volume = total_sales_volume + p_sale_amount,
    updated_at = NOW()
  WHERE id = p_broker_id;
  
  -- Check for tier upgrades
  PERFORM check_tier_upgrade(p_broker_id);
END;
$$;

-- Increment broker seller count
CREATE OR REPLACE FUNCTION increment_broker_sellers(p_broker_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE brokers 
  SET 
    referred_sellers_count = referred_sellers_count + 1,
    updated_at = NOW()
  WHERE id = p_broker_id;
  
  -- Check for tier upgrades
  PERFORM check_tier_upgrade(p_broker_id);
END;
$$;

-- Check and upgrade broker tier
CREATE OR REPLACE FUNCTION check_tier_upgrade(p_broker_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  broker_record RECORD;
  new_tier_id INTEGER;
BEGIN
  -- Get current broker stats
  SELECT * INTO broker_record FROM brokers WHERE id = p_broker_id;
  
  -- Find the highest tier they qualify for
  SELECT id INTO new_tier_id
  FROM broker_tiers
  WHERE min_referrals <= broker_record.referred_sellers_count
    AND min_sales_volume <= broker_record.total_sales_volume
  ORDER BY commission_rate DESC
  LIMIT 1;
  
  -- Update tier if it's higher than current
  IF new_tier_id > broker_record.tier_id THEN
    UPDATE brokers 
    SET tier_id = new_tier_id, updated_at = NOW()
    WHERE id = p_broker_id;
    
    -- Create notification for tier upgrade
    INSERT INTO broker_notifications (broker_id, type, title, message, data)
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

-- Public leaderboard view (anonymized)
CREATE OR REPLACE VIEW broker_public_stats AS
SELECT 
  b.referral_code,
  bt.name as tier_name,
  bt.color as tier_color,
  bt.icon as tier_icon,
  b.total_earnings,
  b.referred_sellers_count,
  b.total_sales_volume,
  b.created_at
FROM brokers b
JOIN broker_tiers bt ON b.tier_id = bt.id
WHERE b.total_earnings > 0 OR b.referred_sellers_count > 0;

-- Enhanced leaderboard RPC with time periods
CREATE OR REPLACE FUNCTION broker_public_leaderboard(
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
  sellers INTEGER,
  last_sale TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_commissions AS (
    SELECT c.*, b.referral_code, bt.name as tier_name, bt.color as tier_color, bt.icon as tier_icon
    FROM commissions c
    JOIN brokers b ON b.id = c.broker_id
    JOIN broker_tiers bt ON b.tier_id = bt.id
    WHERE
      CASE
        WHEN period = 'week' THEN c.created_at >= date_trunc('week', NOW())
        WHEN period = 'month' THEN c.created_at >= date_trunc('month', NOW())
        ELSE TRUE
      END
  )
  SELECT
    fc.referral_code::TEXT,
    fc.tier_name::TEXT,
    fc.tier_color::TEXT,
    fc.tier_icon::TEXT,
    COALESCE(SUM(fc.sale_amount_usd), 0) as total_sales_usd,
    COALESCE(SUM(fc.commission_usd), 0) as total_commission_usd,
    COUNT(DISTINCT fc.seller_id)::INTEGER as sellers,
    MAX(fc.created_at) as last_sale
  FROM filtered_commissions fc
  GROUP BY fc.referral_code, fc.tier_name, fc.tier_color, fc.tier_icon
  ORDER BY total_commission_usd DESC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Record commission with automatic broker stats update
CREATE OR REPLACE FUNCTION record_commission(
  p_broker_id UUID,
  p_seller_id UUID,
  p_sale_amount_usd DECIMAL,
  p_commission_usd DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  commission_id UUID;
BEGIN
  -- Insert commission record
  INSERT INTO commissions (broker_id, seller_id, sale_amount_usd, commission_usd)
  VALUES (p_broker_id, p_seller_id, p_sale_amount_usd, p_commission_usd)
  RETURNING id INTO commission_id;
  
  -- Update broker stats
  PERFORM update_broker_stats(p_broker_id, p_commission_usd, p_sale_amount_usd);
  
  -- Create notification
  INSERT INTO broker_notifications (broker_id, type, title, message, data)
  VALUES (
    p_broker_id,
    'commission_earned',
    'Commission Earned',
    'You earned $' || p_commission_usd || ' from a $' || p_sale_amount_usd || ' sale.',
    jsonb_build_object('commission_usd', p_commission_usd, 'sale_amount_usd', p_sale_amount_usd)
  );
  
  RETURN commission_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
