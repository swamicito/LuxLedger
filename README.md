# LuxLedger - XRPL Luxury Asset Marketplace

**LuxLedger** is a production-ready Web3 luxury asset marketplace powered by the XRP Ledger (XRPL). It enables tokenization, trading, and instant settlement of high-value luxury assets including real estate, jewelry, exotic cars, watches, and fine art.

## 🌟 Features

### Core Functionality
- **Tokenized Luxury Assets**: Real estate as fungible tokens, luxury items as NFTs
- **XRPL Integration**: Native XRP Ledger support with instant settlement
- **XUMM Wallet**: Seamless wallet connection and transaction signing
- **Atomic Transactions**: Secure, instant asset transfers with payment settlement
- **Admin Panel**: Complete asset management and marketplace administration

### Asset Types
- **Real Estate**: Fungible tokens representing property shares
- **Jewelry**: Unique NFTs for precious jewelry pieces
- **Exotic Cars**: NFTs for luxury and exotic vehicles
- **Watches**: NFTs for high-end timepieces
- **Fine Art**: NFTs for artwork and collectibles

### Technical Features
- **Responsive Design**: Mobile-first UI with TailwindCSS
- **Real-time Updates**: Live transaction status and portfolio updates
- **Email Notifications**: Transaction confirmations and asset alerts
- **Serverless API**: Netlify Functions for XRPL operations
- **Database Integration**: Supabase for user data and asset metadata

## 🛠 Tech Stack

### Frontend
- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **ShadCN/UI** - Component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching

### Backend & Blockchain
- **XRPL.js** - XRP Ledger integration
- **XUMM SDK** - Wallet connectivity
- **Netlify Functions** - Serverless API
- **Supabase** - Database and authentication
- **Resend** - Email service

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Vite** - Fast development and building

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lux-xrpl-vault

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# XUMM Configuration
VITE_XUMM_API_KEY=your_xumm_api_key
VITE_XUMM_API_SECRET=your_xumm_api_secret

# XRPL Network (testnet/mainnet)
VITE_XRPL_NETWORK=testnet

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service
VITE_RESEND_API_KEY=your_resend_api_key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:3000`

## 📱 Usage

### For Users
1. **Connect Wallet**: Use XUMM wallet to connect and authenticate
2. **Browse Assets**: Explore luxury assets in the marketplace
3. **Purchase Assets**: Buy tokenized assets with XRP
4. **Manage Portfolio**: View your holdings and transaction history
5. **Trade Assets**: List and trade your asset tokens

### For Administrators
1. **Access Admin Panel**: Navigate to `/admin` (requires admin role)
2. **Create Assets**: Add new luxury assets to the marketplace
3. **Manage Listings**: View and manage all asset listings
4. **Monitor Transactions**: Track all marketplace activity

## 🔧 API Endpoints

### Serverless Functions (Netlify)

- `POST /api/mint-asset-token` - Create new asset tokens
- `POST /api/execute-purchase` - Process asset purchases
- `GET /api/get-asset-metadata` - Retrieve asset information
- `GET /api/verify-transaction` - Verify XRPL transactions
- `GET /api/get-user-portfolio` - Get user portfolio data

### Example API Usage

```javascript
// Purchase an asset
const response = await fetch('/api/execute-purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    assetId: 'asset-uuid',
    buyerAddress: 'rBuyerAddress...',
    amount: '100',
    price: '50000',
    assetType: 'nft'
  })
});
```

## 🏗 Architecture

### Frontend Structure
```
src/
├── components/ui/          # ShadCN UI components
├── hooks/                  # React hooks
│   ├── use-wallet.tsx     # XUMM wallet integration
│   ├── use-auth.tsx       # Authentication
│   └── use-*.tsx          # Other hooks
├── lib/                   # Core libraries
│   ├── xrpl-client.ts     # XRPL integration
│   ├── asset-manager.ts   # Asset management
│   ├── settlement-engine.ts # Transaction processing
│   └── email-service.ts   # Email notifications
├── pages/                 # Route components
└── integrations/          # External service integrations
```

### Database Schema (Supabase)

Key tables:
- `assets` - Asset metadata and information
- `transactions` - Transaction history
- `profiles` - User profiles and wallet addresses
- `asset_orders` - Buy/sell orders
- `user_roles` - User permissions

## 🔐 Security

- **Wallet Security**: Private keys never leave user's XUMM wallet
- **Transaction Verification**: All transactions verified on XRPL
- **Role-Based Access**: Admin functions protected by user roles
- **Input Validation**: All user inputs validated and sanitized
- **HTTPS Only**: All communications encrypted

## 🚀 Deployment

### Netlify Deployment

1. **Build Configuration**: Already configured in `netlify.toml`
2. **Environment Variables**: Set in Netlify dashboard
3. **Functions**: Automatically deployed from `netlify/functions/`

```bash
# Deploy to Netlify
npm run build
# Upload dist/ folder to Netlify
```

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy dist/ folder to your hosting provider
```

## 🧪 Testing

### Development Testing
- Demo mode automatically enabled in development
- Mock wallet and transactions for testing
- Sample data for UI development

### Production Testing
- Connect to XRPL testnet for staging
- Use real XUMM wallet for integration testing
- Verify all transactions on testnet before mainnet

## 📊 Monitoring

### Transaction Monitoring
- All transactions logged in Supabase
- Email notifications for important events
- Admin dashboard for oversight

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Automatic retry for failed transactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Advanced trading features (limit orders, auctions)
- [ ] Mobile app development
- [ ] Institutional investor tools
- [ ] DeFi integrations

## ⚡ Performance Guardrails

This application is designed to handle millions of listings. Follow these rules to maintain performance:

### Data Fetching Rules
1. **Never load full lists** - All queries MUST use `.limit()` or `.range()` with a maximum of 60 items
2. **Always select only needed columns** - Avoid `SELECT *`; specify columns explicitly
3. **Avoid client-side filtering at scale** - Push filters to the database via query parameters
4. **Use cursor-based pagination** for infinite scroll scenarios (see `use-cursor-pagination.ts`)

### Pagination Constants
```typescript
import { DEFAULT_LIMIT, MAX_LIMIT, safeLimit } from '@/hooks/use-pagination';

// DEFAULT_LIMIT = 24 (default page size)
// MAX_LIMIT = 60 (hard cap, never exceed)
```

### Query Pattern
```typescript
// ✅ Good - bounded query with specific columns
const { data } = await supabase
  .from('assets')
  .select('id, title, images, estimated_value, status, created_at')
  .eq('status', 'live')
  .order('created_at', { ascending: false })
  .range(0, 23);

// ❌ Bad - unbounded query with SELECT *
const { data } = await supabase
  .from('assets')
  .select('*');
```

### List Components
- Use `LoadingMoreIndicator` and `EndOfListIndicator` from `@/components/ui/skeleton-loaders`
- Use stable keys (item IDs, not array indices)
- Memoize heavy card components with `React.memo()`

---

**LuxLedger** - Redefining luxury asset ownership through blockchain technology.
