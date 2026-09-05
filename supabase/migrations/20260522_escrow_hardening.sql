-- ============================================================================
-- LUXLEDGER ESCROW HARDENING MIGRATION
-- Date: 2026-05-22
-- Purpose: Make escrow release a server-side, atomic, auditable single source
--          of truth. Adds explicit four-condition fields, an immutable event
--          log, and the evaluate_escrow_release(...) RPC.
--
-- Authoritative table: public.escrow_transactions
-- Ownership columns:   buyer_id, seller_id (both -> auth.users(id))
-- Existing fields used: status, released_at, dispute_filed_at,
--                       dispute_resolved_at, delivered_at
--
-- SAFE TO RUN: Idempotent. Uses IF NOT EXISTS / DO blocks throughout.
-- ============================================================================


-- ============================================================================
-- PART 1: ESCROW CONDITION FIELDS ON escrow_transactions
-- ============================================================================
-- We do NOT remove the existing `status` column. `escrow_status` is the
-- hardened, four-condition truth value used by the release engine and the
-- post-transaction UI. Legacy `status` remains for compatibility.

DO $$
BEGIN
  -- escrow_status: hardened lifecycle state
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'escrow_transactions'
      AND column_name = 'escrow_status'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN escrow_status TEXT NOT NULL DEFAULT 'held';
  END IF;

  -- Four release conditions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'tracking_delivered'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN tracking_delivered BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'tracking_delivered_at'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN tracking_delivered_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'buyer_confirmed'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN buyer_confirmed BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'buyer_confirmed_at'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN buyer_confirmed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'dispute_active'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN dispute_active BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'dispute_window_expired'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN dispute_window_expired BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'seller_failed_sla'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN seller_failed_sla BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- released_at already exists on escrow_transactions; do not redefine.

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'escrow_transactions'
      AND column_name = 'release_reason'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD COLUMN release_reason TEXT;
  END IF;
END $$;

