import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { DEFAULT_LIMIT } from "@/hooks/use-pagination";
import { LoadingMoreIndicator, EndOfListIndicator } from "@/components/ui/skeleton-loaders";
import {
  Package,
  ChevronLeft,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  ExternalLink,
  ImageIcon,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Video,
} from "lucide-react";
import { VideoVerificationBadge } from "@/components/listing";
import { isVideoRequired } from "@/lib/video-verification";

type ListingStatus = "pending_review" | "under_review" | "approved" | "live" | "rejected" | "archived";

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_value: number;
  images: string[];
  status: ListingStatus;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  views?: number;
  inquiries?: number;
  has_video?: boolean;
  video_url?: string;
}

const statusConfig: Record<ListingStatus, { label: string; color: string; icon: React.ReactNode; progress: number }> = {
  pending_review: {
    label: "Submitted",
    color: "border-slate-500/40 bg-slate-500/10 text-slate-300",
    icon: <Clock className="h-3.5 w-3.5" />,
    progress: 20,
  },
  under_review: {
    label: "Under Review",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    icon: <Eye className="h-3.5 w-3.5" />,
    progress: 50,
  },
  approved: {
    label: "Approved",
    color: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    progress: 80,
  },
  live: {
    label: "Live",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    progress: 100,
  },
  rejected: {
    label: "Rejected",
    color: "border-red-500/40 bg-red-500/10 text-red-300",
    icon: <XCircle className="h-3.5 w-3.5" />,
    progress: 0,
  },
  archived: {
    label: "Archived",
    color: "border-white/20 bg-white/5 text-muted-foreground",
    icon: <Package className="h-3.5 w-3.5" />,
    progress: 0,
  },
};

const PAGE_SIZE = DEFAULT_LIMIT;

