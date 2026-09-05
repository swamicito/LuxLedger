/**
 * EscrowStatusCard
 *
 * The single visual source of truth for escrow release state.
 *
 *  - Reads `escrow_transactions` directly by id
 *  - Subscribes to realtime changes on that row
 *  - Calls the server-side `evaluate_escrow_release` RPC after every update
 *  - Renders the four release conditions plus the prominent Escrow Status line
 *
 * The component MUST NEVER decide release locally. It only reflects what
 * the backend has persisted and what the RPC returns.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Lock,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types (mirror the hardened schema and RPC return shape)
// ---------------------------------------------------------------------------

type EscrowStatus = 'held' | 'released' | 'disputed' | 'expired' | 'refunded' | string;

type ReleaseReason =
  | 'buyer_confirmed'
  | 'dispute_window_expired'
  | 'manual_admin'
  | null;

type BlockedReason =
  | 'dispute_active'
  | 'seller_failed_sla'
  | 'not_delivered'
  | 'awaiting_buyer_or_window'
  | null;

interface EscrowRow {
  id: string;
  escrow_status: EscrowStatus;
  tracking_delivered: boolean;
  tracking_delivered_at: string | null;
  buyer_confirmed: boolean;
  buyer_confirmed_at: string | null;
  dispute_active: boolean;
  dispute_window_expired: boolean;
  dispute_filed_at: string | null;
  seller_failed_sla: boolean;
  released_at: string | null;
  release_reason: ReleaseReason;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface EvaluateEscrowReleaseResult {
  transaction_id: string;
  escrow_status: EscrowStatus;
  release_occurred: boolean;
  release_reason: ReleaseReason;
  tracking_delivered: boolean;
  buyer_confirmed: boolean;
  dispute_active: boolean;
  dispute_window_expired: boolean;
  seller_failed_sla: boolean;
  blocked_reason: BlockedReason;
}

export interface EscrowStatusCardProps {
  transactionId: string;
  /** `full` = four-row card for detail page, `summary` = compact pill for dashboards */
  variant?: 'full' | 'summary';
  /** Called whenever the RPC returns (initial load + every realtime update). */
  onEvaluated?: (result: EvaluateEscrowReleaseResult, row: EscrowRow) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Trust language (single source — do not paraphrase)
// ---------------------------------------------------------------------------

const TRUST_HELD =
  'Funds remain in escrow until delivery is confirmed.';
const TRUST_RELEASED =
  'Funds have been released to the seller. Transaction complete.';
const TRUST_DISPUTED =
  'A dispute has been opened. Release is blocked until resolved.';
