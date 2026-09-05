/**
 * SellerFulfillmentWorkspace
 *
 * The seller's operating cockpit for a single escrow. Answers, at a glance:
 *   - What must I ship and by when?
 *   - What is my current SLA status?
 *   - Where do I stand on payout / release?
 *
 * All state derives from `escrow_transactions` and the
 * `evaluate_escrow_release` RPC. Submitting shipping details updates the
 * escrow row and immediately asks the backend to re-evaluate release.
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
  Copy,
  HelpCircle,
  Loader2,
  Package,
  Truck,
  PackageCheck,
  CircleCheck,
  MessageCircle,
  Calendar,
  Upload,
  FileText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import EscrowStatusCard from '@/components/EscrowStatusCard';
import { cn } from '@/lib/utils';
import {
  APPROVED_CARRIERS,
  CATEGORY_REQUIREMENTS,
  type ApprovedCarrier,
  type ItemCategory,
  getShippingDeadline,
} from '@/modules/shipping/types';

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
  platform_fee_usd: number | null;
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
  dispute_filed_at: string | null;
  seller_failed_sla: boolean | null;
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

interface BuyerProfile {
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

type SlaStatus = 'on_track' | 'at_risk' | 'missed' | 'shipped';

// ---------------------------------------------------------------------------
// Trust copy
// ---------------------------------------------------------------------------

const TRUST_SHIPPING =
  "Seller is responsible for insured shipping to the buyer's verified address.";
const TRUST_HELD =
  'Funds remain in escrow until delivery is confirmed.';
const TRUST_RELEASED =
  'Funds have been released to the seller. Transaction complete.';
const TRUST_RULE =
  'Release occurs only when all conditions are met.';
const TRUST_SLA_WARNING =
  'Missing the ship-by deadline may delay or block release.';

const DEFAULT_CATEGORY: ItemCategory = 'collectibles';

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

function resolveCategory(value: string | null | undefined): ItemCategory {
  if (!value) return DEFAULT_CATEGORY;
  const v = value.toLowerCase();
  if (
    v === 'jewelry' ||
    v === 'watches' ||
    v === 'art' ||
    v === 'cars' ||
    v === 'wine' ||
    v === 'collectibles' ||
    v === 'real_estate'
  ) {
    return v as ItemCategory;
  }
  return DEFAULT_CATEGORY;
}

function getSlaStatus(
  escrow: EscrowRow,
  deadline: Date
): { status: SlaStatus; hoursLeft: number } {
  const now = Date.now();
  const hoursLeft = Math.round((deadline.getTime() - now) / (1000 * 60 * 60));
  if (escrow.seller_failed_sla) return { status: 'missed', hoursLeft };
  if (escrow.shipped_at) return { status: 'shipped', hoursLeft };
  if (hoursLeft <= 0) return { status: 'missed', hoursLeft };
  if (hoursLeft <= 48) return { status: 'at_risk', hoursLeft };
  return { status: 'on_track', hoursLeft };
}

function formatRelative(hoursLeft: number): string {
  if (hoursLeft <= 0) {
    const overdueHours = Math.abs(hoursLeft);
    if (overdueHours >= 48) return `${Math.floor(overdueHours / 24)}d overdue`;
    return `${overdueHours}h overdue`;
  }
  if (hoursLeft >= 48) return `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`;
  return `${hoursLeft}h`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SellerFulfillmentWorkspace() {
  const navigate = useNavigate();
  const { escrowId } = useParams<{ escrowId: string }>();
  const { user } = useAuth();

  const [escrow, setEscrow] = useState<EscrowRow | null>(null);
  const [asset, setAsset] = useState<AssetRow | null>(null);
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [events, setEvents] = useState<EscrowEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Re-render countdown every minute
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // -------------------------------------------------------------------------
  // Data
  // -------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    if (!escrowId) return;
    setError(null);

    const { data, error: rowError } = await supabase
      .from('escrow_transactions')
      .select(
        'id, asset_id, buyer_id, seller_id, buyer_address, seller_address, amount_usd, platform_fee_usd, status, escrow_status, carrier, tracking_number, shipped_at, delivered_at, tracking_delivered, tracking_delivered_at, buyer_confirmed, buyer_confirmed_at, dispute_active, dispute_filed_at, seller_failed_sla, released_at, release_reason, created_at, funded_at, updated_at'
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

    const [assetRes, buyerRes, eventsRes] = await Promise.all([
      row.asset_id
        ? supabase
            .from('assets')
            .select('id, title, category, images')
            .eq('id', row.asset_id)
            .maybeSingle()
            .then((r) => r.data as AssetRow | null)
        : Promise.resolve(null),
      row.buyer_id
        ? supabase
            .from('profiles')
            .select(
              'user_id, full_name, username, is_verified, profile_image_url, wallet_address'
            )
            .eq('user_id', row.buyer_id)
            .maybeSingle()
            .then((r) => r.data as BuyerProfile | null)
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
    setBuyer(buyerRes);
    setEvents(eventsRes);
  }, [escrowId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    })();
  }, [fetchAll]);

  // Realtime
  useEffect(() => {
    if (!escrowId) return;
    const channel = supabase
      .channel(`seller-fulfill-${escrowId}`)
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
  // Derived
  // -------------------------------------------------------------------------

  const isSeller = useMemo(
    () => Boolean(user && escrow && user.id === escrow.seller_id),
    [user, escrow]
  );

  const category = useMemo(
    () => resolveCategory(asset?.category),
    [asset?.category]
  );

  const requirements = CATEGORY_REQUIREMENTS[category];

  const shipByDeadline = useMemo<Date | null>(() => {
    if (!escrow) return null;
    return getShippingDeadline(
      new Date(escrow.funded_at ?? escrow.created_at),
      category
    );
  }, [escrow, category]);

  const sla = useMemo(() => {
    if (!escrow || !shipByDeadline) {
      return { status: 'on_track' as SlaStatus, hoursLeft: 0 };
    }
    return getSlaStatus(escrow, shipByDeadline);
  }, [escrow, shipByDeadline]);

  // -------------------------------------------------------------------------
  // Guards
  // -------------------------------------------------------------------------

  if (!user) {
    return (
      <CenteredCard
        title="Sign in required"
        body="Sign in to manage fulfillment for this order."
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

  if (!isSeller) {
    return (
      <CenteredCard
        title="This view is for the seller"
        body="You aren't the seller on this escrow. Open the full transaction instead."
        primaryLabel="Open transaction"
        onPrimary={() => navigate(`/transactions/${escrow.id}`)}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const thumb = asset?.images?.[0];
  const buyerName =
    buyer?.full_name ?? buyer?.username ?? maskAddress(escrow.buyer_address);
  const released = escrow.escrow_status === 'released';
  const disputeActive = Boolean(escrow.dispute_active);

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
                    Fulfillment
                  </p>
                  <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                    {asset?.title ?? 'Escrow sale'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {formatUsd(escrow.amount_usd ?? 0)} ·{' '}
                    <span className="text-foreground/80">Buyer: {buyerName}</span>
                    {buyer?.is_verified && (
                      <span className="ml-1 inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusPill
                released={released}
                disputeActive={disputeActive}
                slaMissed={sla.status === 'missed' && !escrow.shipped_at}
              />
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

          <p className="mt-3 text-xs text-muted-foreground">{TRUST_SHIPPING}</p>
        </div>
      </div>

      {/* Main */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: fulfillment actions */}
          <div className="space-y-6 lg:col-span-2">
            <ShipByDeadlineCard
              deadline={shipByDeadline}
              sla={sla}
              shipped={Boolean(escrow.shipped_at)}
              shippedAt={escrow.shipped_at}
              slaDays={requirements.shippingSLADays}
            />

            <ShippingForm
              escrow={escrow}
              category={category}
              requirements={requirements}
              onSubmitted={fetchAll}
            />

            <ProofUploadsCard />
          </div>

          {/* Right column: status visibility */}
          <div className="space-y-6">
            <EscrowStatusCard transactionId={escrow.id} variant="full" />

            <PayoutCard escrow={escrow} />

            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
              <CardContent className="p-6">
                <p className="text-sm font-semibold mb-4">Event timeline</p>
                <SellerTimeline escrow={escrow} events={events} />
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-4 w-4 mt-0.5 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Need help?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {TRUST_SLA_WARNING}
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

