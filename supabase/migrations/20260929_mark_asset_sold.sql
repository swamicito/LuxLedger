-- Let the escrow buyer flip a listing to 'sold' once an escrow_transactions
-- row exists for the asset. The assets UPDATE policy is owner-only under RLS,
-- so the purchase flow cannot update it directly — this runs SECURITY DEFINER
-- but validates the caller is the buyer on a real escrow for that asset.

CREATE OR REPLACE FUNCTION public.mark_asset_sold(p_asset_id uuid, p_escrow_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.escrow_transactions
    WHERE id = p_escrow_id
      AND asset_id = p_asset_id
      AND buyer_id = v_caller
  ) THEN
    RAISE EXCEPTION 'caller is not the buyer on an escrow for this asset';
  END IF;

  UPDATE public.assets
    SET status = 'sold'
    WHERE id = p_asset_id
      AND status IS DISTINCT FROM 'sold';
END;
$$;

REVOKE ALL ON FUNCTION public.mark_asset_sold(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_asset_sold(uuid, uuid) TO authenticated;
