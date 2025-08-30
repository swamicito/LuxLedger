// GeoIP and regional utilities
export interface UserLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  currency: string;
  language: string;
}

export interface RegionalConfig {
  currencies: string[];
  languages: string[];
  kycRequired: boolean;
  restrictedAssets: string[];
  legalDisclaimer: string;
  complianceLevel: 'basic' | 'enhanced' | 'restricted';
}

// Regional configurations
export const REGIONAL_CONFIGS: Record<string, RegionalConfig> = {
  US: {
    currencies: ['USD', 'XRP'],
    languages: ['en', 'es'],
    kycRequired: true,
    restrictedAssets: [],
    legalDisclaimer: 'Securities regulations apply. Accredited investors only for certain assets.',
    complianceLevel: 'enhanced'
  },
  EU: {
    currencies: ['EUR', 'XRP'],
    languages: ['en', 'es', 'de', 'fr'],
    kycRequired: true,
    restrictedAssets: [],
    legalDisclaimer: 'MiFID II regulations apply. Professional investors may access additional products.',
    complianceLevel: 'enhanced'
  },
  AE: {
    currencies: ['AED', 'USD', 'XRP'],
    languages: ['ar', 'en'],
    kycRequired: true,
    restrictedAssets: [],
    legalDisclaimer: 'ADGM/DIFC regulations apply. Qualified investor certification required.',
    complianceLevel: 'enhanced'
  },
  CN: {
    currencies: ['CNY', 'XRP'],
    languages: ['zh', 'en'],
    kycRequired: true,
    restrictedAssets: ['crypto-native'],
    legalDisclaimer: 'Local regulations restrict certain digital asset activities.',
    complianceLevel: 'restricted'
  },
  RU: {
    currencies: ['RUB', 'XRP'],
    languages: ['ru', 'en'],
    kycRequired: true,
    restrictedAssets: [],
    legalDisclaimer: 'Digital financial asset regulations apply.',
    complianceLevel: 'basic'
  },
  DEFAULT: {
    currencies: ['USD', 'XRP'],
    languages: ['en'],
    kycRequired: false,
    restrictedAssets: [],
    legalDisclaimer: 'Digital assets are volatile and may lose value.',
    complianceLevel: 'basic'
  }
};

// Currency conversion rates (mock - in production use real API)
export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  AED: 3.67,
  CNY: 7.24,
  RUB: 74.5,
  XRP: 0.5, // XRP to USD rate
};

export class GeoService {
  private userLocation: UserLocation | null = null;

  // Get user location (mock implementation - use real GeoIP service in production)
  async getUserLocation(): Promise<UserLocation> {
    if (this.userLocation) {
      return this.userLocation;
    }

    try {
      // In production, use a service like ipapi.co, ipgeolocation.io, or MaxMind
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      this.userLocation = {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'US',
        region: data.region || 'Unknown',
        city: data.city || 'Unknown',
        timezone: data.timezone || 'UTC',
        currency: data.currency || 'USD',
        language: data.languages?.split(',')[0] || 'en'
      };
    } catch (error) {
      console.error('Failed to get user location:', error);
      // Fallback to default US location
      this.userLocation = {
        country: 'United States',
        countryCode: 'US',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en'
      };
    }

    return this.userLocation;
  }

  // Get regional configuration
  getRegionalConfig(countryCode: string): RegionalConfig {
    return REGIONAL_CONFIGS[countryCode] || REGIONAL_CONFIGS.DEFAULT;
  }

  // Convert currency
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    const fromRate = CURRENCY_RATES[fromCurrency] || 1;
    const toRate = CURRENCY_RATES[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  }

  // Format currency based on locale
  formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  // Check if asset is available in region
  isAssetAvailable(assetType: string, countryCode: string): boolean {
    const config = this.getRegionalConfig(countryCode);
    return !config.restrictedAssets.includes(assetType);
  }

  // Get compliance level for region
  getComplianceLevel(countryCode: string): 'basic' | 'enhanced' | 'restricted' {
    const config = this.getRegionalConfig(countryCode);
    return config.complianceLevel;
  }
}

export const geoService = new GeoService();
