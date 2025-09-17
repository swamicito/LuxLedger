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
import { ReferralCookieHandler } from '@/components/ReferralCookieHandler';
import { WalletAutoRegister } from '@/components/WalletAutoRegister';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import NotFound from '@/pages/NotFound';
import Navigation from '@/components/Navigation';
import './lib/i18n';
import './App.css';
import './styles/brand.css';

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="/admin" element={<Admin />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </EscrowAuthProvider>
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </Router>
  </QueryClientProvider>
);

export default App;
