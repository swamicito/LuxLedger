/**
 * LuxBroker Referral Code Generator
 * Generates unique, memorable referral codes for world-class affiliate system
 */

import { customAlphabet } from 'nanoid';

// Custom alphabet excluding confusing characters (0, O, I, l, 1)
const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 8);

// Luxury-themed word lists for memorable codes
const luxuryAdjectives = [
  'elite', 'premium', 'luxury', 'royal', 'noble', 'grand', 'supreme', 'divine',
  'opulent', 'lavish', 'exquisite', 'refined', 'elegant', 'pristine', 'golden',
  'platinum', 'diamond', 'crystal', 'pearl', 'sapphire', 'emerald', 'ruby'
];

const luxuryNouns = [
  'crown', 'throne', 'palace', 'vault', 'treasure', 'jewel', 'gem', 'crystal',
  'gold', 'silver', 'platinum', 'diamond', 'pearl', 'sapphire', 'emerald',
  'ruby', 'opal', 'topaz', 'amber', 'onyx', 'marble', 'silk', 'velvet'
];

export interface ReferralCodeOptions {
  type?: 'random' | 'memorable' | 'custom';
  prefix?: string;
  length?: number;
  customWords?: string[];
}

export class ReferralCodeGenerator {
  /**
   * Generate a unique referral code
   */
  static generate(options: ReferralCodeOptions = {}): string {
    const { type = 'memorable', prefix, length = 8 } = options;

    switch (type) {
      case 'memorable':
        return this.generateMemorableCode(prefix);
      case 'custom':
        return this.generateCustomCode(options.customWords || [], prefix);
      case 'random':
      default:
        return this.generateRandomCode(length, prefix);
    }
  }

  /**
   * Generate random alphanumeric code
   */
  private static generateRandomCode(length: number, prefix?: string): string {
    const code = nanoid(length);
    return prefix ? `${prefix}${code}` : code;
  }

  /**
   * Generate memorable luxury-themed code
   */
  private static generateMemorableCode(prefix?: string): string {
    const adjective = luxuryAdjectives[Math.floor(Math.random() * luxuryAdjectives.length)];
    const noun = luxuryNouns[Math.floor(Math.random() * luxuryNouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const code = `${adjective}${noun}${number}`;
    return prefix ? `${prefix}${code}` : code;
  }

  /**
   * Generate code from custom word list
   */
  private static generateCustomCode(words: string[], prefix?: string): string {
    if (words.length === 0) {
      return this.generateRandomCode(8, prefix);
    }

    const word = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    const code = `${word}${number}`;
    
    return prefix ? `${prefix}${code}` : code;
  }

  /**
   * Validate referral code format
   */
  static isValid(code: string): boolean {
    // Must be 3-20 characters, alphanumeric only
    const regex = /^[a-zA-Z0-9]{3,20}$/;
    return regex.test(code);
  }

  /**
   * Generate multiple unique codes
   */
  static generateBatch(count: number, options: ReferralCodeOptions = {}): string[] {
    const codes = new Set<string>();
    
    while (codes.size < count) {
      codes.add(this.generate(options));
    }
    
    return Array.from(codes);
  }

  /**
   * Generate short URL-friendly code
   */
  static generateShortCode(): string {
    return nanoid(6);
  }

  /**
   * Generate broker-specific code with tier prefix
   */
  static generateTieredCode(tier: 'bronze' | 'silver' | 'gold' | 'diamond'): string {
    const prefixes = {
      bronze: 'BZ',
      silver: 'SV', 
      gold: 'GD',
      diamond: 'DM'
    };

    return this.generate({
      type: 'memorable',
      prefix: prefixes[tier]
    });
  }
}

/**
 * Referral URL Builder
 */
export class ReferralURLBuilder {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://luxledger.app') {
    this.baseUrl = baseUrl;
  }

  /**
   * Build referral URL for listing page
   */
  buildListingURL(referralCode: string): string {
    return `${this.baseUrl}/list?ref=${referralCode}`;
  }

  /**
   * Build referral URL for marketplace
   */
  buildMarketplaceURL(referralCode: string): string {
    return `${this.baseUrl}/marketplace?ref=${referralCode}`;
  }

  /**
   * Build referral URL for signup
   */
  buildSignupURL(referralCode: string): string {
    return `${this.baseUrl}/auth?ref=${referralCode}`;
  }

  /**
   * Build short URL (for social sharing)
   */
  buildShortURL(referralCode: string): string {
    return `${this.baseUrl}/r/${referralCode}`;
  }

  /**
   * Build QR code data URL
   */
  buildQRCodeData(referralCode: string): string {
    return this.buildShortURL(referralCode);
  }

  /**
   * Extract referral code from URL
   */
  extractReferralCode(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Check query parameter
      const refParam = urlObj.searchParams.get('ref');
      if (refParam) return refParam;
      
      // Check short URL format
      const pathMatch = urlObj.pathname.match(/^\/r\/([a-zA-Z0-9]+)$/);
      if (pathMatch) return pathMatch[1];
      
      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Referral Analytics Tracker
 */
export class ReferralTracker {
  /**
   * Track referral click with browser info
   */
  static trackClick(referralCode: string): {
    referralCode: string;
    timestamp: number;
    userAgent: string;
    referrer: string;
    ipAddress?: string;
  } {
    return {
      referralCode,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    };
  }

  /**
   * Generate tracking pixel URL
   */
  static generateTrackingPixel(referralCode: string): string {
    return `/api/track-referral?ref=${referralCode}&t=${Date.now()}`;
  }

  /**
   * Check if referral is still valid (within time window)
   */
  static isReferralValid(timestamp: number, validityDays: number = 30): boolean {
    const validityMs = validityDays * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp < validityMs;
  }
}
