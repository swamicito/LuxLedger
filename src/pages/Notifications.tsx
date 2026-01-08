import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import {
  Bell,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Package,
  MessageSquare,
  AlertTriangle,
  Trash2,
  CheckCheck,
  Filter,
  RefreshCw,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { NotificationListSkeleton } from "@/components/ui/skeleton-loaders";

type NotificationType =
  | "asset_approved"
  | "asset_rejected"
  | "escrow_created"
  | "escrow_funded"
  | "escrow_released"
  | "escrow_refunded"
  | "escrow_dispute"
  | "price_alert"
  | "trade_confirmed"
  | "broker_payout"
  | "broker_message"
  | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  metadata?: {
    asset_id?: string;
    escrow_id?: string;
    transaction_id?: string;
    amount?: number;
    currency?: string;
  };
}

const notificationConfig: Record<
  NotificationType,
  { icon: React.ReactNode; color: string; category: string }
> = {
  asset_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    category: "assets",
  },
  asset_rejected: {
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    category: "assets",
  },
  escrow_created: {
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    category: "escrow",
  },
  escrow_funded: {
    icon: <DollarSign className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    category: "escrow",
  },
  escrow_released: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    category: "escrow",
  },
  escrow_refunded: {
    icon: <RefreshCw className="h-4 w-4" />,
    color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    category: "escrow",
  },
  escrow_dispute: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    category: "escrow",
  },
  price_alert: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    category: "alerts",
  },
  trade_confirmed: {
    icon: <CheckCheck className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    category: "trades",
  },
  broker_payout: {
    icon: <DollarSign className="h-4 w-4" />,
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    category: "broker",
  },
  broker_message: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    category: "broker",
  },
  system: {
    icon: <Bell className="h-4 w-4" />,
    color: "bg-white/5 text-muted-foreground border-white/10",
    category: "system",
  },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch from notifications table
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        // If table doesn't exist, use mock data for demo
        console.log("Using demo notifications");
        setNotifications(getMockNotifications());
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => {
    const now = new Date();
    return [
      {
        id: "1",
        type: "asset_approved",
        title: "Asset Approved",
        message: "Your Vintage Rolex Submariner has been approved and is now live on the marketplace.",
        read: false,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        link: "/my-listings",
        metadata: { asset_id: "asset-1" },
      },
      {
        id: "2",
        type: "escrow_funded",
        title: "Escrow Funded",
        message: "Buyer has funded escrow for your 18K Gold Necklace. Awaiting your confirmation.",
        read: false,
        created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        link: "/escrow/dashboard",
        metadata: { escrow_id: "escrow-1", amount: 12500, currency: "USD" },
      },
      {
        id: "3",
        type: "price_alert",
        title: "Price Alert",
        message: "Patek Philippe Nautilus you're watching dropped 8% in the last 24 hours.",
        read: true,
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        link: "/marketplace",
      },
      {
        id: "4",
        type: "escrow_released",
        title: "Escrow Released",
        message: "Funds have been released for your sale of Diamond Tennis Bracelet. $45,000 credited.",
        read: true,
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        link: "/activity",
        metadata: { amount: 45000, currency: "USD" },
      },
      {
        id: "5",
        type: "broker_payout",
        title: "Commission Earned",
        message: "You earned $1,250 commission from a referred sale. Payout processing.",
        read: true,
        created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        link: "/broker",
        metadata: { amount: 1250, currency: "USD" },
      },
      {
        id: "6",
        type: "asset_rejected",
        title: "Asset Needs Revision",
        message: "Your Hermès Birkin submission requires additional documentation. Please resubmit.",
        read: false,
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        link: "/my-listings",
      },
      {
        id: "7",
        type: "trade_confirmed",
        title: "Trade Confirmed",
        message: "Your purchase of Rare Wine Collection has been confirmed. View details.",
        read: true,
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        link: "/portfolio",
      },
      {
        id: "8",
        type: "system",
        title: "Welcome to LuxLedger",
        message: "Complete your profile and KYC verification to unlock all features.",
        read: true,
        created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        link: "/settings",
      },
    ];
  };

  const markAsRead = async (ids: string[]) => {
    try {
      // Update in database
      await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", ids)
        .eq("user_id", user?.id);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
      );
      setSelectedIds(new Set());
      setSelectMode(false);
      toast.success(ids.length === 1 ? "Marked as read" : `${ids.length} marked as read`);
    } catch (error) {
      console.error("Error marking as read:", error);
      // Still update local state for demo
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
      );
      setSelectedIds(new Set());
      setSelectMode(false);
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const deleteNotifications = async (ids: string[]) => {
    try {
      await supabase
        .from("notifications")
        .delete()
        .in("id", ids)
        .eq("user_id", user?.id);

      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
      toast.success(ids.length === 1 ? "Notification removed" : `${ids.length} notifications removed`);
    } catch (error) {
      console.error("Error deleting:", error);
      // Still update local state for demo
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => notificationConfig[n.type]?.category === activeTab);
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-lg font-semibold tracking-tight">
              Sign in required
            </CardTitle>
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
                  NOTIFICATIONS
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Alerts · Updates · Messages
                </p>
              </div>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Unread</p>
                <p className="text-lg font-semibold" style={{ color: unreadCount > 0 ? '#EF4444' : '#F5F5F7' }}>
                  {unreadCount}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Total</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{notifications.length}</p>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/5 text-xs"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-white/5 text-xs"
                onClick={() => setSelectMode(!selectMode)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-black/40">
            <TabsTrigger
              value="all"
              className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
            >
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1.5 h-4 min-w-[16px] rounded-full bg-red-500 px-1 text-[0.6rem] text-white">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="escrow"
              className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
            >
              Escrow
            </TabsTrigger>
            <TabsTrigger
              value="assets"
              className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="broker"
              className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
            >
              Broker
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bulk Actions */}
        {selectMode && selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <span className="text-sm">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => markAsRead(Array.from(selectedIds))}
              >
                <CheckCheck className="mr-2 h-3 w-3" />
                Mark read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() => deleteNotifications(Array.from(selectedIds))}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardContent className="p-0">
            {loading ? (
              <NotificationListSkeleton count={5} />
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredNotifications.map((notification) => {
                  const config = notificationConfig[notification.type];

                  return (
                    <div
                      key={notification.id}
                      className={`group flex items-start gap-4 p-4 transition-colors hover:bg-white/[0.02] ${
                        !notification.read ? "bg-amber-500/[0.03]" : ""
                      }`}
                    >
                      {/* Select checkbox */}
                      {selectMode && (
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => toggleSelect(notification.id)}
                          className="mt-1"
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${config.color}`}
                      >
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          if (!selectMode && notification.link) {
                            if (!notification.read) {
                              markAsRead([notification.id]);
                            }
                            navigate(notification.link);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm ${
                                !notification.read ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                            )}
                          </div>
                          <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.metadata?.amount && (
                          <Badge
                            variant="outline"
                            className="mt-2 text-[0.6rem] border-white/10"
                          >
                            {notification.metadata.currency === "USD" ? "$" : ""}
                            {notification.metadata.amount.toLocaleString()}
                            {notification.metadata.currency === "XRP" ? " XRP" : ""}
                          </Badge>
                        )}
                      </div>

                      {/* Arrow */}
                      {!selectMode && notification.link && (
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                  <Inbox className="h-6 w-6 text-amber-300" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">
                  {activeTab === "unread" ? "You're all caught up" : "No notifications yet"}
                </h3>
                <p className="mt-2 max-w-[280px] text-xs text-muted-foreground leading-relaxed">
                  {activeTab === "unread"
                    ? "Nice work. When something needs your attention, you'll see it here."
                    : "When your assets are approved, escrow updates happen, or you receive a message—it'll show up right here."}
                </p>
                <p className="mt-4 text-[0.65rem] text-muted-foreground/70">
                  {activeTab === "unread" 
                    ? "Check back anytime."
                    : "What happens next: List an asset or make a purchase to get started."}
                </p>
                {activeTab !== "unread" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={() => navigate("/marketplace")}
                  >
                    Explore Marketplace
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer hint */}
        <p className="text-center text-[0.7rem] text-muted-foreground">
          Manage your notification preferences in{" "}
          <Button
            variant="link"
            className="h-auto p-0 text-[0.7rem] text-amber-400"
            onClick={() => navigate("/settings")}
          >
            Settings
          </Button>
        </p>
      </div>
    </div>
  );
}
