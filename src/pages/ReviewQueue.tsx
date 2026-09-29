import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import {
  BadgeCheck,
  FileText,
  Loader2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

interface PendingAsset {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  estimated_value: number | null;
  currency: string | null;
  images: string[] | null;
  status: string;
  created_at: string;
  owner_id: string;
  verification_documents: string[] | null;
  video_url: string | null;
}

const formatUsd = (value: number | null) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export default function ReviewQueue() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PendingAsset[]>([]);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [loadingRows, setLoadingRows] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const isAdmin = userRole === 'admin';

  const load = useCallback(async () => {
    setLoadingRows(true);
    const { data, error } = await (supabase.from('assets') as any)
      .select(
        'id, title, description, category, estimated_value, currency, images, status, created_at, owner_id, verification_documents, video_url'
      )
      .eq('listing_review_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`Could not load review queue: ${error.message}`);
      setLoadingRows(false);
      return;
    }

    const list = (data ?? []) as PendingAsset[];
    setRows(list);

    const ownerIds = Array.from(new Set(list.map((r) => r.owner_id).filter(Boolean)));
    if (ownerIds.length > 0) {
      try {
        const rpcClient = supabase as unknown as {
          rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
        };
        const { data: profiles } = await rpcClient.rpc('get_public_profiles', {
          p_user_ids: ownerIds,
        });
        const map: Record<string, string> = {};
        (Array.isArray(profiles) ? profiles : []).forEach(
          (p: { user_id?: string; full_name?: string; username?: string }) => {
            if (p.user_id) map[p.user_id] = p.full_name ?? p.username ?? 'Anonymous';
          }
        );
        setSellerNames(map);
      } catch {
        // RPC missing — names fall back to masked ids.
      }
    }
    setLoadingRows(false);
  }, []);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    void load();
  }, [loading, user, isAdmin, load]);

  const act = async (assetId: string, decision: 'reviewed' | 'rejected', reasonText?: string) => {
    setBusyId(assetId);
    const rpcClient = supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
    };
    const { error } = await rpcClient.rpc('review_asset_listing', {
      p_asset_id: assetId,
      p_decision: decision,
      p_reason: reasonText ?? null,
    });
    if (error) {
      toast.error(`Review failed: ${error.message}`);
    } else {
      toast.success(decision === 'reviewed' ? 'Marked reviewed' : 'Listing rejected and delisted');
      setRejectId(null);
      setReason('');
      setRows((prev) => prev.filter((r) => r.id !== assetId));
    }
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0B0C' }}>
        <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0B0B0C' }}>
        <Card className="w-full max-w-md border border-white/10 bg-neutral-950">
          <CardContent className="py-10 text-center">
            <ShieldAlert className="mx-auto mb-4 h-8 w-8 text-amber-300" />
            <h3 className="text-lg font-semibold text-white">Admins only</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This queue is restricted to LuxLedger reviewers.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => navigate('/')}>
              Back to LuxLedger
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
            LISTING REVIEW
          </h1>
          <p className="text-sm text-muted-foreground">
            {loadingRows ? 'Loading…' : `${rows.length} awaiting review`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-4">
        {loadingRows ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
          </div>
        ) : rows.length === 0 ? (
          <Card className="border border-white/10 bg-neutral-950">
            <CardContent className="py-12 text-center">
              <BadgeCheck className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
              <p className="text-sm text-muted-foreground">Queue is clear — nothing pending review.</p>
            </CardContent>
          </Card>
        ) : (
          rows.map((row) => (
            <Card key={row.id} className="border border-white/10 bg-neutral-950">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                    {row.images?.[0] ? (
                      <img src={row.images[0]} alt={row.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{row.title}</h3>
                      <Badge variant="outline" className="capitalize">
                        {row.category?.replace('_', ' ') ?? 'asset'}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">{row.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {row.description ?? '—'}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatUsd(row.estimated_value)} ·{' '}
                      {sellerNames[row.owner_id] ?? row.owner_id.slice(0, 8)} ·{' '}
                      {new Date(row.created_at).toLocaleDateString()}
                      {(row.verification_documents?.length ?? 0) > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-300/80">
                          <FileText className="h-3 w-3" />
                          {row.verification_documents!.length} doc
                          {row.verification_documents!.length === 1 ? '' : 's'} on file
                        </span>
                      )}
                      {row.video_url && (
                        <span className="ml-2 text-amber-300/80">· video</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/asset/${row.id}`)}
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#B68E2A]"
                      disabled={busyId === row.id}
                      onClick={() => act(row.id, 'reviewed')}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="mr-1.5 h-4 w-4" />
                      )}
                      Mark reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                      disabled={busyId === row.id}
                      onClick={() => {
                        setRejectId(rejectId === row.id ? null : row.id);
                        setReason('');
                      }}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>

                {rejectId === row.id && (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-xs text-red-300/80">
                      Rejecting delists the asset (status → draft). A reason is required.
                    </p>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this listing rejected?"
                      className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-muted-foreground"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-500"
                        disabled={!reason.trim() || busyId === row.id}
                        onClick={() => act(row.id, 'rejected', reason.trim())}
                      >
                        {busyId === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirm reject'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRejectId(null);
                          setReason('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
