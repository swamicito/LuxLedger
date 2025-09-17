-- LuxBroker Affiliate System Database Schema
-- World-class affiliate program for LuxLedger

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brokers table - Affiliate partners who refer sellers
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
  commission_rate DECIMAL(5,4) DEFAULT 0.10, -- 10% default
  total_sales_volume DECIMAL(15,2) DEFAULT 0,
  total_commissions_earned DECIMAL(15,2) DEFAULT 0,
  referred_sellers_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  kyc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sellers table - Users who list items, potentially referred by brokers
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  referred_by TEXT REFERENCES brokers(referral_code),
  referral_locked_until TIMESTAMP WITH TIME ZONE, -- Lock referral for 90 days
  total_sales DECIMAL(15,2) DEFAULT 0,
  items_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commissions table - Track all commission payments
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID REFERENCES brokers(id),
  seller_id UUID REFERENCES sellers(id),
  sale_id TEXT, -- Reference to marketplace sale/escrow
  sale_amount_usd DECIMAL(15,2) NOT NULL,
  commission_amount_usd DECIMAL(15,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  broker_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  tx_hash TEXT, -- XRPL transaction hash for commission payment
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral clicks table - Track referral link performance
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID REFERENCES brokers(id),
  referral_code TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  converted BOOLEAN DEFAULT FALSE,
  conversion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Broker tiers configuration
CREATE TABLE broker_tiers (
  tier TEXT PRIMARY KEY,
  min_sales_volume DECIMAL(15,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  benefits JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tier configuration
INSERT INTO broker_tiers (tier, min_sales_volume, commission_rate, benefits) VALUES
('bronze', 0, 0.10, '{"badge": "🥉", "perks": ["Basic dashboard", "10% commission"]}'),
('silver', 10000, 0.12, '{"badge": "🥈", "perks": ["Enhanced analytics", "12% commission", "Priority support"]}'),
('gold', 50000, 0.15, '{"badge": "🥇", "perks": ["Advanced dashboard", "15% commission", "Custom referral domain", "Exclusive events"]}'),
('diamond', 250000, 0.20, '{"badge": "💎", "perks": ["VIP status", "20% commission", "Personal account manager", "Revenue sharing"]}');

-- Indexes for performance
CREATE INDEX idx_brokers_wallet ON brokers(wallet_address);
CREATE INDEX idx_brokers_referral_code ON brokers(referral_code);
CREATE INDEX idx_sellers_wallet ON sellers(wallet_address);
CREATE INDEX idx_sellers_referred_by ON sellers(referred_by);
CREATE INDEX idx_commissions_broker_id ON commissions(broker_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_referral_clicks_broker_id ON referral_clicks(broker_id);

-- Functions for automatic tier updates
CREATE OR REPLACE FUNCTION update_broker_tier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE brokers 
  SET tier = (
    SELECT tier 
    FROM broker_tiers 
    WHERE NEW.total_sales_volume >= min_sales_volume 
    ORDER BY min_sales_volume DESC 
    LIMIT 1
  ),
  commission_rate = (
    SELECT commission_rate 
    FROM broker_tiers 
    WHERE NEW.total_sales_volume >= min_sales_volume 
    ORDER BY min_sales_volume DESC 
    LIMIT 1
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tier when sales volume changes
CREATE TRIGGER trigger_update_broker_tier
  AFTER UPDATE OF total_sales_volume ON brokers
  FOR EACH ROW
  EXECUTE FUNCTION update_broker_tier();

-- Function to update broker stats when commission is paid
CREATE OR REPLACE FUNCTION update_broker_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE brokers 
    SET 
      total_sales_volume = total_sales_volume + NEW.sale_amount_usd,
      total_commissions_earned = total_commissions_earned + NEW.commission_amount_usd
    WHERE id = NEW.broker_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update broker stats when commission is paid
CREATE TRIGGER trigger_update_broker_stats
  AFTER UPDATE OF status ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_broker_stats();

-- RLS (Row Level Security) policies
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Policies for brokers (can only see their own data)
CREATE POLICY "Brokers can view own data" ON brokers
  FOR SELECT USING (wallet_address = current_setting('app.current_wallet', true));

CREATE POLICY "Brokers can update own data" ON brokers
  FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true));

-- Policies for commissions (brokers can see their commissions)
CREATE POLICY "Brokers can view own commissions" ON commissions
  FOR SELECT USING (broker_wallet = current_setting('app.current_wallet', true));

-- Views for analytics
CREATE VIEW broker_analytics AS
SELECT 
  b.id,
  b.wallet_address,
  b.referral_code,
  b.tier,
  b.commission_rate,
  b.total_sales_volume,
  b.total_commissions_earned,
  b.referred_sellers_count,
  COUNT(DISTINCT c.id) as total_commissions,
  COUNT(DISTINCT rc.id) as total_clicks,
  CASE 
    WHEN COUNT(DISTINCT rc.id) > 0 
    THEN ROUND((COUNT(DISTINCT CASE WHEN rc.converted THEN rc.id END)::DECIMAL / COUNT(DISTINCT rc.id) * 100), 2)
    ELSE 0 
  END as conversion_rate,
  bt.benefits
FROM brokers b
LEFT JOIN commissions c ON b.id = c.broker_id
LEFT JOIN referral_clicks rc ON b.id = rc.broker_id
LEFT JOIN broker_tiers bt ON b.tier = bt.tier
GROUP BY b.id, b.wallet_address, b.referral_code, b.tier, b.commission_rate, 
         b.total_sales_volume, b.total_commissions_earned, b.referred_sellers_count, bt.benefits;
