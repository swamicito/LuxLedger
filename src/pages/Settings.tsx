import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import {
  User,
  Wallet,
  Bell,
  Shield,
  ChevronLeft,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Mail,
  Key,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  RefreshCw,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { account, connectWallet, disconnectWallet, refreshAccountData } = useWallet();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState(userProfile?.full_name || "");
  const [displayName, setDisplayName] = useState(userProfile?.display_name || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [escrowAlerts, setEscrowAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [listingUpdates, setListingUpdates] = useState(true);

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-center text-lg font-semibold tracking-tight">
              Sign in required
            </CardTitle>
            <CardDescription className="text-center text-sm text-muted-foreground">
              You need to be signed in to access your account settings.
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

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: fullName,
          display_name: displayName,
          phone,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("You're all set. Profile changes saved.");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast.success("Copied to clipboard");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
                  ACCOUNT SETTINGS
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Profile · Wallet · Notifications · Security
                </p>
              </div>
            </div>
            
            {/* Right: User Info */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: '#F5F5F7' }}>{userProfile?.full_name || user?.email}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{user?.email}</p>
              </div>
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs">
                  {getInitials(userProfile?.full_name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">

        {/* Main Settings Card */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <Tabs defaultValue="profile" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-4 bg-black/40">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
                >
                  <User className="mr-2 h-4 w-4 hidden sm:inline" />
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="wallet"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
                >
                  <Wallet className="mr-2 h-4 w-4 hidden sm:inline" />
                  Wallet
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
                >
                  <Bell className="mr-2 h-4 w-4 hidden sm:inline" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-200"
                >
                  <Shield className="mr-2 h-4 w-4 hidden sm:inline" />
                  Security
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* ─────────────────────────────────────────────────────────────
                  PROFILE TAB
              ───────────────────────────────────────────────────────────── */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-20 w-20 border-2 border-amber-500/30">
                      <AvatarImage src={userProfile?.avatar_url} />
                      <AvatarFallback className="bg-amber-500/10 text-amber-300 text-lg">
                        {getInitials(fullName || user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="text-xs">
                      Change photo
                    </Button>
                  </div>

                  {/* Profile fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-xs uppercase tracking-[0.18em]">
                          Full name
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="bg-black/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-xs uppercase tracking-[0.18em]">
                          Display name
                        </Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="johndoe"
                          className="bg-black/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em]">
                          Email
                        </Label>
                        <div className="relative">
                          <Input
                            id="email"
                            value={user.email || ""}
                            disabled
                            className="bg-black/40 pr-10"
                          />
                          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <p className="text-[0.7rem] text-muted-foreground">
                          Contact support to change your email address.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs uppercase tracking-[0.18em]">
                          Phone (optional)
                        </Label>
                        <div className="relative">
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="bg-black/40 pr-10"
                          />
                          <Smartphone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="rounded-full bg-amber-500 text-black shadow-[0_14px_40px_rgba(0,0,0,0.7)] hover:bg-amber-400"
                  >
                    {isUpdating ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </TabsContent>

              {/* ─────────────────────────────────────────────────────────────
                  WALLET TAB
              ───────────────────────────────────────────────────────────── */}
              <TabsContent value="wallet" className="mt-0 space-y-6">
                {account ? (
                  <>
                    {/* Connected wallet card */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                              Connected
                            </p>
                            <p className="mt-0.5 text-sm font-medium">
                              {account.network === "mainnet" ? "XRPL Mainnet" : "XRPL Testnet"}
                            </p>
                          </div>
                        </div>
                        <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                          {account.balance || "—"}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          Wallet address
                        </Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
                            {account.address}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={handleCopyAddress}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => window.open(`https://xrpscan.com/account/${account.address}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshAccountData()}
                          className="text-xs"
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Refresh balance
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={disconnectWallet}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>

                    {/* Trustlines */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs uppercase tracking-[0.18em]">Trustlines</Label>
                        <Badge variant="outline" className="text-[0.65rem]">
                          {account.trustlines?.length || 0} active
                        </Badge>
                      </div>
                      {account.trustlines && account.trustlines.length > 0 ? (
                        <div className="space-y-2">
                          {account.trustlines.slice(0, 5).map((tl: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                            >
                              <span className="font-medium">{tl.currency}</span>
                              <span className="text-muted-foreground">{tl.balance}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No trustlines configured yet.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No wallet connected</h3>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                      Connect your XRPL wallet to manage assets, sign transactions, and access premium features.
                    </p>
                    <Button
                      onClick={connectWallet}
                      className="mt-6 rounded-full bg-amber-500 text-black shadow-[0_14px_40px_rgba(0,0,0,0.7)] hover:bg-amber-400"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ─────────────────────────────────────────────────────────────
                  NOTIFICATIONS TAB
              ───────────────────────────────────────────────────────────── */}
              <TabsContent value="notifications" className="mt-0 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Notification preferences</h3>
                  <p className="text-xs text-muted-foreground">
                    Choose how and when you want to be notified.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* General */}
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground text-left">
                      General
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Email notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive updates via email
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Push notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Browser and mobile push alerts
                        </p>
                      </div>
                      <Switch
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Marketing emails</Label>
                        <p className="text-xs text-muted-foreground">
                          News, promotions, and product updates
                        </p>
                      </div>
                      <Switch
                        checked={marketingEmails}
                        onCheckedChange={setMarketingEmails}
                      />
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground text-left">
                      Transactions & Escrow
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Escrow alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Status changes, releases, and disputes
                        </p>
                      </div>
                      <Switch checked={escrowAlerts} onCheckedChange={setEscrowAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Price alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify when watched assets change price
                        </p>
                      </div>
                      <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Listing updates</Label>
                        <p className="text-xs text-muted-foreground">
                          When your submissions are approved or rejected
                        </p>
                      </div>
                      <Switch checked={listingUpdates} onCheckedChange={setListingUpdates} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="rounded-full bg-amber-500 text-black shadow-[0_14px_40px_rgba(0,0,0,0.7)] hover:bg-amber-400"
                    onClick={() => toast.success("Preferences updated. You're in control.")}
                  >
                    Save preferences
                  </Button>
                </div>
              </TabsContent>

              {/* ─────────────────────────────────────────────────────────────
                  SECURITY TAB
              ───────────────────────────────────────────────────────────── */}
              <TabsContent value="security" className="mt-0 space-y-6">
                {/* Password */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Change password</h3>
                    <p className="text-xs text-muted-foreground">
                      Update your password to keep your account secure.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-xs uppercase tracking-[0.18em]">
                        Current password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-black/40 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs uppercase tracking-[0.18em]">
                        New password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-black/40 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="text-xs">
                    <Key className="mr-2 h-3 w-3" />
                    Update password
                  </Button>
                </div>

                <Separator className="bg-white/10" />

                {/* 2FA */}
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Two-factor authentication</h3>
                        {twoFactorEnabled ? (
                          <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[0.6rem]">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[0.6rem]">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add an extra layer of security to your account using an authenticator app.
                      </p>
                    </div>
                    <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Sessions */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Active sessions</h3>
                    <p className="text-xs text-muted-foreground">
                      Manage devices where you're currently signed in.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Current session</p>
                          <p className="text-xs text-muted-foreground">
                            {navigator.userAgent.includes("Mac") ? "macOS" : "Windows"} • {navigator.userAgent.includes("Chrome") ? "Chrome" : "Browser"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[0.6rem] text-emerald-400">
                        Active now
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Danger zone */}
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-red-300">Danger zone</h3>
                    <p className="text-xs text-red-200/70">
                      Irreversible actions that affect your account.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-3 w-3" />
                      Sign out
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete account
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