function StatusPill({
  released,
  disputeActive,
  slaMissed,
}: {
  released: boolean;
  disputeActive: boolean;
  slaMissed: boolean;
}) {
  const tone = released
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : disputeActive
    ? 'border-red-500/30 bg-red-500/10 text-red-300'
    : slaMissed
    ? 'border-red-500/30 bg-red-500/10 text-red-300'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

  const Icon = released
    ? ShieldCheck
    : disputeActive || slaMissed
    ? AlertTriangle
    : Lock;

  const label = released
    ? 'Released'
    : disputeActive
    ? 'Release blocked — dispute'
    : slaMissed
    ? 'At Risk — SLA missed'
    : 'Held';

  return (
    <Badge className={cn('px-2.5 py-1 text-[0.7rem]', tone)}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

function ShipByDeadlineCard({
  deadline,
  sla,
  shipped,
  shippedAt,
  slaDays,
}: {
  deadline: Date | null;
  sla: { status: SlaStatus; hoursLeft: number };
  shipped: boolean;
  shippedAt: string | null;
  slaDays: number;
}) {
  if (shipped) {
    return (
      <Card className="border border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-5 flex items-start gap-3">
          <Truck className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-300">
              Shipped {formatDateTime(shippedAt)}
            </p>
            <p className="mt-1 text-xs text-emerald-300/80">
              Tracking is being monitored. Funds will release automatically when
              all conditions are met.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sla.status === 'missed') {
    return (
      <Card className="border border-red-500/30 bg-red-500/5">
        <CardContent className="p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              Missed shipping deadline — release blocked
            </p>
            <p className="mt-1 text-xs text-red-300/80">
              Ship by was {formatDateTime(deadline?.toISOString() ?? null)} ·{' '}
              {formatRelative(sla.hoursLeft)}.{' '}
              Ship as soon as possible and contact the buyer, or open a
              resolution path.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tone =
    sla.status === 'at_risk'
      ? 'border-amber-500/30 bg-amber-500/5'
      : 'border-white/10 bg-neutral-950';
  const headingTone =
    sla.status === 'at_risk' ? 'text-amber-200' : 'text-foreground';

  return (
    <Card className={cn(tone)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-amber-300 mt-0.5" />
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', headingTone)}>
              Ship by {formatDateTime(deadline?.toISOString() ?? null)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelative(sla.hoursLeft)} remaining ·{' '}
              {slaDays}-day SLA for this category.
            </p>
            <p className="mt-2 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              SLA · {sla.status === 'at_risk' ? 'At risk' : 'On track'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShippingForm({
  escrow,
  category,
  requirements,
  onSubmitted,
}: {
  escrow: EscrowRow;
  category: ItemCategory;
  requirements: typeof CATEGORY_REQUIREMENTS[ItemCategory];
  onSubmitted: () => Promise<void> | void;
}) {
  const approved = requirements.approvedCarriers;
  const initialCarrier =
    (escrow.carrier as ApprovedCarrier | null) ?? approved[0] ?? 'other';

  const [carrier, setCarrier] = useState<ApprovedCarrier>(initialCarrier);
  const [trackingNumber, setTrackingNumber] = useState(
    escrow.tracking_number ?? ''
  );
  const [insuredValue, setInsuredValue] = useState<string>(
    String(escrow.amount_usd ?? '')
  );
  const [insuranceConfirmed, setInsuranceConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const released = escrow.escrow_status === 'released';
  const shipped = Boolean(escrow.shipped_at);
  const disabled = released;

  const handleSubmit = useCallback(async () => {
    if (!trackingNumber.trim()) {
      toast.error('Tracking number is required');
      return;
    }
    if (requirements.requiresInsurance) {
      const numeric = Number(insuredValue);
      if (!numeric || numeric <= 0) {
        toast.error('Insured value is required');
        return;
      }
      if (!insuranceConfirmed) {
        toast.error('Please confirm insurance has been added');
        return;
      }
    }

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({
        carrier,
        tracking_number: trackingNumber.trim().toUpperCase(),
        shipped_at: new Date().toISOString(),
        status: 'shipped',
        seller_failed_sla: false,
      })
      .eq('id', escrow.id);
    if (updateError) {
      toast.error(updateError.message);
      setSubmitting(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc('evaluate_escrow_release', {
      p_transaction_id: escrow.id,
    });
    if (rpcError) {
      // eslint-disable-next-line no-console
      console.error('[SellerFulfillmentWorkspace] evaluate_escrow_release', rpcError);
    }

    toast.success('Shipping details submitted');
    await onSubmitted();
    setSubmitting(false);
  }, [
    carrier,
    trackingNumber,
    insuredValue,
    insuranceConfirmed,
    requirements.requiresInsurance,
    escrow.id,
    onSubmitted,
  ]);

  return (
    <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold">Shipping details</p>
          </div>
          {shipped && (
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[0.65rem]">
              Submitted
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Category: <span className="text-foreground/80">{category}</span> ·{' '}
          Approved carriers:{' '}
          <span className="text-foreground/80">
            {approved.map((c) => APPROVED_CARRIERS[c]?.name ?? c).join(', ')}
          </span>
        </p>

        <Separator className="bg-white/10" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier</Label>
            <Select
              value={carrier}
              onValueChange={(v) => setCarrier(v as ApprovedCarrier)}
              disabled={disabled}
            >
              <SelectTrigger id="carrier" className="bg-black/40">
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(APPROVED_CARRIERS).map((info) => (
                  <SelectItem key={info.code} value={info.code}>
                    {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking number</Label>
            <Input
              id="tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
              className="bg-black/40 font-mono"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insured">Insured value (USD)</Label>
            <Input
              id="insured"
              type="number"
              min="0"
              step="1"
              value={insuredValue}
              onChange={(e) => setInsuredValue(e.target.value)}
              className="bg-black/40"
              disabled={disabled}
            />
            <p className="text-[0.7rem] text-muted-foreground">
              {requirements.requiresInsurance
                ? `Required: minimum ${requirements.minInsurancePercent}% of declared value.`
                : 'Optional but recommended.'}
            </p>
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label className="invisible sm:visible">Insurance</Label>
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox
                checked={insuranceConfirmed}
                onCheckedChange={(v) => setInsuranceConfirmed(Boolean(v))}
                disabled={disabled}
                className="mt-0.5"
              />
              <span>
                I confirm insurance has been added for the full declared value.
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/20 p-3 text-[0.7rem] text-muted-foreground">
          {requirements.handlingNotes}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 bg-amber-500 text-black hover:bg-amber-400"
            onClick={handleSubmit}
            disabled={submitting || disabled}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Truck className="mr-2 h-4 w-4" />
            )}
            {shipped ? 'Update shipping details' : 'Submit shipping'}
          </Button>
        </div>

        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80">
          {TRUST_RULE}
        </p>
      </CardContent>
    </Card>
  );
}

function ProofUploadsCard() {
  return (
    <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-400" />
          <p className="text-sm font-semibold">Proof & documents</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload shipping receipts, photos of packaged items, or bill of lading.
          Storage and persistence land in the next release.
        </p>
        <div className="border border-dashed border-white/20 rounded-lg p-6 text-center opacity-60">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag &amp; drop files, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, PDF up to 10 MB (coming soon)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PayoutCard({ escrow }: { escrow: EscrowRow }) {
  const released = escrow.escrow_status === 'released';
  const fee = escrow.platform_fee_usd ?? 0;
  const net = Math.max(0, (escrow.amount_usd ?? 0) - fee);

  return (
    <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <p className="text-sm font-semibold">Payout</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Gross
            </p>
            <p>{formatUsd(escrow.amount_usd ?? 0)}</p>
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Platform fee
            </p>
            <p>{formatUsd(fee)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              Net to seller
            </p>
            <p className="text-base font-semibold">{formatUsd(net)}</p>
          </div>
        </div>

        <div
          className={cn(
            'rounded-md border px-3 py-2 text-xs',
            released
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
              : 'border-white/10 bg-black/20 text-muted-foreground'
          )}
        >
          {released
            ? `${TRUST_RELEASED} Released ${formatDateTime(escrow.released_at)}.`
            : `${TRUST_HELD} Funds will release automatically when all conditions are met.`}
        </div>
      </CardContent>
    </Card>
  );
}

function SellerTimeline({
  escrow,
  events,
}: {
  escrow: EscrowRow;
  events: EscrowEventRow[];
}) {
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
    label: 'You shipped',
    timestamp: escrow.shipped_at,
    icon: <Truck className="h-3.5 w-3.5" />,
    tone: escrow.shipped_at ? 'done' : 'current',
  });
  steps.push({
    label: 'Delivered',
    timestamp: escrow.tracking_delivered_at ?? escrow.delivered_at,
    icon: <PackageCheck className="h-3.5 w-3.5" />,
    tone: escrow.tracking_delivered
      ? 'done'
      : escrow.shipped_at
      ? 'current'
      : 'pending',
  });
  steps.push({
    label: 'Buyer confirmed receipt',
    timestamp: escrow.buyer_confirmed_at,
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    tone: escrow.buyer_confirmed
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
          <div
            key={`${step.label}-${idx}`}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
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
              <p className={cn('text-sm font-medium', labelTone)}>{step.label}</p>
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
              <p
                key={evt.id}
                className="text-[0.7rem] text-muted-foreground"
              >
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

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading fulfillment…
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
