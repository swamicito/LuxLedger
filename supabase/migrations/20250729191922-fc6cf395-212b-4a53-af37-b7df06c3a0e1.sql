-- Fix search path for security functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
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
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = required_role
    );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;