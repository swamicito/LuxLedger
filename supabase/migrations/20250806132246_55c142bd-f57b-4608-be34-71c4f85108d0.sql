-- Create regions table for global outreach
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  timezone TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  language_code TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create auctions table for advanced market mechanics
CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  starting_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  reserve_price NUMERIC NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  bid_increment NUMERIC NOT NULL DEFAULT 10,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_automatic BOOLEAN NOT NULL DEFAULT false,
  max_bid_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fractional shares table
CREATE TABLE public.fractional_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  total_shares INTEGER NOT NULL,
  available_shares INTEGER NOT NULL,
  price_per_share NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  minimum_investment NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'sold_out')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lending pools table
CREATE TABLE public.lending_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL,
  min_loan_amount NUMERIC NOT NULL,
  max_loan_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID NOT NULL,
  pool_id UUID NOT NULL REFERENCES public.lending_pools(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  duration_months INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'repaid', 'defaulted')),
  currency TEXT NOT NULL DEFAULT 'USD',
  collateral_ratio NUMERIC NOT NULL DEFAULT 1.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create currency rates table
CREATE TABLE public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual',
  UNIQUE(from_currency, to_currency)
);

-- Add region_id to assets table
ALTER TABLE public.assets ADD COLUMN region_id UUID REFERENCES public.regions(id);

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fractional_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lending_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for regions
CREATE POLICY "Everyone can view active regions" ON public.regions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage regions" ON public.regions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for auctions
CREATE POLICY "Everyone can view active auctions" ON public.auctions
  FOR SELECT USING (status IN ('active', 'scheduled'));

CREATE POLICY "Asset owners can manage their auctions" ON public.auctions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assets 
      WHERE assets.id = auctions.asset_id 
      AND assets.owner_id = auth.uid()
    )
  );

-- Create RLS policies for bids
CREATE POLICY "Users can view bids for public auctions" ON public.bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.auctions 
      WHERE auctions.id = bids.auction_id 
      AND auctions.status IN ('active', 'completed')
    )
  );

CREATE POLICY "Authenticated users can place bids" ON public.bids
  FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Create RLS policies for fractional shares
CREATE POLICY "Everyone can view active fractional shares" ON public.fractional_shares
  FOR SELECT USING (status = 'active');

CREATE POLICY "Asset owners can manage their fractional shares" ON public.fractional_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assets 
      WHERE assets.id = fractional_shares.asset_id 
      AND assets.owner_id = auth.uid()
    )
  );

-- Create RLS policies for lending pools
CREATE POLICY "Everyone can view active lending pools" ON public.lending_pools
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage lending pools" ON public.lending_pools
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for loans
CREATE POLICY "Users can view their own loans" ON public.loans
  FOR SELECT USING (auth.uid() = borrower_id);

CREATE POLICY "Users can create loan applications" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Admins can manage all loans" ON public.loans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for currency rates
CREATE POLICY "Everyone can view currency rates" ON public.currency_rates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage currency rates" ON public.currency_rates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_auctions_asset_id ON public.auctions(asset_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_auctions_end_time ON public.auctions(end_time);
CREATE INDEX idx_bids_auction_id ON public.bids(auction_id);
CREATE INDEX idx_bids_bidder_id ON public.bids(bidder_id);
CREATE INDEX idx_fractional_shares_asset_id ON public.fractional_shares(asset_id);
CREATE INDEX idx_loans_borrower_id ON public.loans(borrower_id);
CREATE INDEX idx_loans_asset_id ON public.loans(asset_id);
CREATE INDEX idx_assets_region_id ON public.assets(region_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fractional_shares_updated_at
  BEFORE UPDATE ON public.fractional_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lending_pools_updated_at
  BEFORE UPDATE ON public.lending_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample regions
INSERT INTO public.regions (name, country, timezone, currency_code, language_code) VALUES
  ('New York', 'United States', 'America/New_York', 'USD', 'en'),
  ('London', 'United Kingdom', 'Europe/London', 'GBP', 'en'),
  ('Tokyo', 'Japan', 'Asia/Tokyo', 'JPY', 'ja'),
  ('Paris', 'France', 'Europe/Paris', 'EUR', 'fr'),
  ('Dubai', 'United Arab Emirates', 'Asia/Dubai', 'AED', 'ar'),
  ('Singapore', 'Singapore', 'Asia/Singapore', 'SGD', 'en'),
  ('Hong Kong', 'China', 'Asia/Hong_Kong', 'HKD', 'zh'),
  ('Zurich', 'Switzerland', 'Europe/Zurich', 'CHF', 'de');