-- Constraints (added separately so re-runs are safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escrow_transactions_escrow_status_chk'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD CONSTRAINT escrow_transactions_escrow_status_chk
      CHECK (escrow_status IN ('held', 'released', 'disputed', 'expired', 'refunded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escrow_transactions_release_reason_chk'
  ) THEN
    ALTER TABLE public.escrow_transactions
      ADD CONSTRAINT escrow_transactions_release_reason_chk
      CHECK (
        release_reason IS NULL OR
        release_reason IN ('buyer_confirmed', 'dispute_window_expired', 'manual_admin')
      );
  END IF;
END $$;


-- ============================================================================
-- PART 2: ESCROW EVENT LOG (immutable audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escrow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  triggered_by TEXT,                -- 'system' | 'buyer' | 'seller' | 'admin' | uuid string
  actor_user_id UUID,               -- optional auth.users(id) of acting user
  reason TEXT,                      -- short machine reason code
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- PART 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_escrow_events_transaction_id
  ON public.escrow_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_events_created_at
  ON public.escrow_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_escrow_status
  ON public.escrow_transactions(escrow_status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_dispute_active
  ON public.escrow_transactions(dispute_active)
  WHERE dispute_active = true;


-- ============================================================================
-- PART 4: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.escrow_events ENABLE ROW LEVEL SECURITY;

-- Buyers/sellers can read events for transactions they participate in
DROP POLICY IF EXISTS "Users can view own escrow events" ON public.escrow_events;
CREATE POLICY "Users can view own escrow events" ON public.escrow_events
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM public.escrow_transactions
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- No client INSERT/UPDATE/DELETE policies: only SECURITY DEFINER functions
-- (e.g. evaluate_escrow_release) may write to this table.


-- ============================================================================
-- PART 5: evaluate_escrow_release(p_transaction_id UUID)
--   The single source of truth for escrow release.
--   - Locks the row (FOR UPDATE) to prevent race conditions.
--   - Applies the exact four-condition logic.
--   - Atomically updates escrow_status only when safe.
--   - Logs every evaluation to escrow_events.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.evaluate_escrow_release(p_transaction_id UUID)
RETURNS TABLE (
  transaction_id UUID,
  escrow_status TEXT,
  release_occurred BOOLEAN,
  release_reason TEXT,
  tracking_delivered BOOLEAN,
  buyer_confirmed BOOLEAN,
  dispute_active BOOLEAN,
  dispute_window_expired BOOLEAN,
  seller_failed_sla BOOLEAN,
  blocked_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status        TEXT;
  v_tracking_delivered    BOOLEAN;
  v_buyer_confirmed       BOOLEAN;
  v_dispute_active        BOOLEAN;
  v_dispute_window_expired BOOLEAN;
  v_seller_failed_sla     BOOLEAN;
  v_should_release        BOOLEAN := false;
  v_release_reason        TEXT    := NULL;
  v_blocked_reason        TEXT    := NULL;
  v_new_status            TEXT;
BEGIN
  -- Lock the escrow row for the duration of this transaction.
  SELECT
    et.escrow_status,
    et.tracking_delivered,
    et.buyer_confirmed,
    et.dispute_active,
    et.dispute_window_expired,
    et.seller_failed_sla
  INTO
    v_current_status,
    v_tracking_delivered,
    v_buyer_confirmed,
    v_dispute_active,
    v_dispute_window_expired,
    v_seller_failed_sla
  FROM public.escrow_transactions et
  WHERE et.id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'escrow_transaction % not found', p_transaction_id
      USING ERRCODE = 'no_data_found';
  END IF;

  -- ---------------------------------------------------------------------------
  -- Core release logic (non-negotiable).
  -- Release ONLY when:
  --   1. tracking shows delivered, AND
  --   2. (buyer confirmed receipt) OR (dispute window expired), AND
  --   3. no active dispute, AND
  --   4. seller did not fail SLA.
  -- ---------------------------------------------------------------------------
  IF v_dispute_active THEN
    v_should_release := false;
    v_blocked_reason := 'dispute_active';
  ELSIF v_seller_failed_sla THEN
    v_should_release := false;
    v_blocked_reason := 'seller_failed_sla';
  ELSIF NOT v_tracking_delivered THEN
    v_should_release := false;
    v_blocked_reason := 'not_delivered';
  ELSIF v_buyer_confirmed THEN
    v_should_release := true;
    v_release_reason := 'buyer_confirmed';
  ELSIF v_dispute_window_expired THEN
    v_should_release := true;
    v_release_reason := 'dispute_window_expired';
  ELSE
    v_should_release := false;
    v_blocked_reason := 'awaiting_buyer_or_window';
  END IF;

  -- Determine new status. Release only flips a held escrow.
  IF v_should_release AND v_current_status = 'held' THEN
    UPDATE public.escrow_transactions
       SET escrow_status  = 'released',
           released_at    = COALESCE(released_at, now()),
           release_reason = v_release_reason,
           updated_at     = now()
     WHERE id = p_transaction_id;

    v_new_status := 'released';

    INSERT INTO public.escrow_events (
      transaction_id, event_type, previous_status, new_status,
      triggered_by, reason, metadata
    ) VALUES (
      p_transaction_id,
      'release_executed',
      v_current_status,
      v_new_status,
      'system',
      v_release_reason,
      jsonb_build_object(
        'tracking_delivered', v_tracking_delivered,
        'buyer_confirmed', v_buyer_confirmed,
        'dispute_active', v_dispute_active,
        'dispute_window_expired', v_dispute_window_expired,
        'seller_failed_sla', v_seller_failed_sla
      )
    );
  ELSE
    -- If a dispute is active, reflect that in escrow_status (without releasing).
    IF v_dispute_active AND v_current_status = 'held' THEN
      UPDATE public.escrow_transactions
         SET escrow_status = 'disputed',
             updated_at    = now()
       WHERE id = p_transaction_id;
      v_new_status := 'disputed';
    ELSE
      v_new_status := v_current_status;
    END IF;

    INSERT INTO public.escrow_events (
      transaction_id, event_type, previous_status, new_status,
      triggered_by, reason, metadata
    ) VALUES (
      p_transaction_id,
      'release_evaluated',
      v_current_status,
      v_new_status,
      'system',
      v_blocked_reason,
      jsonb_build_object(
        'tracking_delivered', v_tracking_delivered,
        'buyer_confirmed', v_buyer_confirmed,
        'dispute_active', v_dispute_active,
        'dispute_window_expired', v_dispute_window_expired,
        'seller_failed_sla', v_seller_failed_sla
      )
    );
  END IF;

  RETURN QUERY
  SELECT
    p_transaction_id,
    v_new_status,
    v_should_release AND v_current_status = 'held',
    v_release_reason,
    v_tracking_delivered,
    v_buyer_confirmed,
    v_dispute_active,
    v_dispute_window_expired,
    v_seller_failed_sla,
    v_blocked_reason;
END;
$$;


-- ============================================================================
-- PART 6: GRANTS
-- ============================================================================

GRANT SELECT ON public.escrow_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_escrow_release(UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