const TRUST_RULE =
  'Release occurs only when all conditions are met.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getCarrierTrackingUrl(carrier: string | null, tracking: string | null): string | null {
  if (!carrier || !tracking) return null;
  const t = encodeURIComponent(tracking.trim());
  switch (carrier.toLowerCase()) {
    case 'ups':
      return `https://www.ups.com/track?tracknum=${t}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
    case 'usps':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
    case 'dhl':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${t}`;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Row primitives
// ---------------------------------------------------------------------------

interface ConditionRowProps {
  label: string;
  met: boolean;
  warning?: boolean;
  detail?: string;
  hint?: React.ReactNode;
}

function ConditionRow({ label, met, warning, detail, hint }: ConditionRowProps) {
  const Icon = met ? CheckCircle2 : warning ? AlertTriangle : Clock;
  const tone = met
    ? 'text-emerald-400'
    : warning
    ? 'text-amber-400'
    : 'text-muted-foreground';

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone)} />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {detail && (
            <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
          )}
          {hint && (
            <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EscrowStatusCard({
  transactionId,
  variant = 'full',
  onEvaluated,
  className,
}: EscrowStatusCardProps) {
  const [row, setRow] = useState<EscrowRow | null>(null);
  const [result, setResult] = useState<EvaluateEscrowReleaseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable callback ref so realtime closure doesn't capture stale state.
  const onEvaluatedRef = useRef(onEvaluated);
  useEffect(() => {
    onEvaluatedRef.current = onEvaluated;
  }, [onEvaluated]);

  const evaluate = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('evaluate_escrow_release', {
      p_transaction_id: transactionId,
    });
    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error('[EscrowStatusCard] evaluate_escrow_release error', rpcError);
      return null;
    }
    const next = (data?.[0] as EvaluateEscrowReleaseResult | undefined) ?? null;
    if (next) setResult(next);
    return next;
  }, [transactionId]);

  const fetchRow = useCallback(async () => {
    const { data, error: rowError } = await supabase
      .from('escrow_transactions')
      .select(
        'id, escrow_status, tracking_delivered, tracking_delivered_at, buyer_confirmed, buyer_confirmed_at, dispute_active, dispute_window_expired, dispute_filed_at, seller_failed_sla, released_at, release_reason, carrier, tracking_number, shipped_at, delivered_at'
      )
      .eq('id', transactionId)
      .maybeSingle();

    if (rowError) {
      setError(rowError.message);
      return null;
    }
    if (!data) {
      setError('Escrow not found.');
      return null;
    }
    setError(null);
    setRow(data as EscrowRow);
    return data as EscrowRow;
  }, [transactionId]);

  // Initial load + realtime subscription
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const nextRow = await fetchRow();
      const nextResult = await evaluate();
      if (cancelled) return;
      setLoading(false);
      if (nextRow && nextResult) {
        onEvaluatedRef.current?.(nextResult, nextRow);
      }
    })();

    const channel = supabase
      .channel(`escrow-status-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'escrow_transactions',
          filter: `id=eq.${transactionId}`,
        },
        async () => {
          const nextRow = await fetchRow();
          const nextResult = await evaluate();
          if (nextRow && nextResult) {
            onEvaluatedRef.current?.(nextResult, nextRow);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [transactionId, fetchRow, evaluate]);

  // Effective state: prefer RPC return where it overlaps, otherwise the row.
  const effective = useMemo(() => {
    if (!row) return null;
    return {
      escrow_status: (result?.escrow_status ?? row.escrow_status) as EscrowStatus,
      tracking_delivered: result?.tracking_delivered ?? row.tracking_delivered,
      buyer_confirmed: result?.buyer_confirmed ?? row.buyer_confirmed,
      dispute_active: result?.dispute_active ?? row.dispute_active,
      dispute_window_expired:
        result?.dispute_window_expired ?? row.dispute_window_expired,
      seller_failed_sla: result?.seller_failed_sla ?? row.seller_failed_sla,
      release_reason: row.release_reason,
      released_at: row.released_at,
      tracking_delivered_at: row.tracking_delivered_at ?? row.delivered_at,
      buyer_confirmed_at: row.buyer_confirmed_at,
      dispute_filed_at: row.dispute_filed_at,
      carrier: row.carrier,
      tracking_number: row.tracking_number,
    };
  }, [result, row]);

  // ---------------------------------------------------------------------------
  // Loading / error
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <Card className={cn('border border-white/10 bg-neutral-950', className)}>
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading escrow status…
        </CardContent>
      </Card>
    );
  }

  if (error || !effective) {
    return (
      <Card className={cn('border border-amber-500/20 bg-amber-500/5', className)}>
        <CardContent className="p-6 text-sm text-amber-300">
          {error ?? 'Escrow status unavailable.'}
        </CardContent>
      </Card>
    );
  }

  const released = effective.escrow_status === 'released';
  const disputed =
    effective.escrow_status === 'disputed' || effective.dispute_active;

  // ---------------------------------------------------------------------------
  // Summary variant (dashboards)
  // ---------------------------------------------------------------------------
  if (variant === 'summary') {
    const tone = released
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : disputed
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

    const label = released
      ? 'Released'
      : disputed
      ? 'Release blocked — dispute open'
      : 'Held';

    const Icon = released ? ShieldCheck : disputed ? AlertTriangle : Lock;

    return (
      <Badge className={cn('px-3 py-1 font-medium', tone, className)}>
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        {label}
      </Badge>
    );
  }

  // ---------------------------------------------------------------------------
  // Full variant
  // ---------------------------------------------------------------------------
  const trackingUrl = getCarrierTrackingUrl(
    effective.carrier,
    effective.tracking_number
  );

  const statusToneClass = released
    ? 'text-emerald-400'
    : disputed
    ? 'text-red-400'
    : 'text-amber-300';

  const statusIcon = released ? (
    <ShieldCheck className="h-5 w-5" />
  ) : disputed ? (
    <AlertTriangle className="h-5 w-5" />
  ) : (
    <Lock className="h-5 w-5" />
  );

  const statusLabel = released
    ? 'Released'
    : disputed
    ? 'Held — dispute open'
    : 'Held';

  return (
    <Card
      className={cn(
        'border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95',
        className
      )}
    >
      <CardContent className="p-6">
        {/* Heading */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold tracking-tight">
              Escrow Status
            </p>
          </div>
          <Badge
            className={cn(
              'px-2.5 py-1 text-[0.7rem]',
              released
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : disputed
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        {/* Trust line */}
        <p className="mt-2 text-xs text-muted-foreground">
          {released
            ? TRUST_RELEASED
            : disputed
            ? TRUST_DISPUTED
            : TRUST_HELD}
        </p>

        {/* Four conditions */}
        <div className="mt-4 divide-y divide-white/5 rounded-lg border border-white/5 bg-black/20">
          <div className="px-4">
            <ConditionRow
              label="Tracking shows delivered"
              met={effective.tracking_delivered}
              detail={
                effective.tracking_delivered && effective.tracking_delivered_at
                  ? `Delivered ${formatDateTime(effective.tracking_delivered_at)}`
                  : 'Awaiting carrier delivery confirmation.'
              }
              hint={
                trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200"
                  >
                    Track with {effective.carrier?.toUpperCase()}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null
              }
            />
          </div>

          <div className="px-4">
            <ConditionRow
              label="Buyer confirmed receipt"
              met={effective.buyer_confirmed}
              detail={
                effective.buyer_confirmed && effective.buyer_confirmed_at
                  ? `Confirmed ${formatDateTime(effective.buyer_confirmed_at)}`
                  : effective.dispute_window_expired
                  ? 'Dispute window has passed — eligible for auto-release.'
                  : 'Auto-release after the dispute window closes if no issue is raised.'
              }
            />
          </div>

          <div className="px-4">
            <ConditionRow
              label="No active dispute"
              met={!effective.dispute_active}
              warning={effective.dispute_active}
              detail={
                effective.dispute_active
                  ? `Dispute opened ${formatDateTime(
                      effective.dispute_filed_at
                    )} — release blocked.`
                  : 'No dispute on file.'
              }
            />
          </div>

          <div className="px-4">
            <ConditionRow
              label="Seller met shipping SLA"
              met={!effective.seller_failed_sla}
              warning={effective.seller_failed_sla}
              detail={
                effective.seller_failed_sla
                  ? 'Seller missed shipping deadline — release blocked.'
                  : 'Seller is within shipping deadline.'
              }
            />
          </div>
        </div>

        {/* Final status line */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-4 py-3">
          <div className={cn('flex items-center gap-2', statusToneClass)}>
            {statusIcon}
            <p className="text-sm font-semibold">
              Escrow Status: {statusLabel}
            </p>
          </div>
          {released && effective.released_at && (
            <p className="text-xs text-muted-foreground">
              Released {formatDateTime(effective.released_at)}
              {effective.release_reason
                ? ` · ${effective.release_reason.replace(/_/g, ' ')}`
                : ''}
            </p>
          )}
        </div>

        {/* Rule reminder */}
        <p className="mt-3 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80">
          {TRUST_RULE}
        </p>
      </CardContent>
    </Card>
  );
}
