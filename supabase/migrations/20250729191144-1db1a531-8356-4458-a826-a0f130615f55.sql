-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'verified_user', 'pending_user', 'kyc_reviewer');

-- Create KYC status enum
CREATE TYPE public.kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'requires_resubmission');

-- Create asset categories enum
CREATE TYPE public.asset_category AS ENUM ('jewelry', 'watches', 'art', 'real_estate', 'cars', 'wine', 'collectibles');

-- Create asset status enum
CREATE TYPE public.asset_status AS ENUM ('draft', 'pending_verification', 'verified', 'tokenized', 'listed', 'sold');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    country TEXT,
    date_of_birth DATE,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'pending_user',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create KYC submissions table
CREATE TABLE public.kyc_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status kyc_status NOT NULL DEFAULT 'pending',
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    additional_documents TEXT[],
    notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assets table
CREATE TABLE public.assets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category asset_category NOT NULL,
    estimated_value DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    images TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    status asset_status NOT NULL DEFAULT 'draft',
    verification_documents TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NFT tokens table
CREATE TABLE public.nft_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    token_id TEXT UNIQUE,
    contract_address TEXT,
    blockchain TEXT DEFAULT 'XRPL',
    metadata_uri TEXT,
    minted_at TIMESTAMP WITH TIME ZONE,
    minted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provenance records table
CREATE TABLE public.provenance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    previous_owner_id UUID REFERENCES auth.users(id),
    current_owner_id UUID NOT NULL REFERENCES auth.users(id),
    transaction_hash TEXT,
    transfer_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    transfer_price DECIMAL(15,2),
    transfer_currency TEXT DEFAULT 'USD',
    transfer_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    price DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_hash TEXT,
    blockchain_network TEXT DEFAULT 'XRPL',
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics events table
CREATE TABLE public.analytics_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    asset_id UUID REFERENCES public.assets(id),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.user_roles 
    WHERE user_id = user_uuid 
    ORDER BY assigned_at DESC 
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = required_role
    );
$$;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for kyc_submissions table
CREATE POLICY "Users can view their own KYC submissions"
    ON public.kyc_submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KYC submissions"
    ON public.kyc_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "KYC reviewers can view all submissions"
    ON public.kyc_submissions FOR SELECT
    USING (public.has_role(auth.uid(), 'kyc_reviewer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "KYC reviewers can update submissions"
    ON public.kyc_submissions FOR UPDATE
    USING (public.has_role(auth.uid(), 'kyc_reviewer') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assets table
CREATE POLICY "Users can view their own assets"
    ON public.assets FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Public can view verified and listed assets"
    ON public.assets FOR SELECT
    USING (status IN ('verified', 'tokenized', 'listed'));

CREATE POLICY "Users can manage their own assets"
    ON public.assets FOR ALL
    USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all assets"
    ON public.assets FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for nft_tokens table
CREATE POLICY "Public can view all NFT tokens"
    ON public.nft_tokens FOR SELECT
    USING (true);

CREATE POLICY "Asset owners can create NFT tokens"
    ON public.nft_tokens FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE assets.id = nft_tokens.asset_id 
            AND assets.owner_id = auth.uid()
        )
    );

-- RLS Policies for provenance_records table
CREATE POLICY "Public can view provenance records"
    ON public.provenance_records FOR SELECT
    USING (true);

CREATE POLICY "Asset owners can create provenance records"
    ON public.provenance_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE assets.id = provenance_records.asset_id 
            AND assets.owner_id = auth.uid()
        )
    );

-- RLS Policies for transactions table
CREATE POLICY "Users can view transactions they're involved in"
    ON public.transactions FOR SELECT
    USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Verified users can create transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'verified_user') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all transactions"
    ON public.transactions FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analytics_events table
CREATE POLICY "Admins can view all analytics"
    ON public.analytics_events FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_submissions_updated_at
    BEFORE UPDATE ON public.kyc_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'pending_user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();