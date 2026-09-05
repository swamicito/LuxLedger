/**
 * BuyerOrderWorkspace
 *
 * The buyer's post-purchase home. One calm, authoritative page that answers
 * two questions instantly:
 *
 *   "Where is my item?"   →  Shipment block + tracking
 *   "Where is my money?"  →  Live four-condition EscrowStatusCard
 *
 * All state derives from `escrow_transactions` and the
 * `evaluate_escrow_release` RPC. No mocks, no local release logic.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Lock,
  ExternalLink,
  Copy,
  HelpCircle,
  Loader2,
  Package,
  Truck,
  PackageCheck,
  CircleCheck,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import EscrowStatusCard from '@/components/EscrowStatusCard';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EscrowRow {
  id: string;
  asset_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  buyer_address: string;
  seller_address: string;
  amount_usd: number;
  status: string | null;
  escrow_status: string | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_delivered: boolean | null;
  tracking_delivered_at: string | null;
  buyer_confirmed: boolean | null;
  buyer_confirmed_at: string | null;
  dispute_active: boolean | null;
  dispute_window_expired: boolean | null;
  dispute_filed_at: string | null;
  released_at: string | null;
  release_reason: string | null;
  created_at: string;
  funded_at: string | null;
  updated_at: string;
}

interface AssetRow {
  id: string;
  title: string | null;
  category: string | null;
  images: string[] | null;
}

interface SellerProfile {
  user_id: string;
  full_name: string | null;
  username: string | null;
  is_verified: boolean | null;
  profile_image_url: string | null;
  wallet_address: string | null;
}

interface EscrowEventRow {
  id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  triggered_by: string | null;
  reason: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants — approved trust language (do not paraphrase)
// ---------------------------------------------------------------------------

const TRUST_HELD =
  'Funds remain in escrow until delivery is confirmed.';
const TRUST_RELEASED =
  'Funds have been released to the seller. Transaction complete.';
const TRUST_SHIPPING =
  'Seller is responsible for insured shipping to your verified address.';
const TRUST_RULE =
  'Release occurs only when all conditions are met.';

// Default dispute window if not yet stored elsewhere (matches shipping/types defaults).
const DEFAULT_DISPUTE_WINDOW_HOURS = 72;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function maskAddress(addr: string | null | undefined) {
  if (!addr) return '—';
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function getCarrierTrackingUrl(carrier: string | null, tracking: string | null) {
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

function getAutoReleaseAt(escrow: EscrowRow | null): Date | null {
  if (!escrow) return null;
  const baseIso = escrow.tracking_delivered_at ?? escrow.delivered_at;
  if (!baseIso) return null;
  const base = new Date(baseIso);
  return new Date(base.getTime() + DEFAULT_DISPUTE_WINDOW_HOURS * 60 * 60 * 1000);
}

function formatCountdown(target: Date | null): string | null {
  if (!target) return null;
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return 'now';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours >= 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours >= 1) {
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  }
  const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
  return `${mins}m`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BuyerOrderWorkspace() {
  const navigate = useNavigate();
  const { escrowId } = useParams<{ escrowId: string }>();
  const { user } = useAuth();

  const [escrow, setEscrow] = useState<EscrowRow | null>(null);
  const [asset, setAsset] = useState<AssetRow | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [events, setEvents] = useState<EscrowEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [, setTick] = useState(0); // forces countdown to re-render

  // Tick once per minute for the countdown
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // -------------------------------------------------------------------------
  // Loaders
  // -------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    if (!escrowId) return;
    setError(null);

    const { data, error: rowError } = await supabase
      .from('escrow_transactions')
      .select(
        'id, asset_id, buyer_id, seller_id, buyer_address, seller_address, amount_usd, status, escrow_status, carrier, tracking_number, shipped_at, delivered_at, tracking_delivered, tracking_delivered_at, buyer_confirmed, buyer_confirmed_at, dispute_active, dispute_window_expired, dispute_filed_at, released_at, release_reason, created_at, funded_at, updated_at'
      )
      .eq('id', escrowId)
      .maybeSingle();

    if (rowError) {
      setError(rowError.message);
      setEscrow(null);
      return;
    }
    if (!data) {
      setError('Order not found or access denied.');
      setEscrow(null);
      return;
    }

    const row = data as unknown as EscrowRow;
    setEscrow(row);

    const [assetRes, sellerRes, eventsRes] = await Promise.all([
      row.asset_id
        ? supabase
            .from('assets')
            .select('id, title, category, images')
            .eq('id', row.asset_id)
            .maybeSingle()
            .then((r) => r.data as AssetRow | null)
        : Promise.resolve(null),
      row.seller_id
        ? supabase
            .from('profiles')
            .select(
              'user_id, full_name, username, is_verified, profile_image_url, wallet_address'
            )
            .eq('user_id', row.seller_id)
            .maybeSingle()
            .then((r) => r.data as SellerProfile | null)
        : Promise.resolve(null),
      supabase
        .from('escrow_events')
        .select(
          'id, event_type, previous_status, new_status, triggered_by, reason, created_at'
        )
        .eq('transaction_id', row.id)
        .order('created_at', { ascending: true })
        .then((r) => (r.data ?? []) as unknown as EscrowEventRow[]),
    ]);

    setAsset(assetRes);
    setSeller(sellerRes);
    setEvents(eventsRes);
  }, [escrowId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    })();
  }, [fetchAll]);

  // Realtime subscriptions (escrow row + escrow events)
  useEffect(() => {
    if (!escrowId) return;
    const channel = supabase
      .channel(`buyer-order-${escrowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'escrow_transactions',
          filter: `id=eq.${escrowId}`,
        },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escrow_events',
          filter: `transaction_id=eq.${escrowId}`,
        },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [escrowId, fetchAll]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const confirmReceipt = useCallback(async () => {
    if (!escrow) return;
    setActing(true);
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({
        buyer_confirmed: true,
        buyer_confirmed_at: now,
        status: 'confirmed',
      })
      .eq('id', escrow.id);
    if (updateError) {
      toast.error(updateError.message);
      setActing(false);
      return;
    }
    const { error: rpcError } = await supabase.rpc('evaluate_escrow_release', {
      p_transaction_id: escrow.id,
    });
    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error('[BuyerOrderWorkspace] evaluate_escrow_release', rpcError);
    }
    toast.success('Receipt confirmed. Release is being processed.');
    await fetchAll();
    setActing(false);
  }, [escrow, fetchAll]);

  const goToDispute = useCallback(() => {
    if (!escrow) return;
    navigate(`/disputes?escrowId=${escrow.id}`);
  }, [escrow, navigate]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const isBuyer = useMemo(
    () => Boolean(user && escrow && user.id === escrow.buyer_id),
    [user, escrow]
  );

  const released = escrow?.escrow_status === 'released';
  const disputeActive = Boolean(escrow?.dispute_active);
  const delivered = Boolean(escrow?.tracking_delivered);
  const buyerConfirmed = Boolean(escrow?.buyer_confirmed);
  const trackingUrl = getCarrierTrackingUrl(
    escrow?.carrier ?? null,
    escrow?.tracking_number ?? null
  );
  const autoReleaseAt = getAutoReleaseAt(escrow);
  const countdown = formatCountdown(autoReleaseAt);

  const canConfirm =
    isBuyer && !released && !disputeActive && delivered && !buyerConfirmed;

  // -------------------------------------------------------------------------
  // Guards
  // -------------------------------------------------------------------------

  if (!user) {
    return (
      <CenteredCard
        title="Sign in required"
        body="Sign in to view your order."
        primaryLabel="Go to Sign In"
        onPrimary={() => navigate('/auth')}
      />
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !escrow) {
    return (
      <CenteredCard
        title="Order not found"
        body={
          error ??
          "This order doesn't exist or you don't have access to it."
        }
        primaryLabel="Back to Escrow Dashboard"
        onPrimary={() => navigate('/escrow/dashboard')}
      />
    );
  }

  if (!isBuyer) {
    return (
      <CenteredCard
        title="This view is for the buyer"
        body="You aren't the buyer on this escrow. Open the full transaction instead."
        primaryLabel="Open transaction"
        onPrimary={() => navigate(`/transactions/${escrow.id}`)}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const thumb = asset?.images?.[0];
  const sellerName =
    seller?.full_name ?? seller?.username ?? maskAddress(escrow.seller_address);

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: '#0B0B0C' }}
    >
      {/* Top bar */}
      <div
        className="border-b"
        style={{
          borderColor: 'rgba(212, 175, 55, 0.15)',
          backgroundColor: '#0E0E10',
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-white/10 bg-black/40"
                onClick={() => navigate('/escrow/dashboard')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={asset?.title ?? 'Asset'}
                    className="h-12 w-12 rounded-md object-cover border border-white/10"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md border border-white/10 bg-white/5 flex items-center justify-center">
                    <Package className="h-5 w-5 text-amber-300/80" />
                  </div>
                )}
                <div>
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-amber-300/80">
                    Your Order
                  </p>
                  <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                    {asset?.title ?? 'Escrow purchase'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {formatUsd(escrow.amount_usd ?? 0)} ·{' '}
                    <span className="text-foreground/80">{sellerName}</span>
                    {seller?.is_verified && (
                      <span className="ml-1 inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  'px-2.5 py-1 text-[0.7rem]',
                  released
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : disputeActive
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                )}
              >
                {released ? (
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                ) : disputeActive ? (
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Lock className="mr-1.5 h-3.5 w-3.5" />
                )}
                {released
                  ? 'Released'
                  : disputeActive
                  ? 'Release blocked — dispute open'
                  : 'Held'}
              </Badge>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(escrow.id);
                  toast.success('Order ID copied');
                }}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                ID {escrow.id.slice(0, 8)}…
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {released ? TRUST_RELEASED : TRUST_HELD}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            <EscrowStatusCard transactionId={escrow.id} variant="full" />

            {/* Shipment block */}
            <ShipmentBlock escrow={escrow} trackingUrl={trackingUrl} />

            {/* Dispute / countdown */}
            <DisputeWindowBlock
              released={released}
              disputeActive={disputeActive}
              delivered={delivered}
              buyerConfirmed={buyerConfirmed}
              disputeFiledAt={escrow.dispute_filed_at}
              autoReleaseAt={autoReleaseAt}
              countdown={countdown}
            />
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <p className="text-sm font-semibold">Your actions</p>
                </div>

                {released ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-sm font-semibold">
                        Transaction complete
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-emerald-300/80">
                      Funds released {formatDateTime(escrow.released_at)}.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => navigate('/portfolio')}
                    >
                      View portfolio
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Confirming receipt releases funds to the seller. If
                      something is wrong, open a dispute — funds remain in
                      escrow while it is reviewed.
                    </p>
                    <Button
                      className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
                      onClick={confirmReceipt}
                      disabled={!canConfirm || acting}
                    >
                      {acting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Confirm receipt
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={goToDispute}
                      disabled={acting || disputeActive}
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Report an issue
                    </Button>
                    {!delivered && (
                      <p className="text-[0.7rem] text-muted-foreground">
                        Confirm becomes available once the carrier reports
                        delivery.
                      </p>
                    )}
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80 pt-2">
                      {TRUST_RULE}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
              <CardContent className="p-6">
                <p className="text-sm font-semibold mb-4">Event timeline</p>
                <OrderTimeline escrow={escrow} events={events} />
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-4 w-4 mt-0.5 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold">Need help?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Our concierge team is available for high-value support.
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/help/shipping')}
                      >
                        Shipping & escrow help
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/contact')}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contact concierge
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ShipmentBlock({
  escrow,
  trackingUrl,
}: {
  escrow: EscrowRow;
  trackingUrl: string | null;
}) {
  const shipped = Boolean(escrow.shipped_at);
  const delivered = Boolean(escrow.tracking_delivered);

  return (
    <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold">Shipment</p>
          </div>
          <Badge
            className={cn(
              'px-2.5 py-1 text-[0.7rem]',
              delivered
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : shipped
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-white/20 bg-white/5 text-muted-foreground'
            )}
          >
            {delivered ? 'Delivered' : shipped ? 'In transit' : 'Awaiting seller'}
          </Badge>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{TRUST_SHIPPING}</p>

        <Separator className="my-4 bg-white/10" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Carrier" value={escrow.carrier?.toUpperCase() ?? '—'} />
          <Field
            label="Tracking number"
            value={
              escrow.tracking_number ? (
                trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200"
                  >
                    <span className="font-mono">{escrow.tracking_number}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="font-mono text-foreground">
                    {escrow.tracking_number}
                  </span>
                )
              ) : (
                '—'
              )
            }
          />
          <Field label="Shipped" value={formatDateTime(escrow.shipped_at)} />
          <Field
            label="Delivered"
            value={formatDateTime(
              escrow.tracking_delivered_at ?? escrow.delivered_at
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DisputeWindowBlock({
  released,
  disputeActive,
  delivered,
  buyerConfirmed,
  disputeFiledAt,
  autoReleaseAt,
  countdown,
}: {
  released: boolean;
  disputeActive: boolean;
  delivered: boolean;
  buyerConfirmed: boolean;
  disputeFiledAt: string | null;
  autoReleaseAt: Date | null;
  countdown: string | null;
}) {
  if (released) {
    return (
      <Card className="border border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              Transaction complete
            </p>
            <p className="mt-1 text-xs text-emerald-300/80">{TRUST_RELEASED}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (disputeActive) {
    return (
      <Card className="border border-red-500/30 bg-red-500/5">
        <CardContent className="p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">
              Dispute open · release blocked
            </p>
            <p className="mt-1 text-xs text-red-300/80">
              Dispute opened {formatDateTime(disputeFiledAt)}. Funds remain in
              escrow until the issue is resolved.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!delivered) {
    return (
      <Card className="border border-white/10 bg-neutral-950">
        <CardContent className="p-5 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-300 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Awaiting delivery</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The dispute window starts when your item is delivered. Until
              then, funds remain in escrow.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (buyerConfirmed) {
    return (
      <Card className="border border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-5 flex items-start gap-3">
          <CircleCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              Receipt confirmed
            </p>
            <p className="mt-1 text-xs text-emerald-300/80">
              Release is being finalized. You'll see "Released" as soon as the
              backend completes evaluation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-amber-500/20 bg-amber-500/5">
      <CardContent className="p-5 flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-300 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-200">
            Dispute window open
          </p>
          <p className="mt-1 text-xs text-amber-200/80">
            Auto-release in {countdown ?? '—'} if no dispute is opened.
            <br />
            <span className="text-amber-200/60">
              {autoReleaseAt
                ? `Auto-release at ${formatDateTime(autoReleaseAt.toISOString())}`
                : ''}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderTimeline({
  escrow,
  events,
}: {
  escrow: EscrowRow;
  events: EscrowEventRow[];
}) {
  // Build a derived timeline from escrow row + audit events.
  type Step = {
    label: string;
    timestamp: string | null;
    icon: React.ReactNode;
    tone: 'done' | 'current' | 'pending';
  };

  const steps: Step[] = [];

  steps.push({
    label: 'Purchase completed',
    timestamp: escrow.funded_at ?? escrow.created_at,
    icon: <CircleCheck className="h-3.5 w-3.5" />,
    tone: 'done',
  });

  steps.push({
    label: 'Seller shipped',
    timestamp: escrow.shipped_at,
    icon: <Truck className="h-3.5 w-3.5" />,
    tone: escrow.shipped_at ? 'done' : 'pending',
  });

  steps.push({
    label: 'Delivered',
    timestamp: escrow.tracking_delivered_at ?? escrow.delivered_at,
    icon: <PackageCheck className="h-3.5 w-3.5" />,
    tone:
      escrow.tracking_delivered
        ? 'done'
        : escrow.shipped_at
        ? 'current'
        : 'pending',
  });

  steps.push({
    label: 'Receipt confirmed',
    timestamp: escrow.buyer_confirmed_at,
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    tone:
      escrow.buyer_confirmed
        ? 'done'
        : escrow.tracking_delivered
        ? 'current'
        : 'pending',
  });

  steps.push({
    label: 'Funds released',
    timestamp: escrow.released_at,
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    tone: escrow.escrow_status === 'released' ? 'done' : 'pending',
  });

  // If a dispute was filed, surface it inline.
  if (escrow.dispute_filed_at) {
    steps.splice(3, 0, {
      label: 'Dispute opened',
      timestamp: escrow.dispute_filed_at,
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      tone: 'current',
    });
  }

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const dotTone =
          step.tone === 'done'
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
            : step.tone === 'current'
            ? 'border-amber-500 bg-amber-500/20 text-amber-300'
            : 'border-white/15 bg-white/5 text-muted-foreground';
        const labelTone =
          step.tone === 'pending' ? 'text-muted-foreground' : 'text-foreground';

        return (
          <div key={`${step.label}-${idx}`} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <div className="absolute left-[11px] top-6 h-full w-0.5 bg-white/10" />
            )}
            <div
              className={cn(
                'relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center',
                dotTone
              )}
            >
              {step.icon}
            </div>
            <div className="flex-1">
              <p className={cn('text-sm font-medium', labelTone)}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {step.timestamp ? formatDateTime(step.timestamp) : 'Pending'}
              </p>
            </div>
          </div>
        );
      })}

      {events.length > 0 && (
        <details className="mt-3 group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            View audit log ({events.length})
          </summary>
          <div className="mt-2 space-y-1 pl-1">
            {events.map((evt) => (
              <p key={evt.id} className="text-[0.7rem] text-muted-foreground">
                <span className="text-foreground/80">{evt.event_type}</span>
                {evt.reason ? ` · ${evt.reason}` : ''} ·{' '}
                {formatDateTime(evt.created_at)}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your order…
      </div>
    </div>
  );
}

function CenteredCard({
  title,
  body,
  primaryLabel,
  onPrimary,
}: {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
        <CardContent className="py-10 text-center px-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          <Button
            className="mt-6 w-full rounded-full bg-amber-500 text-black hover:bg-amber-400"
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
