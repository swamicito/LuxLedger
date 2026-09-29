-- Once an escrow reaches a terminal state, the seller-submitted shipping
-- fields are frozen. The UI hides the form; this trigger is the actual
-- enforcement — it blocks UPDATEs that touch carrier/tracking/shipped_at on
-- released, refunded, disputed, or expired rows, regardless of caller.
--
-- It deliberately does NOT touch escrow_status/released_at/etc., so
-- evaluate_escrow_release and the finish-hash persist continue to work on
-- non-terminal rows, and tracking_delivered stays writable for late carrier
-- webhooks (informational only once settled).

CREATE OR REPLACE FUNCTION public.freeze_shipping_after_settlement()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.escrow_status IN ('released', 'refunded', 'disputed', 'expired')
     AND (
       NEW.carrier IS DISTINCT FROM OLD.carrier
       OR NEW.tracking_number IS DISTINCT FROM OLD.tracking_number
       OR NEW.shipped_at IS DISTINCT FROM OLD.shipped_at
     ) THEN
    RAISE EXCEPTION 'escrow % is settled (%) — shipping fields are locked',
      OLD.id, OLD.escrow_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escrow_freeze_shipping ON public.escrow_transactions;
CREATE TRIGGER trg_escrow_freeze_shipping
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.freeze_shipping_after_settlement();
