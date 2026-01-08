/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Role Management System for LuxLedger
 * Single source of truth for user roles and permissions
 */

export type RoleType = 'buyer' | 'seller' | 'broker' | 'admin';

export type RoleStatus = 
  | 'active'      // Role is enabled and usable
  | 'eligible'    // User can enable this role
  | 'pending'     // Awaiting verification/approval
  | 'locked'      // Requires verification to unlock
  | 'invite_only'; // Admin/special access only

export interface RoleInfo {
  type: RoleType;
  status: RoleStatus;
  label: string;
  description: string;
  benefits: string[];
  requirements: string[];
  ctaLabel?: string;
  ctaHref?: string;
  icon: string; // Lucide icon name
}

export interface UserRoles {
  buyer: RoleInfo;
  seller: RoleInfo;
  broker: RoleInfo;
  admin: RoleInfo;
}

export interface RoleFlags {
  isBuyer: boolean;
  isSeller: boolean;
  isBroker: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  hasWallet: boolean;
}

/**
 * Get user roles based on profile data and wallet connection
 */
export function getUserRoles(
  userProfile: any | null,
  userRole: string | null,
  walletAddress: string | null
): UserRoles {
  const hasWallet = !!walletAddress;
  const isVerified = userProfile?.kyc_status === 'verified' || userProfile?.is_verified === true;
  const hasSoldAssets = (userProfile?.sales_count || 0) > 0;
  const hasListedAssets = (userProfile?.listings_count || 0) > 0;
  const isBrokerApproved = userProfile?.is_broker === true || userRole === 'broker';
  const isAdminUser = userRole === 'admin' || userProfile?.is_admin === true;

  return {
    buyer: {
      type: 'buyer',
      status: hasWallet ? 'active' : 'eligible',
      label: 'Buyer',
      description: 'Browse, bid, and purchase verified luxury assets.',
      benefits: [
        'Access to verified marketplace',
        'Escrow-protected transactions',
        'Price alerts & watchlists',
        'Direct messaging with sellers',
      ],
      requirements: hasWallet 
        ? ['Wallet connected ✓']
        : ['Connect your XRPL wallet'],
      ctaLabel: hasWallet ? undefined : 'Connect Wallet',
      ctaHref: hasWallet ? undefined : undefined, // Wallet connect is a button action
      icon: 'ShoppingBag',
    },
    seller: {
      type: 'seller',
      status: hasListedAssets || hasSoldAssets 
        ? 'active' 
        : isVerified 
          ? 'eligible' 
          : 'locked',
      label: 'Seller',
      description: 'List and sell your luxury assets to verified buyers.',
      benefits: [
        'List unlimited assets',
        'Escrow-protected sales',
        'Verification badges',
        'Analytics & insights',
      ],
      requirements: isVerified
        ? ['Identity verified ✓', 'Wallet connected ✓']
        : ['Complete identity verification', 'Connect your XRPL wallet'],
      ctaLabel: hasListedAssets ? 'Manage Listings' : isVerified ? 'List Your First Asset' : 'Verify Identity',
      ctaHref: hasListedAssets ? '/my-listings' : isVerified ? '/list-asset' : '/settings',
      icon: 'Store',
    },
    broker: {
      type: 'broker',
      status: isBrokerApproved 
        ? 'active' 
        : isVerified 
          ? 'pending' 
          : 'locked',
      label: 'Broker',
      description: 'Earn commissions by referring buyers and sellers.',
      benefits: [
        'Earn on every referral sale',
        'Custom referral links',
        'Leaderboard visibility',
        'Priority support',
      ],
      requirements: isBrokerApproved
        ? ['Broker approved ✓', 'Identity verified ✓']
        : isVerified
          ? ['Application under review']
          : ['Complete identity verification', 'Apply for broker access'],
      ctaLabel: isBrokerApproved ? 'Broker Dashboard' : 'Apply to Become a Broker',
      ctaHref: isBrokerApproved ? '/broker' : '/broker',
      icon: 'Handshake',
    },
    admin: {
      type: 'admin',
      status: isAdminUser ? 'active' : 'invite_only',
      label: 'Admin',
      description: 'Platform administration and oversight.',
      benefits: [
        'Asset verification queue',
        'User management',
        'Platform analytics',
        'Dispute resolution',
      ],
      requirements: ['Invite only'],
      ctaLabel: isAdminUser ? 'Admin Panel' : undefined,
      ctaHref: isAdminUser ? '/admin' : undefined,
      icon: 'Shield',
    },
  };
}

/**
 * Get simple boolean flags for role checks
 */
export function getRoleFlags(
  userProfile: any | null,
  userRole: string | null,
  walletAddress: string | null
): RoleFlags {
  const hasWallet = !!walletAddress;
  const isVerified = userProfile?.kyc_status === 'verified' || userProfile?.is_verified === true;
  const hasSoldAssets = (userProfile?.sales_count || 0) > 0;
  const hasListedAssets = (userProfile?.listings_count || 0) > 0;
  const isBrokerApproved = userProfile?.is_broker === true || userRole === 'broker';
  const isAdminUser = userRole === 'admin' || userProfile?.is_admin === true;

  return {
    isBuyer: hasWallet,
    isSeller: hasListedAssets || hasSoldAssets || isVerified,
    isBroker: isBrokerApproved,
    isAdmin: isAdminUser,
    isVerified,
    hasWallet,
  };
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  action: 'buy' | 'sell' | 'list' | 'broker' | 'admin',
  flags: RoleFlags
): boolean {
  switch (action) {
    case 'buy':
      return flags.hasWallet;
    case 'sell':
    case 'list':
      return flags.isSeller || flags.isVerified;
    case 'broker':
      return flags.isBroker;
    case 'admin':
      return flags.isAdmin;
    default:
      return false;
  }
}

/**
 * Get status badge color for role status
 */
export function getStatusColor(status: RoleStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    case 'eligible':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'pending':
      return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    case 'locked':
      return 'bg-white/5 text-muted-foreground border-white/10';
    case 'invite_only':
      return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    default:
      return 'bg-white/5 text-muted-foreground border-white/10';
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: RoleStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'eligible':
      return 'Ready to Enable';
    case 'pending':
      return 'Pending Approval';
    case 'locked':
      return 'Verification Required';
    case 'invite_only':
      return 'Invite Only';
    default:
      return status;
  }
}
