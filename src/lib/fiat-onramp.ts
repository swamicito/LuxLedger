// Fiat onramp integration for global payments
import { geoService } from './geo-utils';

export interface OnrampProvider {
  id: string;
  name: string;
  logo: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
  fees: {
    percentage: number;
    fixed: number;
  };
  kycRequired: boolean;
}

export interface OnrampTransaction {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  walletAddress: string;
  createdAt: Date;
}

// Onramp providers configuration
export const ONRAMP_PROVIDERS: OnrampProvider[] = [
  {
    id: 'ramp',
    name: 'Ramp Network',
    logo: '/providers/ramp-logo.svg',
    supportedCountries: ['US', 'EU', 'GB', 'CA', 'AU'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    minAmount: 50,
    maxAmount: 20000,
    fees: { percentage: 2.9, fixed: 0 },
    kycRequired: true
  },
  {
    id: 'transak',
    name: 'Transak',
    logo: '/providers/transak-logo.svg',
    supportedCountries: ['US', 'EU', 'GB', 'IN', 'BR', 'MX'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR', 'BRL', 'MXN'],
    minAmount: 30,
    maxAmount: 50000,
    fees: { percentage: 0.99, fixed: 5 },
    kycRequired: true
  },
  {
    id: 'moonpay',
    name: 'MoonPay',
    logo: '/providers/moonpay-logo.svg',
    supportedCountries: ['US', 'EU', 'GB', 'SG', 'HK', 'AU'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SGD', 'HKD', 'AUD'],
    minAmount: 20,
    maxAmount: 10000,
    fees: { percentage: 4.5, fixed: 0 },
    kycRequired: false
  },
  {
    id: 'banxa',
    name: 'Banxa',
    logo: '/providers/banxa-logo.svg',
    supportedCountries: ['US', 'EU', 'AU', 'CA', 'GB'],
    supportedCurrencies: ['USD', 'EUR', 'AUD', 'CAD', 'GBP'],
    minAmount: 25,
    maxAmount: 15000,
    fees: { percentage: 1.99, fixed: 2.5 },
    kycRequired: true
  }
];

export class FiatOnrampService {
  private userLocation: any = null;

  async initialize() {
    this.userLocation = await geoService.getUserLocation();
  }

  // Get available providers for user's region
  getAvailableProviders(): OnrampProvider[] {
    if (!this.userLocation) return [];

    return ONRAMP_PROVIDERS.filter(provider => 
      provider.supportedCountries.includes(this.userLocation.countryCode) ||
      provider.supportedCountries.includes('EU') && this.isEUCountry(this.userLocation.countryCode)
    );
  }

  // Get best provider based on amount and user preferences
  getBestProvider(amount: number, currency: string): OnrampProvider | null {
    const availableProviders = this.getAvailableProviders()
      .filter(provider => 
        provider.supportedCurrencies.includes(currency) &&
        amount >= provider.minAmount &&
        amount <= provider.maxAmount
      );

    if (availableProviders.length === 0) return null;

    // Sort by total cost (fees)
    return availableProviders.sort((a, b) => {
      const costA = this.calculateTotalCost(amount, a);
      const costB = this.calculateTotalCost(amount, b);
      return costA - costB;
    })[0];
  }

  // Calculate total cost including fees
  calculateTotalCost(amount: number, provider: OnrampProvider): number {
    const percentageFee = amount * (provider.fees.percentage / 100);
    return amount + percentageFee + provider.fees.fixed;
  }

  // Initialize Ramp Network widget
  async initializeRamp(config: {
    userAddress: string;
    amount?: number;
    currency?: string;
  }) {
    if (typeof window === 'undefined') return;

    const { RampInstantSDK } = await import('@ramp-network/ramp-instant-sdk');
    
    new RampInstantSDK({
      hostAppName: 'LuxLedger',
      hostLogoUrl: '/logo.png',
      swapAsset: 'XRP',
      userAddress: config.userAddress,
      fiatCurrency: config.currency || this.userLocation?.currency || 'USD',
      fiatValue: config.amount?.toString(),
      webhookStatusUrl: `${window.location.origin}/api/webhooks/ramp`,
    }).show();
  }

  // Initialize Transak widget
  async initializeTransak(config: {
    userAddress: string;
    amount?: number;
    currency?: string;
  }) {
    if (typeof window === 'undefined') return;

    const transakScript = document.createElement('script');
    transakScript.src = 'https://global.transak.com/sdk/v1.2/transak.js';
    document.head.appendChild(transakScript);

    transakScript.onload = () => {
      // @ts-ignore
      const transak = new window.TransakSDK({
        apiKey: process.env.VITE_TRANSAK_API_KEY,
        environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'STAGING',
        defaultCryptoCurrency: 'XRP',
        walletAddress: config.userAddress,
        themeColor: '6366f1',
        fiatCurrency: config.currency || this.userLocation?.currency || 'USD',
        fiatAmount: config.amount?.toString(),
        email: '',
        redirectURL: window.location.origin,
        hostURL: window.location.origin,
        widgetHeight: '625px',
        widgetWidth: '450px',
      });

      transak.init();
    };
  }

  // Initialize MoonPay widget
  async initializeMoonPay(config: {
    userAddress: string;
    amount?: number;
    currency?: string;
  }) {
    const baseUrl = 'https://buy.moonpay.com';
    const params = new URLSearchParams({
      apiKey: process.env.VITE_MOONPAY_API_KEY || '',
      currencyCode: 'xrp',
      walletAddress: config.userAddress,
      baseCurrencyCode: config.currency || this.userLocation?.currency || 'USD',
      baseCurrencyAmount: config.amount?.toString() || '',
      redirectURL: window.location.origin,
    });

    window.open(`${baseUrl}?${params.toString()}`, '_blank', 'width=450,height=700');
  }

  // Launch provider widget
  async launchProvider(providerId: string, config: {
    userAddress: string;
    amount?: number;
    currency?: string;
  }) {
    switch (providerId) {
      case 'ramp':
        return this.initializeRamp(config);
      case 'transak':
        return this.initializeTransak(config);
      case 'moonpay':
        return this.initializeMoonPay(config);
      default:
        throw new Error(`Provider ${providerId} not supported`);
    }
  }

  // Check if country is in EU
  private isEUCountry(countryCode: string): boolean {
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    return euCountries.includes(countryCode);
  }

  // Get transaction status
  async getTransactionStatus(transactionId: string): Promise<OnrampTransaction | null> {
    try {
      // In production, this would call your backend API
      const response = await fetch(`/api/onramp/transactions/${transactionId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return null;
    }
  }
}

export const fiatOnrampService = new FiatOnrampService();
