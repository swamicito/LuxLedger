// KYC and compliance management for global operations
import { geoService } from './geo-utils';

export interface KYCProvider {
  id: string;
  name: string;
  supportedCountries: string[];
  verificationLevels: string[];
  processingTime: string;
  cost: number;
}

export interface KYCDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement';
  file: File;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface KYCStatus {
  level: 'none' | 'basic' | 'enhanced' | 'institutional';
  status: 'none' | 'pending' | 'verified' | 'rejected';
  documents: KYCDocument[];
  verifiedAt?: Date;
  expiresAt?: Date;
  limits: {
    dailyTradingLimit: number;
    monthlyTradingLimit: number;
    maxAssetValue: number;
  };
}

export interface ComplianceRule {
  jurisdiction: string;
  rule: string;
  description: string;
  required: boolean;
  applicableAssetTypes: string[];
}

// KYC providers configuration
export const KYC_PROVIDERS: KYCProvider[] = [
  {
    id: 'sumsub',
    name: 'Sum&Substance',
    supportedCountries: ['*'], // Global coverage
    verificationLevels: ['basic', 'enhanced', 'institutional'],
    processingTime: '5-15 minutes',
    cost: 2.5
  },
  {
    id: 'onfido',
    name: 'Onfido',
    supportedCountries: ['US', 'EU', 'GB', 'CA', 'AU', 'SG'],
    verificationLevels: ['basic', 'enhanced'],
    processingTime: '2-10 minutes',
    cost: 3.0
  },
  {
    id: 'jumio',
    name: 'Jumio',
    supportedCountries: ['US', 'EU', 'GB', 'JP', 'AU'],
    verificationLevels: ['basic', 'enhanced', 'institutional'],
    processingTime: '1-5 minutes',
    cost: 4.0
  }
];

// Compliance rules by jurisdiction
export const COMPLIANCE_RULES: Record<string, ComplianceRule[]> = {
  US: [
    {
      jurisdiction: 'US',
      rule: 'SEC_ACCREDITED_INVESTOR',
      description: 'Securities regulations require accredited investor status for certain assets',
      required: true,
      applicableAssetTypes: ['real_estate', 'private_equity']
    },
    {
      jurisdiction: 'US',
      rule: 'BSA_AML',
      description: 'Bank Secrecy Act and Anti-Money Laundering compliance required',
      required: true,
      applicableAssetTypes: ['*']
    },
    {
      jurisdiction: 'US',
      rule: 'FATCA_REPORTING',
      description: 'Foreign Account Tax Compliance Act reporting for international assets',
      required: true,
      applicableAssetTypes: ['*']
    }
  ],
  EU: [
    {
      jurisdiction: 'EU',
      rule: 'MIFID_II',
      description: 'Markets in Financial Instruments Directive II compliance',
      required: true,
      applicableAssetTypes: ['*']
    },
    {
      jurisdiction: 'EU',
      rule: 'GDPR_COMPLIANCE',
      description: 'General Data Protection Regulation compliance for data handling',
      required: true,
      applicableAssetTypes: ['*']
    },
    {
      jurisdiction: 'EU',
      rule: 'AMLD5',
      description: 'Fifth Anti-Money Laundering Directive compliance',
      required: true,
      applicableAssetTypes: ['*']
    }
  ],
  AE: [
    {
      jurisdiction: 'AE',
      rule: 'ADGM_QUALIFIED_INVESTOR',
      description: 'Abu Dhabi Global Market qualified investor certification',
      required: true,
      applicableAssetTypes: ['real_estate', 'art', 'collectibles']
    },
    {
      jurisdiction: 'AE',
      rule: 'DIFC_PROFESSIONAL_CLIENT',
      description: 'Dubai International Financial Centre professional client status',
      required: false,
      applicableAssetTypes: ['*']
    }
  ],
  CN: [
    {
      jurisdiction: 'CN',
      rule: 'PBOC_DIGITAL_ASSET_RESTRICTION',
      description: 'People\'s Bank of China restrictions on digital asset activities',
      required: true,
      applicableAssetTypes: ['crypto_native']
    }
  ]
};

export class KYCComplianceService {
  private userLocation: any = null;
  private regionalConfig: any = null;

  async initialize() {
    this.userLocation = await geoService.getUserLocation();
    this.regionalConfig = geoService.getRegionalConfig(this.userLocation.countryCode);
  }

  // Get KYC requirements for user's jurisdiction
  getKYCRequirements(): { required: boolean; level: string; provider: KYCProvider } {
    const complianceLevel = this.regionalConfig?.complianceLevel || 'basic';
    const kycRequired = this.regionalConfig?.kycRequired || false;

    let requiredLevel = 'basic';
    if (complianceLevel === 'enhanced') requiredLevel = 'enhanced';
    if (complianceLevel === 'restricted') requiredLevel = 'institutional';

    const provider = this.getBestKYCProvider(requiredLevel);

    return {
      required: kycRequired,
      level: requiredLevel,
      provider
    };
  }

