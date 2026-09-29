-- Listing review trail: listings are inserted as 'listed' immediately (alpha
-- does not gate purchase), so review state is tracked separately and chips
-- render from it. Rejection also pulls the row back to 'draft', which drops
-- it from public visibility under the existing SELECT policies.

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS listing_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS listing_reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS listing_review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS listing_review_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assets_listing_review_status_check'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT assets_listing_review_status_check
      CHECK (listing_review_status IN ('pending', 'reviewed', 'rejected'));
  END IF;
END $$;

-- review_asset_listing: SECURITY DEFINER so the review decision bypasses RLS,
-- but the caller must hold the 'admin' app_role in user_roles — the same
-- source the frontend admin gate uses. A seller cannot self-review.
CREATE OR REPLACE FUNCTION public.review_asset_listing(
  p_asset_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
)
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
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_caller AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;

  IF p_decision NOT IN ('reviewed', 'rejected') THEN
    RAISE EXCEPTION 'invalid decision: %', p_decision;
  END IF;

  IF p_decision = 'rejected' AND (p_reason IS NULL OR btrim(p_reason) = '') THEN
    RAISE EXCEPTION 'rejection requires a reason';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.assets
    WHERE id = p_asset_id AND status = 'sold'
  ) THEN
    RAISE EXCEPTION 'cannot review a sold asset';
  END IF;

  UPDATE public.assets
    SET listing_review_status = p_decision,
        listing_reviewed_at = now(),
        listing_reviewed_by = v_caller,
        listing_review_notes = NULLIF(btrim(COALESCE(p_reason, '')), ''),
        status = CASE
          WHEN p_decision = 'rejected' THEN 'draft'::asset_status
          ELSE status
        END,
        updated_at = now()
    WHERE id = p_asset_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'asset not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_asset_listing(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_asset_listing(uuid, text, text) TO authenticated;
