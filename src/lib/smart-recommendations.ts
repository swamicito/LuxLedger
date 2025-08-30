import { geoService } from './geo-utils';
import { kycComplianceService } from './kyc-compliance';

export interface UserProfile {
  id: string;
  walletAddress?: string;
  location?: any;
  kycStatus: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoals: string[];
  portfolioValue: number;
  preferredCategories: string[];
  investmentHistory: InvestmentRecord[];
  demographics: {
    ageRange?: string;
    incomeRange?: string;
    experience?: string;
  };
}

export interface InvestmentRecord {
  assetId: string;
  category: string;
  amount: number;
  purchaseDate: Date;
  currentValue: number;
  performance: number;
}

export interface AssetRecommendation {
  assetId: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  score: number;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: string;
  timeHorizon: string;
  metadata: {
    location?: string;
    brand?: string;
    year?: number;
    certification?: string;
  };
}

export interface RecommendationContext {
  userProfile: UserProfile;
  marketTrends: MarketTrend[];
  availableAssets: any[];
  portfolioAnalysis: PortfolioAnalysis;
}

export interface MarketTrend {
  category: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeframe: string;
  factors: string[];
}

export interface PortfolioAnalysis {
  diversificationScore: number;
  riskScore: number;
  categoryWeights: Record<string, number>;
  recommendations: {
    rebalance: boolean;
    suggestedAllocations: Record<string, number>;
    underweightCategories: string[];
    overweightCategories: string[];
  };
}

// Market trend data (would be fetched from external APIs in production)
const MARKET_TRENDS: MarketTrend[] = [
  {
    category: 'real_estate',
    trend: 'bullish',
    confidence: 0.8,
    timeframe: '6-12 months',
    factors: ['Rising property values', 'Low interest rates', 'Inflation hedge']
  },
  {
    category: 'watches',
    trend: 'bullish',
    confidence: 0.75,
    timeframe: '3-6 months',
    factors: ['Rolex shortage', 'Celebrity endorsements', 'Collector demand']
  },
  {
    category: 'art',
    trend: 'neutral',
    confidence: 0.6,
    timeframe: '12+ months',
    factors: ['Market volatility', 'Gallery closures', 'Digital art growth']
  },
  {
    category: 'jewelry',
    trend: 'bullish',
    confidence: 0.7,
    timeframe: '6-12 months',
    factors: ['Gold price stability', 'Luxury demand', 'Wedding season']
  },
  {
    category: 'cars',
    trend: 'bearish',
    confidence: 0.65,
    timeframe: '3-6 months',
    factors: ['EV transition', 'Economic uncertainty', 'High maintenance costs']
  }
];

export class SmartRecommendationEngine {
  private userProfile: UserProfile | null = null;
  private marketTrends: MarketTrend[] = MARKET_TRENDS;

  async initialize(userId: string, walletAddress?: string): Promise<void> {
    // In production, fetch user profile from database
    this.userProfile = await this.fetchUserProfile(userId, walletAddress);
  }

  private async fetchUserProfile(userId: string, walletAddress?: string): Promise<UserProfile> {
    // Mock user profile - in production, fetch from database
    const location = await geoService.getUserLocation();
    const kycStatus = await kycComplianceService.getUserKYCStatus(userId);

    return {
      id: userId,
      walletAddress,
      location,
      kycStatus: kycStatus.status,
      riskTolerance: 'moderate',
      investmentGoals: ['capital_appreciation', 'diversification'],
      portfolioValue: 50000,
      preferredCategories: ['real_estate', 'watches'],
      investmentHistory: [
        {
          assetId: 'asset1',
          category: 'real_estate',
          amount: 25000,
          purchaseDate: new Date('2024-01-15'),
          currentValue: 27500,
          performance: 10
        }
      ],
      demographics: {
        ageRange: '25-35',
        incomeRange: '75k-150k',
        experience: 'intermediate'
      }
    };
  }