  // Get best KYC provider for user's location and requirements
  getBestKYCProvider(level: string): KYCProvider {
    const availableProviders = KYC_PROVIDERS.filter(provider =>
      provider.supportedCountries.includes('*') ||
      provider.supportedCountries.includes(this.userLocation?.countryCode) ||
      (provider.supportedCountries.includes('EU') && geoService.getRegionalConfig(this.userLocation?.countryCode))
    ).filter(provider => provider.verificationLevels.includes(level));

    // Sort by cost and processing time
    return availableProviders.sort((a, b) => a.cost - b.cost)[0] || KYC_PROVIDERS[0];
  }

  // Get compliance rules for user's jurisdiction
  getComplianceRules(): ComplianceRule[] {
    return COMPLIANCE_RULES[this.userLocation?.countryCode] || [];
  }

  // Check if user can access specific asset type
  canAccessAssetType(assetType: string, userKYCStatus: KYCStatus): {
    allowed: boolean;
    reason?: string;
    requiredLevel?: string;
  } {
    const rules = this.getComplianceRules();
    const applicableRules = rules.filter(rule =>
      rule.applicableAssetTypes.includes('*') || rule.applicableAssetTypes.includes(assetType)
    );

    // Check if asset type is restricted in this jurisdiction
    if (!geoService.isAssetAvailable(assetType, this.userLocation?.countryCode)) {
      return {
        allowed: false,
        reason: 'Asset type not available in your jurisdiction'
      };
    }

    // Check KYC requirements
    const requirements = this.getKYCRequirements();
    if (requirements.required && userKYCStatus.status !== 'verified') {
      return {
        allowed: false,
        reason: 'KYC verification required',
        requiredLevel: requirements.level
      };
    }

    // Check specific compliance rules
    for (const rule of applicableRules) {
      if (rule.required) {
        // In production, check if user meets specific rule requirements
        // For now, assume basic KYC satisfies most rules
        if (userKYCStatus.level === 'none') {
          return {
            allowed: false,
            reason: rule.description,
            requiredLevel: 'basic'
          };
        }
      }
    }

    return { allowed: true };
  }

  // Get trading limits based on KYC level and jurisdiction
  getTradingLimits(kycLevel: string): {
    dailyTradingLimit: number;
    monthlyTradingLimit: number;
    maxAssetValue: number;
  } {
    const baseLimits = {
      none: { dailyTradingLimit: 0, monthlyTradingLimit: 0, maxAssetValue: 0 },
      basic: { dailyTradingLimit: 10000, monthlyTradingLimit: 50000, maxAssetValue: 100000 },
      enhanced: { dailyTradingLimit: 100000, monthlyTradingLimit: 500000, maxAssetValue: 1000000 },
      institutional: { dailyTradingLimit: 1000000, monthlyTradingLimit: 10000000, maxAssetValue: 50000000 }
    };

    const limits = baseLimits[kycLevel as keyof typeof baseLimits] || baseLimits.none;

    // Adjust limits based on jurisdiction
    const complianceLevel = this.regionalConfig?.complianceLevel;
    if (complianceLevel === 'restricted') {
      return {
        dailyTradingLimit: limits.dailyTradingLimit * 0.5,
        monthlyTradingLimit: limits.monthlyTradingLimit * 0.5,
        maxAssetValue: limits.maxAssetValue * 0.5
      };
    }

    return limits;
  }

  // Initialize KYC verification flow
  async startKYCVerification(level: string = 'basic'): Promise<{ url: string; sessionId: string }> {
    const provider = this.getBestKYCProvider(level);
    
    // In production, this would integrate with actual KYC providers
    // For now, return mock data
    return {
      url: `https://kyc-provider.com/verify?session=${Date.now()}`,
      sessionId: `session_${Date.now()}`
    };
  }

  // Check KYC verification status
  async checkKYCStatus(sessionId: string): Promise<KYCStatus> {
    // In production, this would check with the KYC provider
    // For now, return mock status
    return {
      level: 'basic',
      status: 'pending',
      documents: [],
      limits: this.getTradingLimits('basic')
    };
  }

  // Generate compliance report
  generateComplianceReport(userKYCStatus: KYCStatus): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const rules = this.getComplianceRules();

    // Check KYC status
    if (this.regionalConfig?.kycRequired && userKYCStatus.status !== 'verified') {
      issues.push('KYC verification required for this jurisdiction');
      recommendations.push('Complete KYC verification to access all features');
    }

    // Check document expiry
    if (userKYCStatus.expiresAt && userKYCStatus.expiresAt < new Date()) {
      issues.push('KYC verification has expired');
      recommendations.push('Renew KYC verification to maintain access');
    }

    // Check compliance with jurisdiction rules
    for (const rule of rules) {
      if (rule.required) {
        // In production, check actual compliance with each rule
        recommendations.push(`Ensure compliance with ${rule.rule}: ${rule.description}`);
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }
}

export const kycComplianceService = new KYCComplianceService();
