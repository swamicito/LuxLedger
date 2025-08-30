import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  DollarSign, 
  FileText, 
  Shield,
  Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'transaction' | 'asset' | 'kyc' | 'system';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mock notifications - in real app, fetch from database
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          id: "1",
          title: "KYC Verification Approved",
          message: "Your identity verification has been approved. You can now access all platform features.",
          type: "success" as const,
          category: "kyc" as const,
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Asset Tokenization Complete",
          message: "Your luxury watch has been successfully tokenized and is ready for listing.",
          type: "success" as const,
          category: "asset" as const,
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "3",
          title: "Transaction Confirmed",
          message: "Your purchase of Real Estate Token #001 has been confirmed on the blockchain.",
          type: "info" as const,
          category: "transaction" as const,
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "4",
          title: "Price Alert",
          message: "The asset 'Vintage Ferrari 250 GTO' has reached your target price of $45M.",
          type: "warning" as const,
          category: "asset" as const,
          read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ] as Notification[];
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // In real app, update notification in database
      console.log("Marking notification as read:", notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // In real app, delete notification from database
      console.log("Deleting notification:", notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
  });

  const getNotificationIcon = (type: string, category: string) => {
    if (category === "transaction") return DollarSign;
    if (category === "asset") return FileText;
    if (category === "kyc") return Shield;
    
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertCircle;
      case "error":
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[600px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} unread
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          <div className="p-6 pt-0 space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type, notification.category);
                
                return (
                  <div key={notification.id}>
                    <div 
                      className={cn(
                        "group flex gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                        !notification.read && "bg-blue-50/50"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsReadMutation.mutate(notification.id);
                        }
                        if (notification.action_url) {
                          window.open(notification.action_url, '_blank');
                        }
                      }}
                    >
                      <div className={cn("mt-0.5", getNotificationColor(notification.type))}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-2" />}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Mark all as read
                notifications
                  .filter(n => !n.read)
                  .forEach(n => markAsReadMutation.mutate(n.id));
              }}
            >
              Mark All as Read
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function NotificationsPage() {
  const { user } = useAuth();
  
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      // In real app, fetch from database with pagination
      return [] as Notification[];
    },
    enabled: !!user,
  });

  const getNotificationIcon = (type: string, category: string) => {
    if (category === "transaction") return DollarSign;
    if (category === "asset") return FileText;
    if (category === "kyc") return Shield;
    
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertCircle;
      case "error":
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="outline" size="sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type, notification.category);
            
            return (
              <Card key={notification.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className={cn("mt-1", getNotificationColor(notification.type))}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">{notification.title}</h3>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline">{notification.category}</Badge>
                        <Badge variant="outline">{notification.type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}