/* eslint-disable @typescript-eslint/no-explicit-any */
// AI-powered concierge for crypto and platform assistance
import { geoService } from './geo-utils';
import { kycComplianceService } from './kyc-compliance';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestedActions?: string[];
  };
}

export interface ConversationContext {
  userId?: string;
  walletAddress?: string;
  userLocation?: any;
  kycStatus?: string;
  portfolioValue?: number;
  recentActivity?: string[];
}

export interface AIResponse {
  message: string;
  intent: string;
  confidence: number;
  suggestedActions: string[];
  quickReplies?: string[];
}

// Predefined intents and responses
const INTENT_PATTERNS = {
  greeting: {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    responses: [
      "Hello! I'm your LuxLedger AI concierge. How can I help you with luxury asset investing today?",
      "Welcome to LuxLedger! I'm here to assist you with crypto, trading, and platform questions.",
      "Hi there! Ready to explore luxury assets with escrow-protected settlement? What would you like to know?"
    ]
  },
  
  crypto_basics: {
    patterns: ['what is crypto', 'explain blockchain', 'how does xrp work', 'what is xrpl'],
    responses: [
      "Cryptocurrency is digital money secured by cryptography. XRP is a digital asset that enables fast, low-cost international payments on the XRP Ledger (XRPL) — the network LuxLedger uses for escrow settlement.",
      "The XRP Ledger is a decentralized blockchain that processes transactions in 3-5 seconds with minimal fees. We use it to hold purchase funds in on-chain escrow until delivery is confirmed."
    ]
  },

  platform_help: {
    patterns: ['how to buy', 'how to sell', 'how to trade', 'wallet connection', 'kyc verification'],
    responses: [
      "To get started: 1) Sign in and connect your Xaman wallet, 2) Browse the marketplace for luxury assets, 3) Buy with XRP — your payment goes into on-chain escrow and stays there until delivery is confirmed.",
      "Buying on LuxLedger: pick a listing, fund the escrow by signing in Xaman, and confirm receipt when your item arrives. Funds release to the seller only after delivery — never before."
    ]
  },

  investment_advice: {
    patterns: ['investment strategy', 'which assets', 'portfolio advice', 'diversification'],
    responses: [
      "I can't provide financial advice, but I can explain our categories: real estate, jewelry and watches, and collector cars — each purchased outright and settled through on-chain escrow.",
      "LuxLedger is a marketplace for whole luxury assets, not fractional tokens. Every purchase is protected by escrow: funds are held on the XRP Ledger until delivery is confirmed."
    ]
  },

  compliance: {
    patterns: ['kyc required', 'legal compliance', 'regulations', 'jurisdiction'],
    responses: [
      "KYC requirements vary by jurisdiction. I can check your location and provide specific compliance information. Generally, enhanced verification unlocks higher trading limits and access to premium assets.",
      "We comply with regulations in all supported jurisdictions. Your location determines specific requirements - some regions need basic KYC, others require enhanced verification for certain asset types."
    ]
  },

  technical_support: {
    patterns: ['transaction failed', 'wallet issues', 'connection problems', 'error message'],
    responses: [
      "For technical issues: 1) Check your wallet connection, 2) Ensure sufficient XRP for transaction fees, 3) Verify your internet connection, 4) Try refreshing the page. If problems persist, I can escalate to our technical team.",
      "Common solutions: Make sure your XUMM wallet is updated, check that you have enough XRP for network fees (usually 0.00001 XRP), and ensure you're connected to the correct network (Mainnet for live trading)."
    ]
  }
};

