"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bug, Search, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

interface DebugResult {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  data?: any;
  timestamp: string;
}

interface ReferralFlow {
  referralCode: string;
  clickId?: string;
  cookieData?: any;
  brokerData?: any;
  sellerData?: any;
  commissionData?: any;
}

export default function ReferralDebugger() {
  const [referralCode, setReferralCode] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [flowData, setFlowData] = useState<ReferralFlow | null>(null);
  const [loading, setLoading] = useState(false);

  const addDebugResult = (step: string, status: 'success' | 'warning' | 'error', message: string, data?: any) => {
    const result: DebugResult = {
      step,
      status,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    setDebugResults(prev => [...prev, result]);
  };

  const debugReferralFlow = async () => {
    if (!referralCode) {
      toast.error('Please enter a referral code');
      return;
    }

    setLoading(true);
    setDebugResults([]);
    setFlowData(null);

    try {
      // Step 1: Validate referral code format
      addDebugResult(
        'Code Format',
        referralCode.match(/^[A-Z0-9]{8}$/) ? 'success' : 'error',
        referralCode.match(/^[A-Z0-9]{8}$/) 
          ? 'Referral code format is valid' 
          : 'Invalid referral code format (should be 8 alphanumeric characters)'
      );

      // Step 2: Check if broker exists
      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .select('*')
        .eq('referral_code', referralCode)
        .single();

      if (brokerError || !broker) {
        addDebugResult('Broker Lookup', 'error', 'Broker not found for this referral code');
        return;
      }

      addDebugResult('Broker Lookup', 'success', `Broker found: ${broker.wallet_address}`, broker);

      // Step 3: Check referral clicks
      const { data: clicks, error: clicksError } = await supabase
        .from('referral_clicks')
        .select('*')
        .eq('referral_code', referralCode)
        .order('created_at', { ascending: false })
        .limit(10);

      if (clicksError) {
        addDebugResult('Click Tracking', 'warning', 'Error fetching click data');
      } else {
        addDebugResult(
          'Click Tracking', 
          clicks.length > 0 ? 'success' : 'warning',
          `Found ${clicks.length} tracked clicks`,
          clicks
        );
      }

      // Step 4: Check sellers attributed to this broker
      const { data: sellers, error: sellersError } = await supabase
        .from('sellers')
        .select('*')
        .eq('referred_by_broker_id', broker.id);

      if (sellersError) {
        addDebugResult('Seller Attribution', 'warning', 'Error fetching seller data');
      } else {
        addDebugResult(
          'Seller Attribution',
          sellers.length > 0 ? 'success' : 'warning',
          `Found ${sellers.length} attributed sellers`,
          sellers
        );
      }

      // Step 5: Check commissions earned
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .eq('broker_id', broker.id)
        .order('created_at', { ascending: false });

      if (commissionsError) {
        addDebugResult('Commission Tracking', 'warning', 'Error fetching commission data');
      } else {
        const totalEarnings = commissions.reduce((sum, c) => sum + c.amount, 0);
        addDebugResult(
          'Commission Tracking',
          commissions.length > 0 ? 'success' : 'warning',
          `Found ${commissions.length} commissions totaling $${totalEarnings.toLocaleString()}`,
          commissions
        );
      }

      // Step 6: Test wallet-specific attribution (if wallet provided)
      if (walletAddress) {
        const { data: specificSeller } = await supabase
          .from('sellers')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        if (specificSeller) {
          const isAttributed = specificSeller.referred_by_broker_id === broker.id;
          addDebugResult(
            'Wallet Attribution',
            isAttributed ? 'success' : 'warning',
            isAttributed 
              ? `Wallet ${walletAddress} is correctly attributed to this broker`
              : `Wallet ${walletAddress} is not attributed to this broker`,
            specificSeller
          );
        } else {
          addDebugResult(
            'Wallet Attribution',
            'warning',
            `Wallet ${walletAddress} not found in sellers table`
          );
        }
      }

      // Set flow data for detailed view
      setFlowData({
        referralCode,
        brokerData: broker,
        sellerData: sellers,
        commissionData: commissions,
      });

    } catch (error) {
      addDebugResult('System Error', 'error', `Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testReferralLink = () => {
    const testUrl = `${window.location.origin}?ref=${referralCode}`;
    window.open(testUrl, '_blank');
    toast.success('Opened test referral link in new tab');
  };

  const copyReferralLink = () => {
    const testUrl = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(testUrl);
    toast.success('Referral link copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-400/50 bg-green-400/10';
      case 'warning':
        return 'border-yellow-400/50 bg-yellow-400/10';
      case 'error':
        return 'border-red-400/50 bg-red-400/10';
      default:
        return 'border-gray-600';
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <Bug className="w-5 h-5" style={{ color: '#D4AF37' }} />
              <div>
                <h1 className="text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                  REFERRAL DEBUGGER
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Debug and test LuxBroker referral flows
                </p>
              </div>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Results</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{debugResults.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Status</p>
                <p className="text-sm font-medium" style={{ 
                  color: debugResults.some(r => r.status === 'error') ? '#EF4444' : 
                         debugResults.some(r => r.status === 'warning') ? '#FBBF24' : 
                         debugResults.length > 0 ? '#22C55E' : '#6B7280' 
                }}>
                  {debugResults.some(r => r.status === 'error') ? 'Errors' : 
                   debugResults.some(r => r.status === 'warning') ? 'Warnings' : 
                   debugResults.length > 0 ? 'Passed' : 'Ready'}
                </p>
              </div>
            </div>
            
            {/* Right: Network */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-sm" style={{ color: '#3B82F6' }}>Testnet</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Debug Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Debug Referral Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Referral Code *
                  </label>
                  <Input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character referral code"
                    className="bg-gray-800 border-gray-700"
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Address (Optional)
                  </label>
                  <Input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={debugReferralFlow}
                  disabled={loading || !referralCode}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Debugging...' : 'Debug Flow'}
                </Button>
                
                {referralCode && (
                  <>
                    <Button
                      onClick={testReferralLink}
                      variant="outline"
                      className="border-gray-600"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Test Link
                    </Button>
                    <Button
                      onClick={copyReferralLink}
                      variant="outline"
                      className="border-gray-600"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Debug Results */}
        {debugResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Debug Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {debugResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <h4 className="font-semibold text-white">{result.step}</h4>
                            <p className="text-gray-300 text-sm">{result.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                          {result.status}
                        </Badge>
                      </div>
                      
                      {result.data && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                            View Data
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-800 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Flow Data Details */}
        {flowData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Tabs defaultValue="broker" className="space-y-6">
              <TabsList className="bg-gray-900 border-gray-800 grid w-full grid-cols-3">
                <TabsTrigger value="broker">Broker Data</TabsTrigger>
                <TabsTrigger value="sellers">Sellers</TabsTrigger>
                <TabsTrigger value="commissions">Commissions</TabsTrigger>
              </TabsList>

              <TabsContent value="broker">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Broker Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(flowData.brokerData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sellers">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Attributed Sellers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(flowData.sellerData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commissions">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Commission History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(flowData.commissionData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Testing Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-purple-600/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Testing Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Common Issues</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Referral code not found - Check broker registration</li>
                    <li>• No clicks tracked - Test referral link generation</li>
                    <li>• Seller not attributed - Check cookie handling</li>
                    <li>• Missing commissions - Verify payment flow</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Test Scenarios</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• New visitor clicks referral link</li>
                    <li>• Returning visitor with existing cookie</li>
                    <li>• Wallet connection after referral</li>
                    <li>• Commission payment on sale completion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
