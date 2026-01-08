import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EscrowAuthProvider } from '@/hooks/use-escrow-auth';
import { AuthProvider } from '@/hooks/use-auth';
import { WalletProvider } from '@/hooks/use-wallet';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Marketplace from '@/pages/Marketplace';
import AssetDetail from '@/pages/AssetDetail';
import Portfolio from '@/pages/Portfolio';
import Trading from '@/pages/Trading';
import Auth from '@/pages/Auth';
import Admin from '@/pages/Admin';
import Pay from '@/pages/Pay';
import Subscription from '@/pages/Subscription';
import AssetPurchase from '@/pages/AssetPurchase';
import Escrow from '@/pages/Escrow';
import EscrowDashboard from '@/pages/EscrowDashboard';
import { BrokerDashboard } from '@/pages/BrokerDashboard';
import BrokerLeaderboard from '@/pages/BrokerLeaderboard';
import ReferralDebugger from '@/pages/ReferralDebugger';
import MarketplacePage from '@/pages/MarketplacePage';
import BrokerDashboardReal from '@/pages/BrokerDashboardReal';
import ReferralLanding from '@/pages/ReferralLanding';
import ListAsset from '@/pages/ListAsset';
import Settings from '@/pages/Settings';
import Activity from '@/pages/Activity';
import MyListings from '@/pages/MyListings';
import Notifications from '@/pages/Notifications';
import TransactionDetail from '@/pages/TransactionDetail';
import Help from '@/pages/Help';
import UserProfile from '@/pages/UserProfile';
import Account from '@/pages/Account';
import { ReferralCookieHandler } from '@/components/ReferralCookieHandler';
import { WalletAutoRegister } from '@/components/WalletAutoRegister';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Contact from '@/pages/Contact';
import DisputeCenter from '@/pages/DisputeCenter';
import ShippingHelp from '@/pages/ShippingHelp';
import TrustSecurity from '@/pages/TrustSecurity';
import NotFound from '@/pages/NotFound';
import Navigation from '@/components/Navigation';
import { ErrorBoundary } from '@/components/error-boundary';
import './lib/i18n';
import './App.css';
import './styles/brand.css';

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <QueryClientProvider client={queryClient}>
      <Router>
        <TooltipProvider>
          <AuthProvider>
            <WalletProvider>
              <EscrowAuthProvider>
                <ReferralCookieHandler />
                <WalletAutoRegister />
                <Navigation />
                <Toaster />
                <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/pay" element={<Pay />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/escrow" element={<Escrow />} />
              <Route path="/escrow/dashboard" element={<EscrowDashboard />} />
              <Route path="/broker" element={<BrokerDashboardReal />} />
              <Route path="/broker/leaderboard" element={<BrokerLeaderboard />} />
              <Route path="/broker/debugger" element={<ReferralDebugger />} />
              <Route path="/ref/:code" element={<ReferralLanding />} />
              <Route path="/asset/:id" element={<AssetDetail />} />
              <Route path="/purchase/:id" element={<AssetPurchase />} />
              <Route path="/list-asset" element={<ListAsset />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/activity/:id" element={<TransactionDetail />} />
              <Route path="/help" element={<Help />} />
              <Route path="/u/:username" element={<UserProfile />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/disputes" element={<DisputeCenter />} />
              <Route path="/help/shipping" element={<ShippingHelp />} />
              <Route path="/trust" element={<TrustSecurity />} />
              <Route path="/security" element={<TrustSecurity />} />
              <Route path="*" element={<NotFound />} />
                </Routes>
              </EscrowAuthProvider>
            </WalletProvider>
          </AuthProvider>
        </TooltipProvider>
      </Router>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
