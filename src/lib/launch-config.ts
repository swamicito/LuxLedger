/**
 * Launch Configuration
 * Controls beta/public mode, feature flags, and support settings
 */

export type LaunchMode = 'beta' | 'public';

export interface LaunchConfig {
  mode: LaunchMode;
  isBeta: boolean;
  isPublic: boolean;
  supportEmail: string;
  supportSlaHours: number;
  features: {
    brokerEnrollment: 'invite-only' | 'open';
    publicListings: boolean;
    marketplaceAccess: 'all' | 'verified-only';
  };
}

/**
 * Get current launch configuration from environment
 */
export function getLaunchConfig(): LaunchConfig {
  const mode = (import.meta.env.VITE_LAUNCH_MODE as LaunchMode) || 'beta';
  const isBeta = mode === 'beta';
  
  return {
    mode,
    isBeta,
    isPublic: mode === 'public',
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@luxledger.io',
    supportSlaHours: parseInt(import.meta.env.VITE_SUPPORT_SLA_HOURS || '24', 10),
    features: {
      // In beta: invite-only broker enrollment
      brokerEnrollment: isBeta ? 'invite-only' : 'open',
      // In beta: listings require approval
      publicListings: !isBeta,
      // In beta: only verified users can access marketplace
      marketplaceAccess: isBeta ? 'verified-only' : 'all',
    },
  };
}

/**
 * Check if a feature is enabled based on launch mode
 */
export function isFeatureEnabled(feature: keyof LaunchConfig['features']): boolean {
  const config = getLaunchConfig();
  const value = config.features[feature];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  // For string-based features, return true if not in restricted mode
  return value !== 'invite-only' && value !== 'verified-only';
}

/**
 * Get support configuration
 */
export function getSupportConfig() {
  const config = getLaunchConfig();
  return {
    email: config.supportEmail,
    slaHours: config.supportSlaHours,
    slaText: `${config.supportSlaHours}–${config.supportSlaHours + 24} hours`,
  };
}

/**
 * Beta invite code validation (simple implementation)
 * In production, this would validate against a database
 */
const VALID_BETA_CODES = [
  'LUXBETA2026',
  'EARLYACCESS',
  'BROKERPREVIEW',
  'FOUNDERSCLUB',
];

export function validateBetaCode(code: string): boolean {
  return VALID_BETA_CODES.includes(code.toUpperCase().trim());
}

/**
 * Check if broker enrollment is allowed
 */
export function canEnrollAsBroker(hasInviteCode?: boolean): boolean {
  const config = getLaunchConfig();
  
  if (config.features.brokerEnrollment === 'open') {
    return true;
  }
  
  // In invite-only mode, require valid invite
  return hasInviteCode === true;
}
