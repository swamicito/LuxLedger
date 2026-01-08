import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import {
  Activity as ActivityIcon,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Download,
  ExternalLink,
  Wallet,
  ShieldCheck,
  CreditCard,
  Receipt,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { TransactionListSkeleton } from "@/components/ui/skeleton-loaders";

type TransactionType = "all" | "purchase" | "sale" | "escrow" | "subscription" | "payout";
type TransactionStatus = "completed" | "pending" | "failed" | "cancelled";

interface Transaction {
  id: string;
  type: "purchase" | "sale" | "escrow_created" | "escrow_released" | "escrow_refunded" | "subscription" | "broker_payout";
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  created_at: string;
  tx_hash?: string;
  asset_id?: string;
  counterparty?: string;
}

export default function Activity() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<TransactionType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState("all");

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filterType, timeframe]);

  const fetchTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch transactions from multiple sources
      const [txResult, escrowResult, subscriptionResult] = await Promise.all([
        supabase
          .from("transactions")
          .select("*, assets(title, images)")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("escrow_transactions")
          .select("*")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      // Normalize and combine transactions
      const normalizedTx: Transaction[] = [];

      // Process regular transactions
      if (txResult.data) {
        txResult.data.forEach((tx: any) => {
          normalizedTx.push({
            id: tx.id,
            type: tx.buyer_id === user.id ? "purchase" : "sale",
            title: tx.assets?.title || "Asset Transaction",
            description: tx.buyer_id === user.id ? "Purchased asset" : "Sold asset",
            amount: tx.price || tx.amount || 0,
            currency: tx.currency || "USD",
            status: tx.status as TransactionStatus,
            created_at: tx.created_at,
            tx_hash: tx.tx_hash,
            asset_id: tx.asset_id,
            counterparty: tx.buyer_id === user.id ? tx.seller_id : tx.buyer_id,
          });
        });
      }

      // Process escrow transactions
      if (escrowResult.data) {
        escrowResult.data.forEach((escrow: any) => {
          const escrowType = escrow.status === "released"
            ? "escrow_released"
            : escrow.status === "refunded"
            ? "escrow_refunded"
            : "escrow_created";

          normalizedTx.push({
            id: escrow.id,
            type: escrowType,
            title: `Escrow ${escrow.status === "released" ? "Released" : escrow.status === "refunded" ? "Refunded" : "Created"}`,
            description: `Escrow transaction for asset`,
            amount: escrow.amount || 0,
            currency: escrow.currency || "XRP",
            status: escrow.status === "active" ? "pending" : escrow.status === "released" ? "completed" : escrow.status as TransactionStatus,
            created_at: escrow.created_at,
            tx_hash: escrow.escrow_id,
          });
        });
      }

      // Process subscriptions
      if (subscriptionResult.data) {
        subscriptionResult.data.forEach((sub: any) => {
          normalizedTx.push({
            id: sub.id,
            type: "subscription",
            title: `${sub.plan_name || "Premium"} Subscription`,
            description: sub.status === "active" ? "Subscription payment" : "Subscription ended",
            amount: sub.amount || 0,
            currency: "USD",
            status: sub.status === "active" ? "completed" : "cancelled",
            created_at: sub.created_at,
          });
        });
      }

      // Sort by date
      normalizedTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply filters
      let filtered = normalizedTx;

      if (filterType !== "all") {
        filtered = filtered.filter((tx) => {
          if (filterType === "escrow") {
            return tx.type.startsWith("escrow");
          }
          return tx.type === filterType;
        });
      }

      if (timeframe !== "all") {
        const now = new Date();
        const cutoff = new Date();
        if (timeframe === "7d") cutoff.setDate(now.getDate() - 7);
        if (timeframe === "30d") cutoff.setDate(now.getDate() - 30);
        if (timeframe === "90d") cutoff.setDate(now.getDate() - 90);
        filtered = filtered.filter((tx) => new Date(tx.created_at) >= cutoff);
      }

      setTransactions(filtered);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "purchase":
        return <ArrowDownLeft className="h-4 w-4" />;
      case "sale":
        return <ArrowUpRight className="h-4 w-4" />;
      case "escrow_created":
        return <ShieldCheck className="h-4 w-4" />;
      case "escrow_released":
        return <CheckCircle className="h-4 w-4" />;
      case "escrow_refunded":
        return <RefreshCw className="h-4 w-4" />;
      case "subscription":
        return <CreditCard className="h-4 w-4" />;
      case "broker_payout":
        return <Receipt className="h-4 w-4" />;
      default:
        return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Transaction["type"]) => {
    switch (type) {
      case "purchase":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "sale":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "escrow_created":
      case "escrow_released":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "escrow_refunded":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "subscription":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "broker_payout":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-white/5 text-muted-foreground border-white/10";
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
      case "pending":
        return <Clock className="h-3.5 w-3.5 text-amber-400" />;
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-red-400" />;
      case "cancelled":
        return <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
      case "pending":
        return "border-amber-500/40 bg-amber-500/10 text-amber-300";
      case "failed":
        return "border-red-500/40 bg-red-500/10 text-red-300";
      case "cancelled":
        return "border-white/20 bg-white/5 text-muted-foreground";
      default:
        return "";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "XRP") {
      return `${amount.toLocaleString()} XRP`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary stats
  const totalInflow = transactions
    .filter((tx) => tx.type === "sale" || tx.type === "escrow_released" || tx.type === "broker_payout")
    .filter((tx) => tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalOutflow = transactions
    .filter((tx) => tx.type === "purchase" || tx.type === "subscription")
    .filter((tx) => tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingCount = transactions.filter((tx) => tx.status === "pending").length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-lg font-semibold tracking-tight">
              Sign in required
            </CardTitle>
            <CardDescription className="text-center text-sm text-muted-foreground">
              Sign in to view your transaction history and activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            <Button
              className="w-full rounded-full bg-amber-500 text-black shadow-[0_18px_45px_rgba(0,0,0,0.7)] hover:bg-amber-400"
              onClick={() => navigate("/auth")}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                  ACTIVITY
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Transaction history · Ledger
                </p>
              </div>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Inflow</p>
                <p className="text-lg font-semibold" style={{ color: '#22C55E' }}>
                  ${totalInflow.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Outflow</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>
                  ${totalOutflow.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Pending</p>
                <p className="text-lg font-semibold" style={{ color: '#FBBF24' }}>{pendingCount}</p>
              </div>
            </div>
            
            {/* Right: Export */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Total In</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                +{formatCurrency(totalInflow, "USD")}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Total Out</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-red-400">
                -{formatCurrency(totalOutflow, "USD")}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <p className="mt-1 text-lg font-semibold">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="mt-1 text-lg font-semibold">{transactions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as TransactionType)}>
                  <SelectTrigger className="w-[130px] bg-black/40 text-xs">
                    <Filter className="mr-2 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-neutral-950">
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="purchase">Purchases</SelectItem>
                    <SelectItem value="sale">Sales</SelectItem>
                    <SelectItem value="escrow">Escrow</SelectItem>
                    <SelectItem value="subscription">Subscriptions</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-[110px] bg-black/40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-neutral-950">
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={fetchTransactions}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <TransactionListSkeleton count={5} />
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="group flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:border-white/10 hover:bg-black/30"
                  >
                    {/* Icon */}
                    <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${getTypeColor(tx.type)}`}>
                      {getTypeIcon(tx.type)}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{tx.title}</p>
                        {tx.tx_hash && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => window.open(`https://xrpscan.com/tx/${tx.tx_hash}`, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                      <p className="mt-1 text-[0.7rem] text-muted-foreground/70">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>

                    {/* Amount & Status */}
                    <div className="flex flex-col items-end gap-1.5">
                      <p className={`text-sm font-semibold ${
                        tx.type === "sale" || tx.type === "escrow_released" || tx.type === "broker_payout"
                          ? "text-emerald-400"
                          : tx.type === "purchase" || tx.type === "subscription"
                          ? "text-red-400"
                          : ""
                      }`}>
                        {tx.type === "sale" || tx.type === "escrow_released" || tx.type === "broker_payout" ? "+" : "-"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                      <Badge className={`text-[0.6rem] ${getStatusColor(tx.status)}`}>
                        <span className="mr-1">{getStatusIcon(tx.status)}</span>
                        {tx.status}
                      </Badge>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                  <Receipt className="h-6 w-6 text-amber-300" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">
                  {searchQuery || filterType !== "all" ? "No matching transactions" : "No activity yet"}
                </h3>
                <p className="mt-2 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your filters or search to find what you're looking for."
                    : "Your complete transaction history will appear here—purchases, sales, escrow events, and payouts."}
                </p>
                {filterType === "all" && !searchQuery && (
                  <>
                    <p className="mt-4 text-[0.65rem] text-muted-foreground/70">
                      What happens next: Browse the marketplace and make your first move.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 text-xs"
                      onClick={() => navigate("/marketplace")}
                    >
                      Explore Marketplace
                    </Button>
                  </>
                )}
                {(searchQuery || filterType !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-xs text-amber-400"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
