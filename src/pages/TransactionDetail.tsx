import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import {
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  User,
  Calendar,
  Hash,
  DollarSign,
  FileText,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

type TransactionStatus = "completed" | "pending" | "failed" | "cancelled" | "processing";

interface TransactionDetail {
  id: string;
  type: "purchase" | "sale" | "escrow_created" | "escrow_released" | "escrow_refunded" | "subscription" | "broker_payout";
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  created_at: string;
  completed_at?: string;
  tx_hash?: string;
  asset?: {
    id: string;
    title: string;
    category: string;
    images: string[];
  };
  buyer?: {
    id: string;
    display_name?: string;
    wallet_address?: string;
  };
  seller?: {
    id: string;
    display_name?: string;
    wallet_address?: string;
  };
  escrow?: {
    id: string;
    status: string;
    funded_at?: string;
    released_at?: string;
    condition?: string;
  };
  fees?: {
    platform_fee: number;
    escrow_fee: number;
    network_fee: number;
    total_fees: number;
  };
  timeline?: {
    event: string;
    timestamp: string;
    status: "completed" | "pending" | "current";
  }[];
}

const statusConfig: Record<TransactionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  completed: {
    label: "Completed",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  pending: {
    label: "Pending",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    icon: <Clock className="h-4 w-4" />,
  },
  processing: {
    label: "Processing",
    color: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
  },
  failed: {
    label: "Failed",
    color: "border-red-500/40 bg-red-500/10 text-red-300",
    icon: <XCircle className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "border-white/20 bg-white/5 text-muted-foreground",
    icon: <AlertCircle className="h-4 w-4" />,
  },
};

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchTransaction();
    }
  }, [user, id]);

  const fetchTransaction = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      // Try to fetch from transactions table
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          assets (id, title, category, images),
          buyer:profiles!transactions_buyer_id_fkey (id, display_name, wallet_address),
          seller:profiles!transactions_seller_id_fkey (id, display_name, wallet_address)
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.log("Using mock transaction data");
        setTransaction(getMockTransaction(id));
      } else {
        // Transform to our interface
        setTransaction({
          id: data.id,
          type: data.buyer_id === user.id ? "purchase" : "sale",
          title: data.assets?.title || "Transaction",
          description: data.description || "",
          amount: data.price || data.amount || 0,
          currency: data.currency || "USD",
          status: data.status as TransactionStatus,
          created_at: data.created_at,
          completed_at: data.completed_at,
          tx_hash: data.tx_hash,
          asset: data.assets,
          buyer: data.buyer,
          seller: data.seller,
          fees: {
            platform_fee: (data.price || 0) * 0.025,
            escrow_fee: (data.price || 0) * 0.01,
            network_fee: 0.5,
            total_fees: (data.price || 0) * 0.035 + 0.5,
          },
          timeline: generateTimeline(data),
        });
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      setTransaction(getMockTransaction(id));
    } finally {
      setLoading(false);
    }
  };

  const getMockTransaction = (txId: string): TransactionDetail => {
    const now = new Date();
    return {
      id: txId,
      type: "purchase",
      title: "Vintage Rolex Submariner 1680",
      description: "Purchase of authenticated luxury timepiece with full provenance documentation.",
      amount: 45000,
      currency: "USD",
      status: "completed",
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tx_hash: "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855",
      asset: {
        id: "asset-1",
        title: "Vintage Rolex Submariner 1680",
        category: "watches",
        images: [],
      },
      buyer: {
        id: "buyer-1",
        display_name: "You",
        wallet_address: "rDemoWallet1234567890LuxLedger",
      },
      seller: {
        id: "seller-1",
        display_name: "Verified Seller",
        wallet_address: "rSeller9876543210Premium",
      },
      escrow: {
        id: "escrow-1",
        status: "released",
        funded_at: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
        released_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        condition: "Asset delivery confirmed by buyer",
      },
      fees: {
        platform_fee: 1125,
        escrow_fee: 450,
        network_fee: 0.5,
        total_fees: 1575.5,
      },
      timeline: [
        { event: "Transaction initiated", timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
        { event: "Escrow funded", timestamp: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
        { event: "Asset shipped", timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
        { event: "Delivery confirmed", timestamp: new Date(now.getTime() - 1.2 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
        { event: "Escrow released", timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
        { event: "Transaction complete", timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: "completed" },
      ],
    };
  };

  const generateTimeline = (data: any): { event: string; timestamp: string; status: "completed" | "pending" | "current" }[] => {
    const timeline: { event: string; timestamp: string; status: "completed" | "pending" | "current" }[] = [
      { event: "Transaction initiated", timestamp: data.created_at, status: "completed" },
    ];

    if (data.escrow_funded_at) {
      timeline.push({ event: "Escrow funded", timestamp: data.escrow_funded_at, status: "completed" });
    }

    if (data.status === "completed" && data.completed_at) {
      timeline.push({ event: "Transaction complete", timestamp: data.completed_at, status: "completed" });
    } else if (data.status === "pending") {
      timeline.push({ event: "Awaiting confirmation", timestamp: new Date().toISOString(), status: "current" });
    }

    return timeline;
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "XRP") {
      return `${amount.toLocaleString()} XRP`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const maskAddress = (address?: string) => {
    if (!address) return "—";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-lg font-semibold tracking-tight">
              Sign in required
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <Button
              className="w-full rounded-full bg-amber-500 text-black"
              onClick={() => navigate("/auth")}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
              <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
            </div>
            <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/95">
              <CardContent className="p-6 space-y-4">
                <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Transaction not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This transaction doesn't exist or you don't have access.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => navigate("/activity")}
            >
              Back to Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[transaction.status];
  const isIncoming = transaction.type === "sale" || transaction.type === "escrow_released" || transaction.type === "broker_payout";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-white/10 bg-black/40"
              onClick={() => navigate("/activity")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-amber-300/80">
                Transaction
              </p>
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                {transaction.title}
              </h1>
            </div>
          </div>
          <Badge className={`${config.color} px-3 py-1`}>
            <span className="mr-1.5">{config.icon}</span>
            {config.label}
          </Badge>
        </div>

        {/* Main Amount Card */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${isIncoming ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                {isIncoming ? (
                  <ArrowDownLeft className="h-6 w-6 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="h-6 w-6 text-red-400" />
                )}
              </div>
              <p className={`mt-4 text-3xl font-bold sm:text-4xl ${isIncoming ? "text-emerald-400" : "text-red-400"}`}>
                {isIncoming ? "+" : "-"}{formatCurrency(transaction.amount, transaction.currency)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground capitalize">
                {transaction.type.replace("_", " ")}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatDate(transaction.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Transaction ID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Transaction ID
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs">{transaction.id.slice(0, 12)}...</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(transaction.id, "Transaction ID")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* On-chain hash */}
            {transaction.tx_hash && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  On-chain TX
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs">{transaction.tx_hash.slice(0, 12)}...</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.open(`https://xrpscan.com/tx/${transaction.tx_hash}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Parties */}
            {transaction.buyer && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Buyer
                </div>
                <div className="text-right">
                  <p className="text-sm">{transaction.buyer.display_name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">
                    {maskAddress(transaction.buyer.wallet_address)}
                  </p>
                </div>
              </div>
            )}

            {transaction.seller && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Seller
                </div>
                <div className="text-right">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-amber-400 hover:text-amber-300"
                    onClick={() => navigate(`/u/${transaction.seller?.display_name || transaction.seller?.id}`)}
                  >
                    {transaction.seller.display_name || "View Seller"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {maskAddress(transaction.seller.wallet_address)}
                  </p>
                </div>
              </div>
            )}

            {/* Asset */}
            {transaction.asset && (
              <>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Asset
                  </div>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-amber-400"
                    onClick={() => navigate(`/asset/${transaction.asset?.id}`)}
                  >
                    {transaction.asset.title}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Escrow Timeline */}
        {transaction.timeline && transaction.timeline.length > 0 && (
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm font-semibold">Escrow Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative space-y-0">
                {transaction.timeline.map((event, index) => (
                  <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Connector line */}
                    {index < transaction.timeline!.length - 1 && (
                      <div className="absolute left-[11px] top-6 h-full w-0.5 bg-white/10" />
                    )}

                    {/* Status dot */}
                    <div
                      className={`relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center ${
                        event.status === "completed"
                          ? "border-emerald-500 bg-emerald-500/20"
                          : event.status === "current"
                          ? "border-amber-500 bg-amber-500/20"
                          : "border-white/20 bg-white/5"
                      }`}
                    >
                      {event.status === "completed" && (
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      )}
                      {event.status === "current" && (
                        <Clock className="h-3 w-3 text-amber-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${event.status === "pending" ? "text-muted-foreground" : ""}`}>
                        {event.event}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {transaction.escrow?.condition && (
                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs text-emerald-300">
                    <CheckCircle className="mr-1.5 inline h-3 w-3" />
                    {transaction.escrow.condition}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fees Breakdown */}
        {transaction.fees && (
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Fees Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform fee (2.5%)</span>
                <span>{formatCurrency(transaction.fees.platform_fee, transaction.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Escrow fee (1%)</span>
                <span>{formatCurrency(transaction.fees.escrow_fee, transaction.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network fee</span>
                <span>{formatCurrency(transaction.fees.network_fee, transaction.currency)}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Total fees</span>
                <span>{formatCurrency(transaction.fees.total_fees, transaction.currency)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Explanation */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  What this means
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {transaction.status === "completed" && (
                    <>This transaction has been fully processed. Funds have been transferred and the asset ownership has been updated on the blockchain.</>
                  )}
                  {transaction.status === "pending" && (
                    <>This transaction is awaiting confirmation. Once all parties confirm, funds will be released from escrow.</>
                  )}
                  {transaction.status === "processing" && (
                    <>This transaction is being processed on the XRPL network. This typically takes a few seconds.</>
                  )}
                  {transaction.status === "failed" && (
                    <>This transaction could not be completed. Any escrowed funds have been returned to the original party.</>
                  )}
                  {transaction.status === "cancelled" && (
                    <>This transaction was cancelled before completion. No funds were transferred.</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/activity")}
          >
            Back to Activity
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/help")}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Get Help
          </Button>
        </div>
      </div>
    </div>
  );
}