// Asset-specific knowledge base
const ASSET_KNOWLEDGE = {
  real_estate: {
    description: "Premium residences and estates sold as whole assets, with payment held in on-chain escrow through closing and delivery.",
    benefits: ["Tangible asset class", "Escrow-protected settlement", "Documented provenance", "Direct ownership transfer"],
    risks: ["Market volatility", "Transaction complexity", "Due diligence requirements"],
    typical_returns: "Varies by property and market"
  },
  
  jewelry: {
    description: "High-end jewelry and signed pieces sold outright, with funds held in escrow until the buyer confirms delivery.",
    benefits: ["Collectible value", "Portable asset", "Escrow protection on every order", "Global marketplace access"],
    risks: ["Fashion trend dependencies", "Condition assessment", "Shipping and handling"],
    typical_returns: "Variable, collectible-dependent"
  },

  watches: {
    description: "Luxury timepieces from brands like Rolex, Patek Philippe, and Audemars Piguet — whole pieces, settled through escrow.",
    benefits: ["Strong historical demand", "Brand recognition", "Escrow-protected purchase", "Global collector market"],
    risks: ["Market saturation", "Condition dependencies", "Provenance verification"],
    typical_returns: "Varies by brand and reference"
  },

  art: {
    description: "Fine art pieces and collectibles sold as whole works, with payment held in escrow until delivery is confirmed.",
    benefits: ["Cultural and aesthetic value", "Portfolio diversification", "Escrow-protected settlement", "Documented provenance"],
    risks: ["Subjective valuation", "Market volatility", "Authentication and provenance"],
    typical_returns: "Highly variable"
  }
};

export class AIConciergeService {
  private context: ConversationContext = {};
  private conversationHistory: ChatMessage[] = [];

  async initialize(context: ConversationContext) {
    this.context = context;
    
    // Get user's regional information
    if (!this.context.userLocation) {
      this.context.userLocation = await geoService.getUserLocation();
    }
  }

  async processMessage(userMessage: string): Promise<AIResponse> {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage.toLowerCase(),
      timestamp: new Date()
    };

    this.conversationHistory.push(message);

    // Analyze intent
    const intent = this.analyzeIntent(userMessage.toLowerCase());
    const response = await this.generateResponse(intent, userMessage);

