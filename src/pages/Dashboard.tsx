/**
 * Dashboard
 *
 * The signed-in user's home. Real data only:
 *   - assets the user owns (public.assets where owner_id = auth.uid())
 *   - escrow_transactions where buyer_id = auth.uid() or seller_id = auth.uid()
 *
 * Buyer rows link to /order/:id, seller rows to /fulfill/:id.
 * No platform-wide metrics, no wallet wall.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Gem,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssetRow {
  id: string;
  title: string;
  category: string | null;
  status: string | null;
  estimated_value: number | null;
  images: string[] | null;
  created_at: string | null;
}

interface EscrowRow {
  id: string;
  asset_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  amount_usd: number | null;
  status: string | null;
  escrow_status: string | null;
  tracking_delivered: boolean | null;
  buyer_confirmed: boolean | null;
  dispute_active: boolean | null;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatUsd = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const humanize = (value: string | null | undefined) =>
  value ? value.replace(/_/g, ' ') : 'unknown';

function escrowLabel(row: EscrowRow): { text: string; tone: 'gold' | 'ivory' | 'muted' | 'red' } {
  if (row.dispute_active) return { text: 'Dispute open', tone: 'red' };
  if (row.escrow_status === 'released') return { text: 'Funds released', tone: 'ivory' };
  if (row.escrow_status === 'refunded') return { text: 'Refunded', tone: 'muted' };
  if (row.buyer_confirmed) return { text: 'Receipt confirmed', tone: 'gold' };
  if (row.tracking_delivered) return { text: 'Delivered', tone: 'gold' };
  if (row.status === 'shipped') return { text: 'In transit', tone: 'ivory' };
  return { text: 'Funds held in escrow', tone: 'gold' };
}

const toneClass: Record<'gold' | 'ivory' | 'muted' | 'red', string> = {
  gold: 'border-[#D4AF37]/40 text-[#D4AF37]',
  ivory: 'border-white/20 text-[#F8F6F0]',
  muted: 'border-white/10 text-muted-foreground',
  red: 'border-red-400/40 text-red-300',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [escrows, setEscrows] = useState<EscrowRow[]>([]);
  const [assetTitles, setAssetTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    const [assetsRes, escrowsRes] = await Promise.all([
      supabase
        .from('assets')
        .select('id, title, category, status, estimated_value, images, created_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('escrow_transactions')
        .select(
          'id, asset_id, buyer_id, seller_id, amount_usd, status, escrow_status, tracking_delivered, buyer_confirmed, dispute_active, created_at'
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false }),
    ]);

    if (assetsRes.error) {
      // eslint-disable-next-line no-console
      console.error('[Dashboard] assets', assetsRes.error);
    }
    if (escrowsRes.error) {
      // eslint-disable-next-line no-console
      console.error('[Dashboard] escrow_transactions', escrowsRes.error);
    }
    if (assetsRes.error && escrowsRes.error) {
      setError(assetsRes.error.message || escrowsRes.error.message);
    }

    const ownAssets = (assetsRes.data ?? []) as AssetRow[];
    const deals = (escrowsRes.data ?? []) as EscrowRow[];
    setAssets(ownAssets);
    setEscrows(deals);

    // Resolve titles for escrow rows whose asset the user does not own (buyer side).
    const titles: Record<string, string> = {};
    ownAssets.forEach((a) => {
      titles[a.id] = a.title;
    });
    const missing = Array.from(
      new Set(deals.map((d) => d.asset_id).filter((id): id is string => !!id && !titles[id]))
    );
    if (missing.length > 0) {
      const { data: extra } = await supabase.from('assets').select('id, title').in('id', missing);
      (extra ?? []).forEach((a: { id: string; title: string }) => {
        titles[a.id] = a.title;
      });
    }
    setAssetTitles(titles);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchAll(user.id);
  }, [user, authLoading, fetchAll]);

  const buying = useMemo(
    () => escrows.filter((e) => user && e.buyer_id === user.id),
    [escrows, user]
  );
  const selling = useMemo(
    () => escrows.filter((e) => user && e.seller_id === user.id && e.buyer_id !== user.id),
    [escrows, user]
  );

  // -------------------------------------------------------------------------
  // Guards
  // -------------------------------------------------------------------------

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-[#141414]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-lg font-semibold">Sign in to view your dashboard</CardTitle>
            <CardDescription className="text-center text-sm text-muted-foreground">
              Your listings, purchases, and escrow positions appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background text-[#F8F6F0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">Your dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Listings you own and every escrow you are party to.
            </p>
          </div>
          <Button onClick={() => navigate('/list-asset')}>
            <Plus className="mr-2 h-4 w-4" />
            List an Asset
          </Button>
        </div>

        {error && (
          <Card className="border border-red-400/30 bg-red-950/20">
            <CardContent className="p-4 text-sm text-red-200">
              Could not load your data: {error}
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard icon={<Gem className="h-4 w-4" />} label="Assets you own" value={String(assets.length)} />
          <SummaryCard icon={<ShoppingBag className="h-4 w-4" />} label="Purchases in escrow" value={String(buying.length)} />
          <SummaryCard icon={<Store className="h-4 w-4" />} label="Sales in escrow" value={String(selling.length)} />
        </div>

        {/* Purchases */}
        <Section
          title="Your purchases"
          description="Escrow positions where you are the buyer."
          empty={
            <EmptyState
              icon={<ShoppingBag className="h-5 w-5" />}
              text="You have not purchased anything yet."
              cta={{ label: 'Browse the Collection', to: '/marketplace' }}
            />
          }
          isEmpty={buying.length === 0}
        >
          {buying.map((row) => (
            <EscrowRowItem key={row.id} row={row} title={assetTitles[row.asset_id ?? ''] ?? 'Asset'} href={`/order/${row.id}`} role="buyer" />
          ))}
        </Section>

        {/* Sales */}
        <Section
          title="Your sales"
          description="Escrow positions where you are the seller."
          empty={<EmptyState icon={<Store className="h-5 w-5" />} text="No sales in escrow yet." />}
          isEmpty={selling.length === 0}
        >
          {selling.map((row) => (
            <EscrowRowItem key={row.id} row={row} title={assetTitles[row.asset_id ?? ''] ?? 'Asset'} href={`/fulfill/${row.id}`} role="seller" />
          ))}
        </Section>

        {/* Owned assets */}
        <Section
          title="Assets you own"
          description="Everything listed under your account."
          empty={
            <EmptyState
              icon={<Gem className="h-5 w-5" />}
              text="You have not listed an asset yet."
              cta={{ label: 'List an Asset', to: '/list-asset' }}
            />
          }
          isEmpty={assets.length === 0}
        >
          {assets.map((asset) => (
            <Link
              key={asset.id}
              to={`/purchase/${asset.id}`}
              className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#141414] p-4 transition-colors hover:border-[#D4AF37]/40"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#1E1E1F]">
                {asset.images?.[0] && !asset.images[0].startsWith('blob:') ? (
                  <img src={asset.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Gem className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{asset.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {humanize(asset.category)} · listed {formatDate(asset.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatUsd(asset.estimated_value)}</p>
                <Badge variant="outline" className="mt-1 border-white/15 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  {humanize(asset.status)}
                </Badge>
              </div>
            </Link>
          ))}
        </Section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border border-white/10 bg-[#141414]">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className="text-[#D4AF37]">{icon}</div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  description,
  isEmpty,
  empty,
  children,
}: {
  title: string;
  description: string;
  isEmpty: boolean;
  empty: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {isEmpty ? empty : <div className="space-y-3">{children}</div>}
    </section>
  );
}

function EmptyState({ icon, text, cta }: { icon: React.ReactNode; text: string; cta?: { label: string; to: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/10 p-8 text-center">
      <div className="text-[#D4AF37]">{icon}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
      {cta && (
        <Button asChild variant="outline" size="sm">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}

function EscrowRowItem({ row, title, href, role }: { row: EscrowRow; title: string; href: string; role: 'buyer' | 'seller' }) {
  const label = escrowLabel(row);
  const Icon = role === 'buyer' ? Package : PackageCheck;
  return (
    <Link
      to={href}
      className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#141414] p-4 transition-colors hover:border-[#D4AF37]/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1E1E1F] text-[#D4AF37]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {role === 'buyer' ? 'Purchased' : 'Sold'} {formatDate(row.created_at)} · {formatUsd(row.amount_usd)}
        </p>
      </div>
      <Badge variant="outline" className={`text-[0.65rem] uppercase tracking-wider ${toneClass[label.tone]}`}>
        {label.text}
      </Badge>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
