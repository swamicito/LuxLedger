"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, Users, DollarSign, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { TierSystem, BROKER_TIERS } from "@/lib/luxbroker/tier-system";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardBroker {
  id: string;
  wallet_address: string;
  referral_code: string;
  tier_id: number;
  total_earnings: number;
  referred_sellers_count: number;
  total_sales_volume: number;
  created_at: string;
  rank?: number;
}

export default function BrokerLeaderboard() {
  const [topEarners, setTopEarners] = useState<LeaderboardBroker[]>([]);
  const [topReferrers, setTopReferrers] = useState<LeaderboardBroker[]>([]);
  const [topVolume, setTopVolume] = useState<LeaderboardBroker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch top earners
      const { data: earners } = await supabase
        .from('brokers')
        .select('*')
        .order('total_earnings', { ascending: false })
        .limit(10);

      // Fetch top referrers
      const { data: referrers } = await supabase
        .from('brokers')
        .select('*')
        .order('referred_sellers_count', { ascending: false })
        .limit(10);

      // Fetch top volume
      const { data: volume } = await supabase
        .from('brokers')
        .select('*')
        .order('total_sales_volume', { ascending: false })
        .limit(10);

      // Add rankings
      const addRankings = (brokers: LeaderboardBroker[]) =>
        brokers?.map((broker, index) => ({ ...broker, rank: index + 1 })) || [];

      setTopEarners(addRankings(earners || []));
      setTopReferrers(addRankings(referrers || []));
      setTopVolume(addRankings(volume || []));
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700';
      default:
        return 'bg-gray-700';
    }
  };

  const LeaderboardCard = ({ 
    broker, 
    metric, 
    formatValue 
  }: { 
    broker: LeaderboardBroker; 
    metric: keyof LeaderboardBroker;
    formatValue: (value: any) => string;
  }) => {
    const tier = TierSystem.getTierById(broker.tier_id) || BROKER_TIERS[0];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: (broker.rank! - 1) * 0.1 }}
        className={`relative overflow-hidden rounded-xl border ${
          broker.rank === 1 ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10' :
          broker.rank === 2 ? 'border-gray-400/50 bg-gradient-to-r from-gray-400/10 to-gray-600/10' :
          broker.rank === 3 ? 'border-amber-600/50 bg-gradient-to-r from-amber-500/10 to-amber-700/10' :
          'border-gray-800 bg-gray-900'
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getRankIcon(broker.rank!)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-400">
                    {broker.wallet_address.slice(0, 8)}...{broker.wallet_address.slice(-6)}
                  </span>
                  <Badge
                    className="text-xs"
                    style={{ backgroundColor: tier.color + '20', color: tier.color }}
                  >
                    {tier.icon} {tier.name}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Code: {broker.referral_code}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {formatValue(broker[metric])}
              </p>
              <p className="text-xs text-gray-400">
                Joined {new Date(broker.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <p className="text-xs text-gray-400">Earnings</p>
              <p className="text-sm font-semibold text-green-400">
                ${broker.total_earnings.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Referrals</p>
              <p className="text-sm font-semibold text-blue-400">
                {broker.referred_sellers_count}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Volume</p>
              <p className="text-sm font-semibold text-purple-400">
                ${(broker.total_sales_volume / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </CardContent>

        {/* Rank Badge */}
        <div className={`absolute top-4 right-4 w-8 h-8 rounded-full ${getRankBadgeColor(broker.rank!)} flex items-center justify-center`}>
          <span className="text-xs font-bold text-white">#{broker.rank}</span>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0B0B0C' }}>
      {/* Institutional Header */}
      <div className="border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)', backgroundColor: '#0E0E10' }}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Title */}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-medium tracking-wide" style={{ color: '#D4AF37' }}>
                BROKER LEADERBOARD
              </h1>
              <p className="text-xs sm:text-sm hidden sm:block" style={{ color: '#6B7280' }}>
                Top performing LuxBroker affiliates
              </p>
            </div>
            
            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Top Earners</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>{topEarners.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>Total Volume</p>
                <p className="text-lg font-semibold" style={{ color: '#F5F5F7' }}>
                  ${(topVolume.reduce((sum, b) => sum + b.total_sales_volume, 0) / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
            
            {/* Right: Status */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm" style={{ color: '#22C55E' }}>Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Tier Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Broker Tiers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {BROKER_TIERS.map((tier) => (
                  <div key={tier.id} className="text-center">
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto mb-1.5 sm:mb-2 flex items-center justify-center text-xl sm:text-2xl"
                      style={{ backgroundColor: tier.color + '20' }}
                    >
                      {tier.icon}
                    </div>
                    <p className="font-semibold text-sm sm:text-base" style={{ color: tier.color }}>
                      {tier.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {(tier.commissionRate * 100).toFixed(1)}% commission
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leaderboard Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Tabs defaultValue="earnings" className="space-y-6">
            <TabsList className="bg-gray-900 border-gray-800 grid w-full grid-cols-3 h-auto">
              <TabsTrigger 
                value="earnings" 
                className="data-[state=active]:bg-yellow-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Top </span>Earners
              </TabsTrigger>
              <TabsTrigger 
                value="referrals" 
                className="data-[state=active]:bg-yellow-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Referrals
              </TabsTrigger>
              <TabsTrigger 
                value="volume" 
                className="data-[state=active]:bg-yellow-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                Volume
              </TabsTrigger>
            </TabsList>

            <TabsContent value="earnings" className="space-y-4">
              <div className="grid gap-4">
                {topEarners.map((broker) => (
                  <LeaderboardCard
                    key={broker.id}
                    broker={broker}
                    metric="total_earnings"
                    formatValue={(value) => `$${value.toLocaleString()}`}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-4">
              <div className="grid gap-4">
                {topReferrers.map((broker) => (
                  <LeaderboardCard
                    key={broker.id}
                    broker={broker}
                    metric="referred_sellers_count"
                    formatValue={(value) => `${value} referrals`}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="volume" className="space-y-4">
              <div className="grid gap-4">
                {topVolume.map((broker) => (
                  <LeaderboardCard
                    key={broker.id}
                    broker={broker}
                    metric="total_sales_volume"
                    formatValue={(value) => `$${value.toLocaleString()}`}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Competition Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-yellow-600/10 to-yellow-400/10 border-yellow-600/30">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Monthly Competition</h3>
              <p className="text-gray-300 mb-4">
                Top 3 brokers each month win exclusive luxury rewards and bonuses
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🥇</div>
                  <p className="font-semibold text-yellow-400">1st Place</p>
                  <p className="text-sm text-gray-400">$5,000 bonus + luxury watch</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🥈</div>
                  <p className="font-semibold text-gray-400">2nd Place</p>
                  <p className="text-sm text-gray-400">$2,500 bonus + jewelry</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🥉</div>
                  <p className="font-semibold text-amber-600">3rd Place</p>
                  <p className="text-sm text-gray-400">$1,000 bonus + accessories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