    // Add assistant response to history
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      metadata: {
        intent: response.intent,
        confidence: response.confidence,
        suggestedActions: response.suggestedActions
      }
    };

    this.conversationHistory.push(assistantMessage);

    return response;
  }

  private analyzeIntent(message: string): { intent: string; confidence: number } {
    let bestMatch = { intent: 'general', confidence: 0.3 };

    for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (message.includes(pattern)) {
          const confidence = pattern.length / message.length;
          if (confidence > bestMatch.confidence) {
            bestMatch = { intent, confidence: Math.min(confidence * 2, 0.9) };
          }
        }
      }
    }

    // Check for asset-specific queries
    for (const assetType of Object.keys(ASSET_KNOWLEDGE)) {
      if (message.includes(assetType) || message.includes(assetType.replace('_', ' '))) {
        bestMatch = { intent: 'asset_info', confidence: 0.8 };
        break;
      }
    }

    return bestMatch;
  }

  private async generateResponse(intent: { intent: string; confidence: number }, userMessage: string): Promise<AIResponse> {
    let response: AIResponse = {
      message: "I'm here to help! Could you please be more specific about what you'd like to know?",
      intent: intent.intent,
      confidence: intent.confidence,
      suggestedActions: []
    };

    switch (intent.intent) {
      case 'greeting':
        response = await this.handleGreeting();
        break;
      case 'crypto_basics':
        response = await this.handleCryptoBasics(userMessage);
        break;
      case 'platform_help':
        response = await this.handlePlatformHelp(userMessage);
        break;
      case 'investment_advice':
        response = await this.handleInvestmentAdvice();
        break;
      case 'compliance':
        response = await this.handleCompliance();
        break;
      case 'technical_support':
        response = await this.handleTechnicalSupport(userMessage);
        break;
      case 'asset_info':
        response = await this.handleAssetInfo(userMessage);
        break;
      default:
        response = await this.handleGeneral(userMessage);
    }

    return response;
  }

  private async handleGreeting(): Promise<AIResponse> {
    const responses = INTENT_PATTERNS.greeting.responses;
    const message = responses[Math.floor(Math.random() * responses.length)];
    
    let personalizedMessage = message;
    if (this.context.userLocation) {
      personalizedMessage += ` I see you're connecting from ${this.context.userLocation.country}.`;
    }

    return {
      message: personalizedMessage,
      intent: 'greeting',
      confidence: 0.9,
      suggestedActions: ['Browse Marketplace', 'Connect Wallet', 'Learn About Assets'],
      quickReplies: ['How do I get started?', 'What assets can I buy?', 'Tell me about KYC']
    };
  }

  private async handleCryptoBasics(userMessage: string): Promise<AIResponse> {
    const responses = INTENT_PATTERNS.crypto_basics.responses;
    let message = responses[Math.floor(Math.random() * responses.length)];

    if (userMessage.includes('xrp') || userMessage.includes('xrpl')) {
      message = "XRP is a digital asset designed for payments, while XRPL (XRP Ledger) is the blockchain that powers it. XRPL processes transactions in 3-5 seconds with minimal fees, making it perfect for tokenizing and trading luxury assets. On LuxLedger, we use XRPL's advanced features like NFTs and custom tokens to represent ownership of real-world luxury items.";
    }

    return {
      message,
      intent: 'crypto_basics',
      confidence: 0.8,
      suggestedActions: ['View Trading Tutorial', 'Connect XUMM Wallet', 'Browse Asset Types'],
      quickReplies: ['How do I buy XRP?', 'What is tokenization?', 'Show me the marketplace']
    };
  }

  private async handlePlatformHelp(userMessage: string): Promise<AIResponse> {
    let message = INTENT_PATTERNS.platform_help.responses[0];
    const actions = ['Connect Wallet', 'Start KYC Verification', 'Browse Marketplace'];

    if (userMessage.includes('wallet')) {
      message = "To connect your wallet: 1) Download XUMM wallet app, 2) Create or import your XRP account, 3) Click 'Connect Wallet' on LuxLedger, 4) Scan the QR code with XUMM. Your wallet stays secure - we never access your private keys.";
      actions.push('Download XUMM');
    } else if (userMessage.includes('kyc')) {
      message = `KYC verification helps us comply with regulations and increases your trading limits. ${this.context.userLocation ? `In ${this.context.userLocation.country}, ` : ''}the process typically takes 5-15 minutes and requires a government ID and proof of address.`;
      actions.push('Start KYC Process');
    }

    return {
      message,
      intent: 'platform_help',
      confidence: 0.8,
      suggestedActions: actions,
      quickReplies: ['How to buy assets?', 'Trading fees?', 'Withdrawal process?']
    };
  }

  private async handleInvestmentAdvice(): Promise<AIResponse> {
    const message = INTENT_PATTERNS.investment_advice.responses[0];
    
    let personalizedAdvice = message;
    if (this.context.portfolioValue) {
      personalizedAdvice += ` Based on your current portfolio value of $${this.context.portfolioValue.toLocaleString()}, consider diversifying across multiple asset categories.`;
    }

    return {
      message: personalizedAdvice,
      intent: 'investment_advice',
      confidence: 0.7,
      suggestedActions: ['View Asset Categories', 'Portfolio Analysis', 'Risk Assessment'],
      quickReplies: ['Show me real estate', 'What about watches?', 'Art investments?']
    };
  }

  private async handleCompliance(): Promise<AIResponse> {
    let message = INTENT_PATTERNS.compliance.responses[0];
    
    if (this.context.userLocation) {
      const config = geoService.getRegionalConfig(this.context.userLocation.countryCode);
      message = `In ${this.context.userLocation.country}, ${config.kycRequired ? 'KYC verification is required' : 'KYC verification is optional but recommended'}. Your compliance level is "${config.complianceLevel}" which ${config.complianceLevel === 'enhanced' ? 'provides access to all asset types' : 'may restrict certain premium assets'}.`;
    }

    return {
      message,
      intent: 'compliance',
      confidence: 0.8,
      suggestedActions: ['Check KYC Status', 'View Regional Rules', 'Start Verification'],
      quickReplies: ['What documents needed?', 'How long does KYC take?', 'Trading limits?']
    };
  }

  private async handleTechnicalSupport(userMessage: string): Promise<AIResponse> {
    let message = INTENT_PATTERNS.technical_support.responses[0];
    const actions = ['Check Wallet Connection', 'View Transaction History', 'Contact Support'];

    if (userMessage.includes('failed') || userMessage.includes('error')) {
      message = "Transaction failures usually occur due to: 1) Insufficient XRP for network fees, 2) Network congestion, 3) Wallet connection issues, or 4) Invalid transaction parameters. Try checking your XRP balance and reconnecting your wallet.";
      actions.push('Retry Transaction');
    }

    return {
      message,
      intent: 'technical_support',
      confidence: 0.8,
      suggestedActions: actions,
      quickReplies: ['Check my balance', 'Reconnect wallet', 'Transaction status']
    };
  }

  private async handleAssetInfo(userMessage: string): Promise<AIResponse> {
    let assetType = '';
    for (const type of Object.keys(ASSET_KNOWLEDGE)) {
      if (userMessage.includes(type) || userMessage.includes(type.replace('_', ' '))) {
        assetType = type;
        break;
      }
    }

    if (assetType && ASSET_KNOWLEDGE[assetType]) {
      const asset = ASSET_KNOWLEDGE[assetType];
      const message = `${asset.description} Key benefits include: ${asset.benefits.slice(0, 2).join(', ')}. Typical returns: ${asset.typical_returns}. Main risks to consider: ${asset.risks.slice(0, 2).join(', ')}.`;

      return {
        message,
        intent: 'asset_info',
        confidence: 0.9,
        suggestedActions: [`Browse ${assetType.replace('_', ' ')} Assets`, 'View Portfolio Options', 'Calculate Returns'],
        quickReplies: ['Show available assets', 'Investment minimums?', 'How to diversify?']
      };
    }

    return {
      message: "I can provide information about our asset types: real estate, jewelry, watches, and art. Each has unique characteristics, benefits, and risk profiles. Which would you like to learn about?",
      intent: 'asset_info',
      confidence: 0.6,
      suggestedActions: ['Browse All Assets', 'Asset Comparison', 'Investment Guide'],
      quickReplies: ['Real estate', 'Luxury watches', 'Fine art']
    };
  }

  private async handleGeneral(userMessage: string): Promise<AIResponse> {
    const suggestions = [
      "I can help you with crypto basics, platform navigation, asset information, and technical support.",
      "Feel free to ask about XRP, XRPL, escrow, shipping, KYC verification, or any platform features.",
      "I'm here to assist with your luxury asset investment journey. What specific topic interests you?"
    ];

    return {
      message: suggestions[Math.floor(Math.random() * suggestions.length)],
      intent: 'general',
      confidence: 0.4,
      suggestedActions: ['Browse Help Topics', 'View Getting Started Guide', 'Contact Human Support'],
      quickReplies: ['How to get started?', 'What can I invest in?', 'Platform tutorial']
    };
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get smart recommendations based on user context
  getSmartRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.context.walletAddress) {
      recommendations.push("Connect your XUMM wallet to start trading");
    }

    if (this.context.kycStatus !== 'verified') {
      recommendations.push("Complete KYC verification to unlock higher limits");
    }

    if (this.context.portfolioValue === 0) {
      recommendations.push("Explore our marketplace to make your first investment");
    }

    if (this.context.userLocation) {
      const config = geoService.getRegionalConfig(this.context.userLocation.countryCode);
      if (config.complianceLevel === 'restricted') {
        recommendations.push("Review available assets for your region");
      }
    }

    return recommendations;
  }
}

export const aiConciergeService = new AIConciergeService();