export default function MyListings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      fetchListings(true);
    }
  }, [user]);

  const fetchListings = useCallback(async (reset = false) => {
    if (!user) return;

    if (reset) {
      setLoading(true);
      setListings([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentCount = reset ? 0 : listings.length;
      const { data, error } = await supabase
        .from("assets")
        .select("id, title, description, category, estimated_value, images, status, created_at, updated_at, rejection_reason, has_video, video_url")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .range(currentCount, currentCount + PAGE_SIZE - 1);

      if (error) throw error;

      const newData = data || [];
      setHasMore(newData.length === PAGE_SIZE);
      
      if (reset) {
        setListings(newData);
      } else {
        setListings(prev => [...prev, ...newData]);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, listings.length]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchListings(false);
    }
  }, [loadingMore, hasMore, fetchListings]);

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("assets")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("owner_id", user?.id);

      if (error) throw error;

      toast.success("Archived. You can restore this anytime.");
      fetchListings();
    } catch (error) {
      console.error("Error archiving listing:", error);
      toast.error("Failed to archive listing");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", id)
        .eq("owner_id", user?.id);

      if (error) throw error;

      toast.success("Listing removed permanently.");
      fetchListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFilteredListings = () => {
    if (activeTab === "all") return listings;
    if (activeTab === "active") return listings.filter((l) => ["pending_review", "under_review", "approved", "live"].includes(l.status));
    if (activeTab === "live") return listings.filter((l) => l.status === "live");
    if (activeTab === "review") return listings.filter((l) => ["pending_review", "under_review"].includes(l.status));
    if (activeTab === "rejected") return listings.filter((l) => l.status === "rejected");
    return listings;
  };

  const filteredListings = getFilteredListings();

  // Stats
  const stats = {
    total: listings.length,
    live: listings.filter((l) => l.status === "live").length,
    inReview: listings.filter((l) => ["pending_review", "under_review"].includes(l.status)).length,
    rejected: listings.filter((l) => l.status === "rejected").length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-lg font-semibold tracking-tight">
              Sign in required
            </CardTitle>
            <CardDescription className="text-center text-sm text-muted-foreground">
              Sign in to view and manage your asset listings.
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
                  MY LISTINGS
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Seller Hub · Asset Management
                </p>
              </div>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Total</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Live</p>
                <p className="text-lg font-semibold" style={{ color: '#22C55E' }}>{stats.live}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>In Review</p>
                <p className="text-lg font-semibold" style={{ color: '#FBBF24' }}>{stats.inReview}</p>
              </div>
            </div>
            
            {/* Right: New Listing */}
            <Button
              onClick={() => navigate("/list-asset")}
              size="sm"
              className="font-medium"
              style={{ backgroundColor: '#D4AF37', color: '#0B0B0C' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">{stats.live}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">In Review</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-amber-400">{stats.inReview}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Rejected</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-red-400">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Your Submissions</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => fetchListings(true)}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-5 bg-black/40">
                <TabsTrigger value="all" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200">
                  All
                </TabsTrigger>
                <TabsTrigger value="live" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200">
                  Live
                </TabsTrigger>
                <TabsTrigger value="review" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200">
                  Review
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200">
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200">
                  Active
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-white/5 bg-black/20 p-4">
                    <div className="h-20 w-20 animate-pulse rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="space-y-4">
                {filteredListings.map((listing) => {
                  const config = statusConfig[listing.status];

                  return (
                    <div
                      key={listing.id}
                      className="group rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:border-white/10 hover:bg-black/30"
                    >
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                          {listing.images && listing.images.length > 1 && (
                            <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] text-white">
                              +{listing.images.length - 1}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="truncate text-sm font-semibold">{listing.title}</h3>
                              <p className="text-xs capitalize text-muted-foreground">
                                {listing.category?.replace("_", " ")} • {formatCurrency(listing.estimated_value)}
                              </p>
                              {/* Video Verification Badge */}
                              <div className="mt-1">
                                <VideoVerificationBadge
                                  hasVideo={Boolean(listing.has_video || listing.video_url)}
                                  required={isVideoRequired(listing.estimated_value)}
                                  compact
                                />
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border border-white/10 bg-neutral-950">
                                <DropdownMenuItem onClick={() => navigate(`/asset/${listing.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {listing.status === "live" && (
                                  <DropdownMenuItem onClick={() => window.open(`/asset/${listing.id}`, "_blank")}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View on Marketplace
                                  </DropdownMenuItem>
                                )}
                                {["pending_review", "rejected"].includes(listing.status) && (
                                  <DropdownMenuItem onClick={() => navigate(`/list-asset?edit=${listing.id}`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Listing
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-white/10" />
                                {listing.status !== "archived" && (
                                  <DropdownMenuItem onClick={() => handleArchive(listing.id)}>
                                    <Package className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDelete(listing.id)}
                                  className="text-red-400 focus:text-red-300"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Status */}
                          <div className="mt-3 flex items-center gap-3">
                            <Badge className={`text-[0.6rem] ${config.color}`}>
                              <span className="mr-1">{config.icon}</span>
                              {config.label}
                            </Badge>
                            <span className="text-[0.65rem] text-muted-foreground">
                              Submitted {formatDate(listing.created_at)}
                            </span>
                          </div>

                          {/* Progress bar for non-rejected/archived */}
                          {!["rejected", "archived"].includes(listing.status) && (
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-[0.65rem]">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-amber-300">{config.progress}%</span>
                              </div>
                              <Progress value={config.progress} className="h-1.5 bg-white/10" />
                            </div>
                          )}

                          {/* Rejection reason */}
                          {listing.status === "rejected" && listing.rejection_reason && (
                            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                              <p className="text-[0.7rem] text-red-300">
                                <AlertCircle className="mr-1 inline h-3 w-3" />
                                {listing.rejection_reason}
                              </p>
                              <p className="mt-2 text-[0.65rem] text-muted-foreground/80">
                                What happens next: Make the requested changes and resubmit for review.
                              </p>
                              <Button
                                variant="link"
                                size="sm"
                                className="mt-1.5 h-auto p-0 text-[0.7rem] text-amber-400 hover:text-amber-300"
                                onClick={() => navigate(`/list-asset?edit=${listing.id}`)}
                              >
                                Edit and resubmit
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {/* Live stats */}
                          {listing.status === "live" && (
                            <div className="mt-3 flex items-center gap-4 text-[0.7rem] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {listing.views || 0} views
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {listing.inquiries || 0} inquiries
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {/* Load More / End of List */}
              {loadingMore ? (
                <LoadingMoreIndicator />
              ) : hasMore && filteredListings.length >= PAGE_SIZE ? (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    Load More
                  </Button>
                </div>
              ) : filteredListings.length > 0 ? (
                <EndOfListIndicator />
              ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">
                  {activeTab === "all" ? "Ready when you are" : `No ${activeTab} listings`}
                </h3>
                <p className="mt-2 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                  {activeTab === "all"
                    ? "List your first luxury asset and our verification team will review it within 2-5 business days."
                    : "You don't have any listings in this category yet. Check back as your submissions progress."}
                </p>
                {activeTab === "all" ? (
                  <>
                    <p className="mt-4 text-[0.65rem] text-muted-foreground/70">
                      What happens next: Submit photos and details → We verify → You go live.
                    </p>
                    <Button
                      onClick={() => navigate("/list-asset")}
                      className="mt-6 rounded-full bg-amber-500 text-black shadow-[0_14px_40px_rgba(0,0,0,0.7)] hover:bg-amber-400"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Listing
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-xs text-amber-400"
                    onClick={() => setActiveTab("all")}
                  >
                    View all listings
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">How Listing Works</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-500/10 text-slate-400">
                  <span className="text-xs font-semibold">1</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Submit</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Upload photos and details about your asset.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                  <span className="text-xs font-semibold">2</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Review</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Our team verifies authenticity and value.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                  <span className="text-xs font-semibold">3</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Approve</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Once approved, we prepare your listing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <span className="text-xs font-semibold">4</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Go Live</p>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Your asset is listed on the marketplace.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
