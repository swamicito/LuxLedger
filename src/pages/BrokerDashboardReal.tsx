"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Wallet,
  TestTube,
  Download
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { supabase } from "@/lib/supabase-client";
import { TierSystem, BROKER_TIERS } from "@/lib/luxbroker/tier-system";
import { toast } from "sonner";
import CrownLottie from "@/components/CrownLottie";
import StatCard from "@/components/StatCard";
import ReferralLinkSet from "@/components/ReferralLinkSet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface BrokerProfile {
  id: string;
  referral_code: string;
  tier_id: number;
  wallet_address: string;
  total_earnings: number;
  referred_sellers_count: number;
  total_sales_volume: number;
}

interface BrokerStats {
  total_sales_usd: number;
  total_commission_usd: number;
  active_sellers: number;
}

interface Commission {
  id: string;
  sale_amount_usd: number;
  commission_usd: number;
  created_at: string;
}

export default function BrokerDashboardReal() {
  const { account, isConnecting, connectWallet } = useWallet();
  const walletAddress = account?.address;
  
  const [broker, setBroker] = useState<BrokerProfile | null>(null);
  const [stats, setStats] = useState<BrokerStats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingSale, setTestingSale] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      registerAndFetchData();
    }
  }, [walletAddress]);

  const registerAndFetchData = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      // Auto-register broker & seller
      await fetch('/netlify/functions/api-broker-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      // Fetch broker data
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (brokerData) {
        setBroker(brokerData);

        // Fetch stats
        const { data: commissionsData } = await supabase
          .from('commissions')
          .select('*')
          .eq('broker_id', brokerData.id)
          .order('created_at', { ascending: false });

        if (commissionsData) {
          setCommissions(commissionsData);
          
          const totalCommission = commissionsData.reduce((sum, c) => sum + (c.commission_usd || 0), 0);
          const totalSales = commissionsData.reduce((sum, c) => sum + (c.sale_amount_usd || 0), 0);
          
          setStats({
            total_commission_usd: totalCommission,
            total_sales_usd: totalSales,
            active_sellers: brokerData.referred_sellers_count || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching broker data:', error);
      toast.error('Failed to load broker data');
    } finally {
      setLoading(false);
    }
  };

  const testSale = async () => {
    if (!walletAddress || !broker) {
      toast.error('Please connect your wallet first');
      return;
    }

    setTestingSale(true);
    try {
      const response = await fetch('/netlify/functions/api-record-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerWallet: walletAddress,
          amountUSD: 1000,
          category: 'cars',
          payMethod: 'crypto',
          brokerReferralCode: broker.referral_code
        }),
      });

      if (response.ok) {
        toast.success('Test sale recorded successfully!');
        registerAndFetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to record test sale');
      }
    } catch (error) {
      console.error('Error recording test sale:', error);
      toast.error('Error recording test sale');
    } finally {
      setTestingSale(false);
    }
  };

  const exportCSV = () => {
    if (!commissions.length) {
      toast.error('No commission data to export');
      return;
    }

    const csvContent = [
      ['Date', 'Sale Amount (USD)', 'Commission (USD)', 'Commission Rate'],
      ...commissions.map(c => [
        new Date(c.created_at).toLocaleDateString(),
        c.sale_amount_usd.toFixed(2),
        c.commission_usd.toFixed(2),
        ((c.commission_usd / c.sale_amount_usd) * 100).toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luxbroker-commissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Commission data exported successfully!');
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <CrownLottie height={80} className="mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">LuxBroker Dashboard</h1>
          <p className="text-gray-400 mb-6">
            Connect your XUMM wallet to access your LuxBroker affiliate dashboard
          </p>
          <Button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8 py-3"
          >
            <Wallet className="w-5 h-5 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect XUMM Wallet'}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Loading your broker dashboard...</p>
        </div>
      </div>
    );
  }

  const currentTier = broker ? TierSystem.getTierById(broker.tier_id) || BROKER_TIERS[0] : BROKER_TIERS[0];
  const nextTier = TierSystem.getNextTier(currentTier);
  const progress = broker && stats ? TierSystem.getProgressToNextTier(
    currentTier,
    stats.active_sellers,
    stats.total_sales_usd
  ) : 0;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                LUXBROKER DASHBOARD
              </h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Affiliate earnings · Referral tracking
              </p>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Earnings</p>
                <p className="text-lg font-semibold" style={{ color: '#22C55E' }}>
                  ${(stats?.total_commission_usd || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Referrals</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{stats?.active_sellers || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Tier</p>
                <span 
                  className="text-sm font-medium px-2 py-0.5 rounded"
                  style={{ backgroundColor: currentTier.color + '20', color: currentTier.color }}
                >
                  {currentTier.icon} {currentTier.name}
                </span>
              </div>
            </div>
            
            {/* Right: Wallet */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-mono" style={{ color: '#22C55E' }}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <StatCard
            title="Total Earnings"
            value={stats?.total_commission_usd || 0}
            format="currency"
            icon={<DollarSign className="w-8 h-8" />}
          />
          <StatCard
            title="Total Sales Volume"
            value={stats?.total_sales_usd || 0}
            format="currency"
            icon={<TrendingUp className="w-8 h-8" />}
          />
          <StatCard
            title="Active Sellers"
            value={stats?.active_sellers || 0}
            icon={<Users className="w-8 h-8" />}
          />
        </motion.div>

        {/* Tier Progress */}
        {nextTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Progress to {nextTier.name}</span>
                  <span className="text-2xl">{nextTier.icon}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{progress.toFixed(1)}% Complete</span>
                    <span>Next: {(nextTier.commissionRate * 100).toFixed(1)}% Commission</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-gray-900 border-gray-800 grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="referrals">Referral Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Commissions */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Recent Commissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {commissions.length > 0 ? (
                      <div className="space-y-3">
                        {commissions.slice(0, 5).map((commission) => (
                          <div key={commission.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-semibold text-green-400">
                                +${commission.commission_usd.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400">
                                Sale: ${commission.sale_amount_usd.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">
                                {new Date(commission.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-8">
                        No commissions yet. Start referring sellers!
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={testSale}
                      disabled={testingSale}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      {testingSale ? 'Recording...' : 'Test Sale ($1,000)'}
                    </Button>
                    
                    <Button
                      onClick={exportCSV}
                      variant="outline"
                      className="w-full border-gray-600"
                      disabled={!commissions.length}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Commission Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="commissions">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Commission History</CardTitle>
                  <Button
                    onClick={exportCSV}
                    variant="outline"
                    size="sm"
                    disabled={!commissions.length}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {commissions.length > 0 ? (
                    <div className="space-y-2">
                      {commissions.map((commission) => (
                        <div key={commission.id} className="flex justify-between items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                          <div>
                            <p className="font-semibold text-white">
                              ${commission.sale_amount_usd.toLocaleString()} Sale
                            </p>
                            <p className="text-sm text-gray-400">
                              {new Date(commission.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-400">
                              +${commission.commission_usd.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {((commission.commission_usd / commission.sale_amount_usd) * 100).toFixed(2)}% rate
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No commission history yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Start referring sellers to earn commissions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals">
              <div className="space-y-6">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Your Referral Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {broker ? (
                      <ReferralLinkSet referralCode={broker.referral_code} />
                    ) : (
                      <p className="text-gray-400">Loading referral links...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