  async generateRecommendations(availableAssets: any[], limit: number = 10): Promise<AssetRecommendation[]> {
    if (!this.userProfile) {
      throw new Error('User profile not initialized');
    }

    const context: RecommendationContext = {
      userProfile: this.userProfile,
      marketTrends: this.marketTrends,
      availableAssets,
      portfolioAnalysis: this.analyzePortfolio()
    };

    const recommendations: AssetRecommendation[] = [];

    for (const asset of availableAssets) {
      const score = this.calculateRecommendationScore(asset, context);
      if (score > 0.3) { // Minimum threshold
        const recommendation = this.createRecommendation(asset, score, context);
        recommendations.push(recommendation);
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateRecommendationScore(asset: any, context: RecommendationContext): number {
    let score = 0.5; // Base score

    // Category preference
    if (context.userProfile.preferredCategories.includes(asset.category)) {
      score += 0.2;
    }

    // Market trend alignment
    const trend = this.marketTrends.find(t => t.category === asset.category);
    if (trend) {
      if (trend.trend === 'bullish') {
        score += trend.confidence * 0.15;
      } else if (trend.trend === 'bearish') {
        score -= trend.confidence * 0.1;
      }
    }

    // Risk tolerance alignment
    const assetRisk = this.assessAssetRisk(asset);
    const riskAlignment = this.calculateRiskAlignment(assetRisk, context.userProfile.riskTolerance);
    score += riskAlignment * 0.15;

    // Portfolio diversification benefit
    const diversificationBonus = this.calculateDiversificationBonus(asset, context.portfolioAnalysis);
    score += diversificationBonus;

    // Price affordability
    const affordabilityScore = this.calculateAffordabilityScore(asset, context.userProfile);
    score += affordabilityScore * 0.1;

    // Geographic relevance
    if (context.userProfile.location && asset.location) {
      const geoScore = this.calculateGeographicRelevance(asset, context.userProfile.location);
      score += geoScore * 0.05;
    }

    // KYC compliance
    if (!this.isAssetCompliant(asset, context.userProfile)) {
      score *= 0.5; // Heavily penalize non-compliant assets
    }

    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
  }

  private assessAssetRisk(asset: any): 'low' | 'medium' | 'high' {
    // Risk assessment based on category and other factors
    const riskMap: Record<string, 'low' | 'medium' | 'high'> = {
      'real_estate': 'low',
      'jewelry': 'medium',
      'watches': 'medium',
      'art': 'high',
      'cars': 'high',
      'wine': 'medium',
      'collectibles': 'high'
    };

    return riskMap[asset.category] || 'medium';
  }

  private calculateRiskAlignment(assetRisk: string, userRiskTolerance: string): number {
    const riskMatrix: Record<string, Record<string, number>> = {
      'conservative': { 'low': 0.3, 'medium': 0.1, 'high': -0.2 },
      'moderate': { 'low': 0.2, 'medium': 0.3, 'high': 0.1 },
      'aggressive': { 'low': 0.1, 'medium': 0.2, 'high': 0.3 }
    };

    return riskMatrix[userRiskTolerance]?.[assetRisk] || 0;
  }

  private calculateDiversificationBonus(asset: any, portfolioAnalysis: PortfolioAnalysis): number {
    if (portfolioAnalysis.recommendations.underweightCategories.includes(asset.category)) {
      return 0.2;
    }
    if (portfolioAnalysis.recommendations.overweightCategories.includes(asset.category)) {
      return -0.1;
    }
    return 0;
  }

  private calculateAffordabilityScore(asset: any, userProfile: UserProfile): number {
    const assetPrice = asset.estimated_value || asset.price || 0;
    const maxAffordable = userProfile.portfolioValue * 0.1; // Max 10% of portfolio per asset

    if (assetPrice <= maxAffordable * 0.5) return 1.0; // Very affordable
    if (assetPrice <= maxAffordable) return 0.7; // Affordable
    if (assetPrice <= maxAffordable * 2) return 0.3; // Stretch
    return 0.1; // Too expensive
  }

  private calculateGeographicRelevance(asset: any, userLocation: any): number {
    // Simple geographic scoring - in production, use more sophisticated logic
    if (asset.location && userLocation.country) {
      if (asset.location.includes(userLocation.country)) return 1.0;
      if (asset.location.includes(userLocation.region)) return 0.7;
    }
    return 0.5; // Neutral for unknown locations
  }

  private isAssetCompliant(asset: any, userProfile: UserProfile): boolean {
    if (!userProfile.location) return true;

    const config = geoService.getRegionalConfig(userProfile.location.countryCode);
    
    // Check if asset is restricted in user's jurisdiction
    if (config.restrictedAssets.includes(asset.category)) {
      return false;
    }

    // Check KYC requirements
    if (config.kycRequired && userProfile.kycStatus !== 'verified') {
      return false;
    }

    return true;
  }

  private createRecommendation(asset: any, score: number, context: RecommendationContext): AssetRecommendation {
    const reasons = this.generateReasons(asset, score, context);
    const riskLevel = this.assessAssetRisk(asset);

    return {
      assetId: asset.id,
      title: asset.title,
      category: asset.category,
      price: asset.estimated_value || asset.price || 0,
      currency: asset.currency || 'USD',
      score,
      reasons,
      riskLevel,
      expectedReturn: this.estimateReturn(asset),
      timeHorizon: this.estimateTimeHorizon(asset),
      metadata: {
        location: asset.location,
        brand: asset.brand,
        year: asset.year,
        certification: asset.certification
      }
    };
  }

  private generateReasons(asset: any, score: number, context: RecommendationContext): string[] {
    const reasons: string[] = [];

    // Market trend reasons
    const trend = this.marketTrends.find(t => t.category === asset.category);
    if (trend && trend.trend === 'bullish') {
      reasons.push(`${asset.category} market is trending upward`);
      reasons.push(...trend.factors.slice(0, 2));
    }

    // Portfolio diversification
    if (context.portfolioAnalysis.recommendations.underweightCategories.includes(asset.category)) {
      reasons.push(`Helps diversify your portfolio in ${asset.category}`);
    }

    // User preference alignment
    if (context.userProfile.preferredCategories.includes(asset.category)) {
      reasons.push(`Matches your investment preferences`);
    }

    // Risk alignment
    const riskLevel = this.assessAssetRisk(asset);
    if (this.calculateRiskAlignment(riskLevel, context.userProfile.riskTolerance) > 0.2) {
      reasons.push(`Risk level aligns with your tolerance`);
    }

    // Price attractiveness
    const affordability = this.calculateAffordabilityScore(asset, context.userProfile);
    if (affordability > 0.7) {
      reasons.push(`Priced within your investment range`);
    }

    return reasons.slice(0, 4); // Limit to top 4 reasons
  }

  private estimateReturn(asset: any): string {
    const returnMap: Record<string, string> = {
      'real_estate': '5-12% annually',
      'watches': '8-15% annually',
      'jewelry': '3-8% annually',
      'art': '6-20% annually',
      'cars': '2-10% annually',
      'wine': '4-12% annually',
      'collectibles': '5-25% annually'
    };

    return returnMap[asset.category] || '5-15% annually';
  }

  private estimateTimeHorizon(asset: any): string {
    const horizonMap: Record<string, string> = {
      'real_estate': '3-10 years',
      'watches': '2-5 years',
      'jewelry': '1-3 years',
      'art': '5-15 years',
      'cars': '3-7 years',
      'wine': '5-20 years',
      'collectibles': '2-10 years'
    };

    return horizonMap[asset.category] || '2-5 years';
  }

  private analyzePortfolio(): PortfolioAnalysis {
    if (!this.userProfile) {
      return {
        diversificationScore: 0.5,
        riskScore: 0.5,
        categoryWeights: {},
        recommendations: {
          rebalance: false,
          suggestedAllocations: {},
          underweightCategories: ['real_estate', 'watches', 'jewelry'],
          overweightCategories: []
        }
      };
    }

    const categoryWeights: Record<string, number> = {};
    let totalValue = 0;

    // Calculate current category weights
    for (const investment of this.userProfile.investmentHistory) {
      categoryWeights[investment.category] = (categoryWeights[investment.category] || 0) + investment.currentValue;
      totalValue += investment.currentValue;
    }

    // Normalize to percentages
    for (const category in categoryWeights) {
      categoryWeights[category] = categoryWeights[category] / totalValue;
    }

    // Ideal allocations based on risk tolerance
    const idealAllocations: Record<string, number> = {
      'real_estate': 0.4,
      'watches': 0.2,
      'jewelry': 0.15,
      'art': 0.15,
      'cars': 0.1
    };

    const underweightCategories: string[] = [];
    const overweightCategories: string[] = [];

    for (const [category, ideal] of Object.entries(idealAllocations)) {
      const current = categoryWeights[category] || 0;
      if (current < ideal * 0.7) {
        underweightCategories.push(category);
      } else if (current > ideal * 1.3) {
        overweightCategories.push(category);
      }
    }

    return {
      diversificationScore: this.calculateDiversificationScore(categoryWeights),
      riskScore: this.calculatePortfolioRisk(categoryWeights),
      categoryWeights,
      recommendations: {
        rebalance: underweightCategories.length > 0 || overweightCategories.length > 0,
        suggestedAllocations: idealAllocations,
        underweightCategories,
        overweightCategories
      }
    };
  }

  private calculateDiversificationScore(categoryWeights: Record<string, number>): number {
    const categories = Object.keys(categoryWeights);
    if (categories.length <= 1) return 0.2;
    if (categories.length <= 2) return 0.4;
    if (categories.length <= 3) return 0.6;
    if (categories.length <= 4) return 0.8;
    return 1.0;
  }

  private calculatePortfolioRisk(categoryWeights: Record<string, number>): number {
    const riskWeights = {
      'real_estate': 0.3,
      'jewelry': 0.5,
      'watches': 0.5,
      'art': 0.8,
      'cars': 0.8,
      'wine': 0.6,
      'collectibles': 0.9
    };

    let weightedRisk = 0;
    for (const [category, weight] of Object.entries(categoryWeights)) {
      weightedRisk += (riskWeights[category] || 0.5) * weight;
    }

    return weightedRisk;
  }

  // Get personalized insights
  getPortfolioInsights(): string[] {
    if (!this.userProfile) return [];

    const analysis = this.analyzePortfolio();
    const insights: string[] = [];

    if (analysis.diversificationScore < 0.6) {
      insights.push("Consider diversifying across more asset categories to reduce risk");
    }

    if (analysis.riskScore > 0.7 && this.userProfile.riskTolerance === 'conservative') {
      insights.push("Your portfolio may be too risky for your conservative profile");
    }

    if (analysis.recommendations.underweightCategories.length > 0) {
      insights.push(`Consider increasing allocation to: ${analysis.recommendations.underweightCategories.join(', ')}`);
    }

    const performance = this.userProfile.investmentHistory.reduce((sum, inv) => sum + inv.performance, 0) / this.userProfile.investmentHistory.length;
    if (performance > 10) {
      insights.push("Your portfolio is performing well above market average");
    } else if (performance < 0) {
      insights.push("Consider reviewing underperforming assets");
    }

    return insights;
  }
}

export const smartRecommendationEngine = new SmartRecommendationEngine();
