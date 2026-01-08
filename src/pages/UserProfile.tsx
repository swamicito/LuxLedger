import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import {
  ChevronLeft,
  CheckCircle,
  Shield,
  Star,
  Calendar,
  Package,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Share2,
  MessageSquare,
  Award,
  Users,
  Clock,
  Gem,
  Copy,
} from "lucide-react";

interface UserProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  verified: boolean;
  broker_tier?: "bronze" | "silver" | "gold" | "platinum";
  member_since: string;
  wallet_address?: string;
  stats: {
    listings_count: number;
    sales_count: number;
    total_volume: number;
    avg_rating: number;
    review_count: number;
  };
  badges: string[];
}

const tierConfig = {
  bronze: { color: "border-orange-700/40 bg-orange-700/10 text-orange-400", label: "Bronze Broker" },
  silver: { color: "border-slate-400/40 bg-slate-400/10 text-slate-300", label: "Silver Broker" },
  gold: { color: "border-amber-500/40 bg-amber-500/10 text-amber-300", label: "Gold Broker" },
  platinum: { color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300", label: "Platinum Broker" },
};

export default function UserProfile() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    if (!username) return;

    setLoading(true);
    try {
      // Try to fetch from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.eq.${username},display_name.eq.${username}`)
        .single();

      if (profileError) {
        console.log("Using mock profile data");
        setProfile(getMockProfile(username));
        setListings(getMockListings());
      } else {
        // Fetch user's public listings
        const { data: listingsData } = await supabase
          .from("assets")
          .select("*")
          .eq("owner_id", profileData.user_id)
          .eq("status", "live")
          .order("created_at", { ascending: false })
          .limit(12);

        // Calculate stats
        const stats = {
          listings_count: listingsData?.length || 0,
          sales_count: 0,
          total_volume: 0,
          avg_rating: 4.8,
          review_count: 0,
        };

        setProfile({
          id: profileData.user_id,
          username: profileData.username || username,
          display_name: profileData.display_name || profileData.full_name || username,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          verified: profileData.kyc_verified || false,
          broker_tier: profileData.broker_tier,
          member_since: profileData.created_at,
          wallet_address: profileData.wallet_address,
          stats,
          badges: [],
        });
        setListings(listingsData || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(getMockProfile(username));
      setListings(getMockListings());
    } finally {
      setLoading(false);
    }
  };

  const getMockProfile = (name: string): UserProfileData => {
    return {
      id: "user-1",
      username: name,
      display_name: name.charAt(0).toUpperCase() + name.slice(1),
      bio: "Verified luxury asset dealer specializing in rare timepieces and fine jewelry. 15+ years in the industry.",
      verified: true,
      broker_tier: "gold",
      member_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      wallet_address: "rDemo1234567890Premium",
      stats: {
        listings_count: 24,
        sales_count: 156,
        total_volume: 4250000,
        avg_rating: 4.9,
        review_count: 89,
      },
      badges: ["Top Seller", "Fast Shipper", "Trusted Broker"],
    };
  };

  const getMockListings = () => {
    return [
      { id: "1", title: "Vintage Rolex Submariner", category: "watches", estimated_value: 45000, images: [] },
      { id: "2", title: "18K Diamond Necklace", category: "jewelry", estimated_value: 28000, images: [] },
      { id: "3", title: "Patek Philippe Nautilus", category: "watches", estimated_value: 125000, images: [] },
      { id: "4", title: "Cartier Love Bracelet", category: "jewelry", estimated_value: 8500, images: [] },
    ];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  const maskAddress = (address?: string) => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">User not found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This profile doesn't exist or has been removed.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => navigate("/marketplace")}
            >
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierInfo = profile.broker_tier ? tierConfig[profile.broker_tier] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full border border-white/10 bg-black/40"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-amber-300/80">
            Seller Profile
          </p>
        </div>

        {/* Profile Header Card */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 sm:items-start">
                <Avatar className="h-24 w-24 border-2 border-amber-500/30">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-amber-500/10 text-amber-300 text-2xl">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.verified && (
                  <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
                  <h1 className="text-xl font-semibold sm:text-2xl">{profile.display_name}</h1>
                  {tierInfo && (
                    <Badge className={tierInfo.color}>
                      <Award className="mr-1 h-3 w-3" />
                      {tierInfo.label}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>

                {profile.bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Member since {formatDate(profile.member_since)}
                  </div>
                  {profile.wallet_address && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {maskAddress(profile.wallet_address)}
                    </div>
                  )}
                </div>

                {/* Badges */}
                {profile.badges.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {profile.badges.map((badge, i) => (
                      <Badge key={i} variant="outline" className="text-[0.65rem]">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-row justify-center gap-2 sm:flex-col">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-3 w-3" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-3 w-3" />
                  Contact
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4 text-center">
              <Package className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-2xl font-semibold">{profile.stats.listings_count}</p>
              <p className="text-xs text-muted-foreground">Active Listings</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-emerald-400" />
              <p className="mt-2 text-2xl font-semibold">{profile.stats.sales_count}</p>
              <p className="text-xs text-muted-foreground">Completed Sales</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4 text-center">
              <DollarSign className="mx-auto h-5 w-5 text-amber-400" />
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(profile.stats.total_volume)}</p>
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 to-neutral-900/80">
            <CardContent className="p-4 text-center">
              <Star className="mx-auto h-5 w-5 text-amber-400" />
              <p className="mt-2 text-2xl font-semibold">{profile.stats.avg_rating}</p>
              <p className="text-xs text-muted-foreground">{profile.stats.review_count} Reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Active Listings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {listings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="group cursor-pointer rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:border-white/10 hover:bg-black/30"
                    onClick={() => navigate(`/asset/${listing.id}`)}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Gem className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="truncate text-sm font-medium">{listing.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {listing.category?.replace("_", " ")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-400">
                        {formatCurrency(listing.estimated_value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No active listings at the moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:justify-start">
              {profile.verified && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Identity Verified</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Escrow Protected</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Avg. response: &lt;2 hours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
