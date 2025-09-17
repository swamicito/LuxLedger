/**
 * LuxBroker Dashboard - World-class affiliate dashboard
 * Real-time earnings, analytics, and referral management
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/use-auth';
import { useWallet } from '../hooks/use-wallet';
import { brokerService, commissionService, Database } from '../lib/supabase-client';
import { ReferralURLBuilder } from '../lib/luxbroker/referral-generator';
import { toast } from 'sonner';

// Types
type Broker = Database['public']['Tables']['brokers']['Row'];
type Commission = Database['public']['Tables']['commissions']['Row'];
type BrokerAnalytics = Database['public']['Views']['broker_analytics']['Row'];

interface TierBadgeProps {
  tier: string;
  benefits: any;
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier, benefits }) => {
  const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-400 to-gray-600', 
    gold: 'from-yellow-400 to-yellow-600',
    diamond: 'from-blue-400 to-purple-600'
  };

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${tierColors[tier as keyof typeof tierColors]} text-white font-semibold`}>
      <span className="mr-2">{benefits?.badge || '🥉'}</span>
      <span className="capitalize">{tier}</span>
    </div>
  );
};

export const BrokerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { account, isConnecting } = useWallet();
  const isConnected = !!account;
  
  const [broker, setBroker] = useState<Broker | null>(null);
  const [analytics, setAnalytics] = useState<BrokerAnalytics | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const urlBuilder = new ReferralURLBuilder();

  // Load broker data
  useEffect(() => {
    if (account?.address) {
      loadBrokerData();
    }
  }, [account?.address]);

  const loadBrokerData = async () => {
    if (!account?.address) return;

    try {
      setLoading(true);

      // Get broker info
      const { data: brokerData, error: brokerError } = await brokerService.getByWallet(account.address);
      
      if (brokerError && brokerError.message.includes('No rows')) {
        // Broker not registered yet
        setBroker(null);
        setLoading(false);
        return;
      }

      if (brokerError) {
        throw brokerError;
      }

      setBroker(brokerData);

      // Get analytics
      const { data: analyticsData } = await brokerService.getAnalytics(account.address);
      setAnalytics(analyticsData);

      // Get commissions
      const { data: commissionsData } = await commissionService.getForBroker(account.address);
      setCommissions(commissionsData || []);

    } catch (error) {
      console.error('Error loading broker data:', error);
      toast.error('Failed to load broker data');
    } finally {
      setLoading(false);
    }
  };

  const registerAsBroker = async () => {
    if (!account?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setRegistering(true);

      const response = await fetch('/.netlify/functions/broker-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.address,
          email: user?.email,
          name: user?.user_metadata?.full_name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success('Successfully registered as LuxBroker affiliate!');
      await loadBrokerData();

    } catch (error) {
      console.error('Registration error:', error);
      toast.error((error as Error).message);
    } finally {
      setRegistering(false);
    }
  };

  const copyReferralUrl = async (type: 'listing' | 'marketplace' | 'short') => {
    if (!broker) return;

    let url: string;
    switch (type) {
      case 'listing':
        url = urlBuilder.buildListingURL(broker.referral_code);
        break;
      case 'marketplace':
        url = urlBuilder.buildMarketplaceURL(broker.referral_code);
        break;
      case 'short':
        url = urlBuilder.buildShortURL(broker.referral_code);
        break;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(type);
      toast.success('Referral URL copied to clipboard!');
      
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">LuxBroker Dashboard</h1>
          <p className="text-gray-400 mb-8">Connect your wallet to access your affiliate dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  // Registration screen
  if (!broker) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="mb-8">
              <img src="/brand/crown-gradient.svg" alt="LuxBroker" className="w-16 h-16 mx-auto mb-6" />
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Join LuxBroker
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Become a luxury asset affiliate and earn up to 20% commission on every sale
              </p>
            </div>

            <div className="bg-gray-900 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-6">Affiliate Benefits</h2>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 text-xl">💰</span>
                  <div>
                    <h3 className="font-semibold">High Commissions</h3>
                    <p className="text-gray-400 text-sm">Earn 10-20% on luxury asset sales</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 text-xl">📊</span>
                  <div>
                    <h3 className="font-semibold">Real-time Analytics</h3>
                    <p className="text-gray-400 text-sm">Track clicks, conversions, and earnings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 text-xl">🎯</span>
                  <div>
                    <h3 className="font-semibold">Tier Rewards</h3>
                    <p className="text-gray-400 text-sm">Unlock higher rates with performance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 text-xl">⚡</span>
                  <div>
                    <h3 className="font-semibold">Instant Payouts</h3>
                    <p className="text-gray-400 text-sm">XRPL-powered automatic payments</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={registerAsBroker}
              disabled={registering}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold px-8 py-4 rounded-xl hover:from-yellow-300 hover:to-yellow-500 transition-all duration-200 disabled:opacity-50"
            >
              {registering ? 'Registering...' : 'Become a LuxBroker Affiliate'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">LuxBroker Dashboard</h1>
              <p className="text-gray-400">Welcome back, {broker.name || 'Affiliate'}</p>
            </div>
            <TierBadge tier={broker.tier} benefits={analytics?.benefits} />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Earnings</span>
                <span className="text-green-400">💰</span>
              </div>
              <div className="text-2xl font-bold">${broker.total_commissions_earned.toLocaleString()}</div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Sales Volume</span>
                <span className="text-blue-400">📈</span>
              </div>
              <div className="text-2xl font-bold">${broker.total_sales_volume.toLocaleString()}</div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Referrals</span>
                <span className="text-purple-400">👥</span>
              </div>
              <div className="text-2xl font-bold">{broker.referred_sellers_count}</div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Conversion Rate</span>
                <span className="text-yellow-400">🎯</span>
              </div>
              <div className="text-2xl font-bold">{analytics?.conversion_rate || 0}%</div>
            </div>
          </div>
        </motion.div>

        {/* Referral Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Your Referral Links</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium">Listing Page</h3>
                <p className="text-sm text-gray-400">Direct sellers to list their luxury items</p>
              </div>
              <button
                onClick={() => copyReferralUrl('listing')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  copiedUrl === 'listing' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                }`}
              >
                {copiedUrl === 'listing' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium">Marketplace</h3>
                <p className="text-sm text-gray-400">Send buyers to browse luxury items</p>
              </div>
              <button
                onClick={() => copyReferralUrl('marketplace')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  copiedUrl === 'marketplace' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                }`}
              >
                {copiedUrl === 'marketplace' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium">Short URL</h3>
                <p className="text-sm text-gray-400">Perfect for social media sharing</p>
              </div>
              <button
                onClick={() => copyReferralUrl('short')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  copiedUrl === 'short' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                }`}
              >
                {copiedUrl === 'short' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Commissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Commissions</h2>
          {commissions.length > 0 ? (
            <div className="space-y-4">
              {commissions.slice(0, 10).map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">${commission.commission_amount_usd.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">
                      Sale: ${commission.sale_amount_usd.toLocaleString()} • {commission.commission_rate * 100}% rate
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      commission.status === 'paid' ? 'bg-green-900 text-green-300' :
                      commission.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                      {commission.status}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(commission.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No commissions yet. Start sharing your referral links!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
