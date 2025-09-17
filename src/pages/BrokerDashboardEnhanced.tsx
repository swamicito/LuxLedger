"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Copy, 
  ExternalLink, 
  Download,
  Crown,
  Star,
  Award,
  Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { TierSystem, BROKER_TIERS } from "@/lib/luxbroker/tier-system";
import { useWallet } from "@/hooks/use-wallet";

interface BrokerStats {
  total_earnings: number;
  referred_sellers_count: number;
  total_sales_volume: number;
  tier_id: number;
  referral_code: string;
}

interface Commission {
  id: string;
  amount: number;
  sale_amount: number;
  created_at: string;
  seller_wallet: string;
}

interface RecentSale {
  id: string;
  amount: number;
  created_at: string;
  seller_wallet: string;
}

export default function BrokerDashboardEnhanced() {
  const { account, isConnecting, connectWallet } = useWallet();
  const walletAddress = account?.address;
  const [brokerStats, setBrokerStats] = useState<BrokerStats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      registerAndFetchBrokerData();
    }
  }, [walletAddress]);

  const registerAndFetchBrokerData = async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      
      // Auto-register broker & seller for this wallet
      await fetch('/api/broker/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      // Fetch broker profile
      const response = await fetch('/api/broker/me', {
        headers: { 'X-Wallet-Address': walletAddress },
      });
      const data = await response.json();

      if (data.broker) {
        setBrokerStats({
          total_earnings: data.stats?.total_commission_usd || 0,
          referred_sellers_count: data.stats?.active_sellers || 0,
          total_sales_volume: data.stats?.total_sales_usd || 0,
          tier_id: data.broker.tier_id || 1,
          referral_code: data.broker.referral_code
        });

        // Fetch commissions
        const { data: commissionsData } = await supabase
          .from('commissions')
          .select('*')
          .eq('broker_id', data.broker.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (commissionsData) {
          setCommissions(commissionsData.map(c => ({
            id: c.id,
            amount: c.commission_usd || c.amount,
            sale_amount: c.sale_amount_usd,
            created_at: c.created_at,
            seller_wallet: 'Seller'
          })));
        }

        // Fetch recent sales from commissions
        if (commissionsData) {
          setRecentSales(commissionsData.slice(0, 5).map(c => ({
            id: c.id,
            amount: c.sale_amount_usd,
            created_at: c.created_at,
            seller_wallet: 'Seller'
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching broker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentTier = brokerStats ? TierSystem.getTierById(brokerStats.tier_id) || BROKER_TIERS[0] : BROKER_TIERS[0];
  const progress = brokerStats ? TierSystem.getProgressToNextTier(
    currentTier,
    brokerStats.referred_sellers_count,
    brokerStats.total_sales_volume
  ) : null;

  const copyReferralLink = async () => {
    if (!brokerStats) return;
    
    const referralUrl = `${window.location.origin}?ref=${brokerStats.referral_code}`;
    
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const exportToCSV = async () => {
    if (!brokerStats || !commissions.length) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);
    
    try {
      const csvData = [
        ['Date', 'Sale Amount (USD)', 'Commission Amount (USD)', 'Commission Rate', 'Seller', 'Status'],
        ...commissions.map(commission => [
          new Date(commission.created_at).toLocaleDateString(),
          commission.sale_amount_usd.toString(),
          commission.commission_amount_usd.toString(),
          `${(commission.commission_rate * 100).toFixed(1)}%`,
          commission.seller_wallet.slice(0, 8) + '...',
          commission.status
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `luxbroker-earnings-${brokerStats.referral_code}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Earnings exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to access the broker dashboard</p>
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

  if (!brokerStats) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Broker Not Found</h1>
          <p className="text-gray-400">You are not registered as a LuxBroker affiliate yet.</p>
          <Button className="mt-4 bg-yellow-600 hover:bg-yellow-500">
            Apply to Become a Broker
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border-b border-yellow-600/30">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Broker Dashboard
              </h1>
              <p className="text-gray-300">Welcome back, {account.address.slice(0, 8)}...</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                className={`px-4 py-2 text-lg font-semibold`}
                style={{ backgroundColor: currentTier.color + '20', color: currentTier.color }}
              >
                {currentTier.icon} {currentTier.name} Tier
              </Badge>
              
              <Button
                onClick={() => window.open('/broker/leaderboard', '_blank')}
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
              >
                <Award className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${brokerStats.total_earnings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Referrals</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {brokerStats.referred_sellers_count}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sales Volume</p>
                  <p className="text-2xl font-bold text-purple-400">
                    ${brokerStats.total_sales_volume.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Commission Rate</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {(currentTier.commissionRate * 100).toFixed(1)}%
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tier Progress */}
        {progress?.nextTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Progress to {progress.nextTier.name} Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Overall Progress</span>
                      <span className="text-white">{progress.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress.progressPercentage} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Referrals needed: </span>
                      <span className="text-white font-medium">{progress.referralsNeeded}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Sales volume needed: </span>
                      <span className="text-white font-medium">${progress.salesVolumeNeeded.toLocaleString()}</span>
                    </div>
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
            <TabsList className="bg-gray-900 border-gray-800">
              <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="commissions" className="data-[state=active]:bg-yellow-600">
                Commissions
              </TabsTrigger>
              <TabsTrigger value="referrals" className="data-[state=active]:bg-yellow-600">
                Referral Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Recent Sales */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {recentSales.map((sale, index) => (
                        <motion.div
                          key={sale.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold text-white">{sale.item_name}</h4>
                            <p className="text-sm text-gray-400">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-400">
                              ${sale.sale_amount_usd.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {sale.seller_wallet.slice(0, 8)}...
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Commission History</h2>
                <Button
                  onClick={exportToCSV}
                  disabled={exporting || !commissions.length}
                  className="bg-yellow-600 hover:bg-yellow-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Sale Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Commission
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        <AnimatePresence>
                          {commissions.map((commission, index) => (
                            <motion.tr
                              key={commission.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-gray-800/50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(commission.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                ${commission.sale_amount_usd.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                                ${commission.commission_amount_usd.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {(commission.commission_rate * 100).toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  className={
                                    commission.status === 'paid'
                                      ? 'bg-green-600/20 text-green-400'
                                      : 'bg-yellow-600/20 text-yellow-400'
                                  }
                                >
                                  {commission.status}
                                </Badge>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Your Referral Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        value={`${window.location.origin}?ref=${brokerStats.referral_code}`}
                      />
                      <Button
                        onClick={copyReferralLink}
                        className={`px-4 py-2 ${
                          copied ? 'bg-green-600' : 'bg-yellow-600 hover:bg-yellow-500'
                        }`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Referral Code: </span>
                        <span className="text-white font-mono">{brokerStats.referral_code}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Referrals: </span>
                        <span className="text-white font-medium">{brokerStats.referred_sellers_count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
