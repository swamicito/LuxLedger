import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { getUserRoles, getRoleFlags, getStatusColor, getStatusLabel, type RoleInfo } from "@/lib/roles";
import {
  User,
  Wallet,
  ShoppingBag,
  Store,
  Handshake,
  Shield,
  CheckCircle,
  Lock,
  Clock,
  Sparkles,
  ChevronRight,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Store,
  Handshake,
  Shield,
};

export default function Account() {
  const navigate = useNavigate();
  const { user, userProfile, userRole } = useAuth();
  const { account, connectWallet } = useWallet();

  const roles = getUserRoles(userProfile, userRole, account?.address || null);
  const flags = getRoleFlags(userProfile, userRole, account?.address || null);

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast.success("Copied to clipboard");
    }
  };

  const handleRoleCTA = (role: RoleInfo) => {
    if (role.type === 'buyer' && !flags.hasWallet) {
      connectWallet();
      return;
    }
    if (role.ctaHref) {
      navigate(role.ctaHref);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'eligible':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5" />;
      case 'locked':
        return <Lock className="h-3.5 w-3.5" />;
      case 'invite_only':
        return <Shield className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const visibleRoles = Object.values(roles).filter(
    (role) => role.type !== 'admin' || flags.isAdmin
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Page Header */}
        <div className="space-y-1">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-amber-300/80">
            Account Overview
          </p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Your LuxLedger Account
          </h1>
          <p className="text-sm text-muted-foreground">
            One account. Multiple roles. Your wallet is your signature.
          </p>
        </div>

        {/* Identity Card */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* User Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-amber-500/30">
                  <AvatarFallback className="bg-amber-500/10 text-amber-300 text-xl">
                    {user?.email?.charAt(0).toUpperCase() || userProfile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    {userProfile?.display_name || userProfile?.full_name || user?.email?.split('@')[0] || 'Anonymous'}
                  </h2>
                  {user?.email && (
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {flags.isVerified && (
                      <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[0.6rem]">
                        <CheckCircle className="mr-1 h-2.5 w-2.5" />
                        Verified
                      </Badge>
                    )}
                    {flags.isBroker && (
                      <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[0.6rem]">
                        <Handshake className="mr-1 h-2.5 w-2.5" />
                        Broker
                      </Badge>
                    )}
                    {flags.isAdmin && (
                      <Badge className="border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[0.6rem]">
                        <Shield className="mr-1 h-2.5 w-2.5" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet Status */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  XRPL Wallet
                </div>
                {account?.address ? (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-sm font-mono">
                      {account.address.slice(0, 8)}...{account.address.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCopyAddress}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(`https://xrpscan.com/account/${account.address}`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => connectWallet()}
                  >
                    <Wallet className="mr-2 h-3 w-3" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {user && (
              <>
                <Separator className="my-6 bg-white/10" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold">{userProfile?.listings_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Listings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">{userProfile?.sales_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">{userProfile?.purchases_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Purchases</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold">{userProfile?.referrals_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Roles Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Your Roles</h2>
              <p className="text-xs text-muted-foreground">
                Enable roles to unlock platform features
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {visibleRoles.map((role) => {
              const IconComponent = iconMap[role.icon] || User;
              const isActive = role.status === 'active';
              const canEnable = role.status === 'eligible' || role.status === 'active';

              return (
                <Card
                  key={role.type}
                  className={`group relative overflow-hidden border transition-all duration-300 ${
                    isActive
                      ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-neutral-950/95 to-neutral-900/95'
                      : 'border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95 hover:border-white/20'
                  }`}
                >
                  {/* Glow effect for active roles */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                          isActive ? 'bg-amber-500/20' : 'bg-white/5'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${isActive ? 'text-amber-300' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{role.label}</CardTitle>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-[0.6rem] ${getStatusColor(role.status)}`}
                          >
                            {getStatusIcon(role.status)}
                            <span className="ml-1">{getStatusLabel(role.status)}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2 text-xs leading-relaxed">
                      {role.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Benefits */}
                    <div className="space-y-1.5">
                      {role.benefits.slice(0, 3).map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className={`h-3 w-3 shrink-0 ${isActive ? 'text-emerald-400' : 'text-muted-foreground/50'}`} />
                          {benefit}
                        </div>
                      ))}
                    </div>

                    {/* Requirements */}
                    {role.status !== 'active' && role.requirements.length > 0 && (
                      <div className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3">
                        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                          Requirements
                        </p>
                        {role.requirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            {req.includes('✓') ? (
                              <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />
                            ) : (
                              <AlertCircle className="h-3 w-3 shrink-0 text-amber-400" />
                            )}
                            {req}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    {role.ctaLabel && (
                      <Button
                        className={`mt-4 w-full text-xs transition-all duration-200 ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                            : canEnable
                              ? 'bg-amber-500 text-black hover:bg-amber-400'
                              : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                        }`}
                        onClick={() => handleRoleCTA(role)}
                      >
                        {role.ctaLabel}
                        <ChevronRight className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="border border-white/10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-neutral-900/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                className="justify-start text-xs"
                onClick={() => navigate("/settings")}
              >
                <User className="mr-2 h-3.5 w-3.5" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="justify-start text-xs"
                onClick={() => navigate("/activity")}
              >
                <Clock className="mr-2 h-3.5 w-3.5" />
                View Activity
              </Button>
              <Button
                variant="outline"
                className="justify-start text-xs"
                onClick={() => navigate("/help")}
              >
                <AlertCircle className="mr-2 h-3.5 w-3.5" />
                Get Help
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Microcopy */}
        <p className="text-center text-[0.65rem] text-muted-foreground/70">
          Your account is secured by your XRPL wallet. All transactions are protected by blockchain escrow.
        </p>
      </div>
    </div>
  );
}
