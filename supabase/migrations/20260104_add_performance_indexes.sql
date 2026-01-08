-- ============================================================================
-- LuxLedger Performance Indexes Migration
-- Purpose: Add indexes for scalable queries (millions of listings)
-- ============================================================================

-- Assets table indexes (most queried table)
-- Composite index for marketplace listing queries
CREATE INDEX IF NOT EXISTS idx_assets_status_created 
ON assets (status, created_at DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_assets_category 
ON assets (category);

-- Index for price range queries
CREATE INDEX IF NOT EXISTS idx_assets_estimated_value 
ON assets (estimated_value);

-- Index for owner lookups (portfolio page)
CREATE INDEX IF NOT EXISTS idx_assets_owner_id 
ON assets (owner_id);

-- Composite index for cursor pagination (created_at, id)
CREATE INDEX IF NOT EXISTS idx_assets_cursor_pagination 
ON assets (created_at DESC, id);

-- Index for verified assets
CREATE INDEX IF NOT EXISTS idx_assets_verified 
ON assets (status) WHERE status IN ('verified', 'tokenized', 'listed');

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id 
ON transactions (buyer_id);

CREATE INDEX IF NOT EXISTS idx_transactions_seller_id 
ON transactions (seller_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON transactions (status);

-- Composite for user transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user_history 
ON transactions (created_at DESC, id);

-- Escrow transactions indexes
CREATE INDEX IF NOT EXISTS idx_escrow_buyer_id 
ON escrow_transactions (buyer_id);

CREATE INDEX IF NOT EXISTS idx_escrow_seller_id 
ON escrow_transactions (seller_id);

CREATE INDEX IF NOT EXISTS idx_escrow_status 
ON escrow_transactions (status);

CREATE INDEX IF NOT EXISTS idx_escrow_created_at 
ON escrow_transactions (created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications (user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications (created_at DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles (username);

CREATE INDEX IF NOT EXISTS idx_profiles_is_broker 
ON profiles (is_broker) WHERE is_broker = true;

CREATE INDEX IF NOT EXISTS idx_profiles_is_verified 
ON profiles (is_verified) WHERE is_verified = true;

-- NFT tokens indexes
CREATE INDEX IF NOT EXISTS idx_nft_tokens_asset_id 
ON nft_tokens (asset_id);

CREATE INDEX IF NOT EXISTS idx_nft_tokens_owner 
ON nft_tokens (minted_by);

-- Provenance records indexes
CREATE INDEX IF NOT EXISTS idx_provenance_asset_id 
ON provenance_records (asset_id);

CREATE INDEX IF NOT EXISTS idx_provenance_transfer_date 
ON provenance_records (transfer_date DESC);

-- Broker referrals indexes
CREATE INDEX IF NOT EXISTS idx_broker_referrals_broker_id 
ON broker_referrals (broker_id);

CREATE INDEX IF NOT EXISTS idx_broker_referrals_status 
ON broker_referrals (status);

-- ============================================================================
-- Full-text search preparation (for future search service)
-- ============================================================================

-- Add tsvector column for full-text search on assets
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_assets_search 
ON assets USING GIN (search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION assets_search_vector_update() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
DROP TRIGGER IF EXISTS assets_search_vector_trigger ON assets;
CREATE TRIGGER assets_search_vector_trigger
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION assets_search_vector_update();

-- Update existing rows
UPDATE assets SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C');

-- ============================================================================
-- Query optimization views (optional, for complex queries)
-- ============================================================================

-- Materialized view for marketplace stats (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS marketplace_stats AS
SELECT 
  category,
  COUNT(*) as total_count,
  AVG(estimated_value) as avg_value,
  MIN(estimated_value) as min_value,
  MAX(estimated_value) as max_value,
  COUNT(*) FILTER (WHERE status = 'listed') as listed_count
FROM assets
WHERE status IN ('verified', 'tokenized', 'listed')
GROUP BY category;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_stats_category 
ON marketplace_stats (category);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON INDEX idx_assets_status_created IS 'Primary index for marketplace queries with status filter';
COMMENT ON INDEX idx_assets_cursor_pagination IS 'Supports cursor-based pagination for infinite scroll';
COMMENT ON INDEX idx_assets_search IS 'GIN index for full-text search on assets';
