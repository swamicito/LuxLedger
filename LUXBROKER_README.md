# 🏆 LuxBroker Affiliate System

**World-class affiliate program for LuxLedger luxury asset marketplace**

LuxBroker is a comprehensive, on-chain affiliate system that enables rapid user growth through automated commission splits, real-time tracking, and gamified rewards.

## 🚀 Features

### Core Functionality
- **🎯 Smart Referral Tracking** - Cookie-based attribution with 90-day lock periods
- **💰 Automated Commissions** - XRPL-powered instant payouts (10-20% rates)
- **📊 Real-time Analytics** - Live earnings, conversion rates, and performance metrics
- **🏅 Tier System** - Bronze/Silver/Gold/Diamond with escalating rewards
- **🔗 Multiple Link Types** - Listing, marketplace, and social-friendly short URLs

### Technical Architecture
- **Database**: Supabase with RLS security
- **Blockchain**: XRPL for commission payments
- **Frontend**: React with Framer Motion animations
- **Backend**: Netlify Functions
- **Tracking**: Cookie-based with pixel tracking

## 📁 File Structure

```
src/
├── lib/
│   ├── supabase-client.ts           # Database client & services
│   └── luxbroker/
│       ├── referral-generator.ts    # Referral code generation
│       └── xrpl-commission.ts       # Commission payment logic
├── hooks/
│   └── use-luxbroker.tsx           # React hook for broker operations
├── pages/
│   └── BrokerDashboard.tsx         # Main affiliate dashboard
└── middleware.ts                   # Referral tracking middleware

netlify/functions/
├── broker-register.ts              # Broker registration API
├── seller-register.ts              # Seller registration with attribution
├── track-referral.ts               # Referral click tracking
└── commission-payout.ts            # Automated commission payments

supabase/migrations/
└── 20250901_luxbroker_schema.sql   # Database schema
```

## 🛠 Setup Instructions

### 1. Database Setup
```bash
# Deploy Supabase migration
supabase db push

# Or manually run the migration file
psql -f supabase/migrations/20250901_luxbroker_schema.sql
```

### 2. Environment Variables
```bash
# Add to .env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
XRPL_RPC_URL=wss://s.altnet.rippletest.net:51233
XRPL_ESCROW_SEED=your_escrow_wallet_seed
XRPL_PLATFORM_WALLET=your_platform_wallet_address
NEXT_PUBLIC_APP_URL=https://luxledger.app
```

### 3. Install Dependencies
```bash
npm install nanoid @supabase/supabase-js
```

## 🎯 Usage Guide

### For Brokers (Affiliates)

1. **Registration**
   ```typescript
   const { registerAsBroker } = useLuxBroker();
   await registerAsBroker('email@example.com', 'Broker Name');
   ```

2. **Get Referral Links**
   ```typescript
   const urlBuilder = new ReferralURLBuilder();
   const listingURL = urlBuilder.buildListingURL(referralCode);
   const marketplaceURL = urlBuilder.buildMarketplaceURL(referralCode);
   const shortURL = urlBuilder.buildShortURL(referralCode);
   ```

3. **Track Performance**
   - Visit `/broker` dashboard
   - View real-time earnings and analytics
   - Monitor conversion rates and tier progress

### For Sellers

1. **Registration with Attribution**
   ```typescript
   const { registerAsSeller } = useLuxBroker();
   await registerAsSeller(); // Automatically detects referral cookie
   ```

2. **Referral Lock Period**
   - 90-day attribution lock
   - Prevents referral switching
   - Ensures fair commission tracking

### For Developers

1. **Commission Payout Integration**
   ```typescript
   // When a sale completes
   const response = await fetch('/.netlify/functions/commission-payout', {
     method: 'POST',
     body: JSON.stringify({
       saleAmountUSD: 1000,
       sellerWallet: 'rSeller...',
       buyerWallet: 'rBuyer...',
       buyerWalletSeed: 'buyer_seed',
       saleId: 'sale_123',
       brokerReferralCode: 'luxgold123'
     })
   });
   ```

2. **Referral Tracking**
   ```typescript
   const { trackReferralClick } = useLuxBroker();
   trackReferralClick(referralCode); // Tracks via pixel
   ```

## 💎 Tier System

| Tier | Sales Volume | Commission Rate | Benefits |
|------|-------------|----------------|----------|
| 🥉 Bronze | $0+ | 10% | Basic dashboard, referral links |
| 🥈 Silver | $10K+ | 12% | Enhanced analytics, priority support |
| 🥇 Gold | $50K+ | 15% | Custom domain, exclusive events |
| 💎 Diamond | $250K+ | 20% | VIP status, personal account manager |

## 🔄 Commission Flow

1. **Buyer purchases item** → Triggers commission calculation
2. **System calculates split** → Seller (85%), Broker (10%), Platform (5%)
3. **XRPL payments execute** → Automatic multi-payment transaction
4. **Database updates** → Commission records and broker stats
5. **Real-time dashboard** → Instant earnings reflection

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **Wallet-based authentication** for API access
- **XRPL address validation** for all transactions
- **Anti-fraud measures** including IP tracking
- **Referral lock periods** to prevent gaming

## 📊 Database Schema

### Core Tables
- `brokers` - Affiliate partner information
- `sellers` - Seller accounts with referral attribution
- `commissions` - Commission payment records
- `referral_clicks` - Click tracking and analytics
- `broker_tiers` - Tier configuration and benefits

### Key Relationships
- Sellers → Brokers (via referral_code)
- Commissions → Brokers + Sellers
- Referral Clicks → Brokers

## 🚦 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/broker-register` | POST | Register new affiliate broker |
| `/seller-register` | POST | Register seller with attribution |
| `/track-referral` | GET/POST | Track clicks and conversions |
| `/commission-payout` | POST | Execute commission payments |

## 🎨 UI Components

### BrokerDashboard
- Real-time earnings display
- Tier badge with benefits
- Referral link management
- Commission history
- Performance analytics

### Integration Points
- Navigation menu (`/broker` link)
- Marketplace referral tracking
- Seller onboarding flow
- Purchase completion hooks

## 🔧 Customization

### Referral Code Generation
```typescript
// Custom memorable codes
ReferralCodeGenerator.generate({
  type: 'memorable', // 'random', 'custom'
  prefix: 'LUX'
});

// Tier-specific codes
ReferralCodeGenerator.generateTieredCode('gold');
```

### Commission Rates
Modify `broker_tiers` table or update in Supabase dashboard.

### URL Patterns
Customize in `ReferralURLBuilder` class for different domains or paths.

## 📈 Analytics & Reporting

- **Conversion Tracking** - Click-to-sale attribution
- **Performance Metrics** - Revenue, volume, rates
- **Tier Progression** - Automatic upgrades based on volume
- **Real-time Updates** - Live dashboard with WebSocket support

## 🚀 Deployment

1. **Deploy Functions** - Netlify automatically deploys `/functions`
2. **Database Migration** - Run Supabase migration
3. **Environment Setup** - Configure all required env vars
4. **DNS Configuration** - Set up custom domains if needed

## 🛡 Production Considerations

- **Rate Limiting** - Implement on API endpoints
- **Monitoring** - Set up alerts for failed payments
- **Backup Strategy** - Regular database backups
- **Security Audits** - Regular smart contract reviews
- **Compliance** - Ensure regulatory compliance for affiliate programs

## 📞 Support

For technical support or feature requests:
- Check the `/broker` dashboard for real-time status
- Review commission payment logs in Supabase
- Monitor XRPL transaction status
- Contact support with wallet address for account issues

---

**Built with ❤️ for the LuxLedger ecosystem**
