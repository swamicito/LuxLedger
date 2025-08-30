import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WalletProvider } from '@/hooks/use-wallet';
import { AuthProvider } from '@/hooks/use-auth';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Marketplace from '@/pages/Marketplace';
import AssetDetail from '@/pages/AssetDetail';
import Portfolio from '@/pages/Portfolio';
import Trading from '@/pages/Trading';
import Auth from '@/pages/Auth';
import Admin from '@/pages/Admin';
import Pay from '@/pages/Pay';
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
            <Navigation />
            <Toaster />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/pay" element={<Pay />} />
              <Route path="/asset/:id" element={<AssetDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </Router>
  </QueryClientProvider>
);

export default App;
