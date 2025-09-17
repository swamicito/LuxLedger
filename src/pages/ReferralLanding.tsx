"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Users, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase-client";
import CrownLottie from "@/components/CrownLottie";

interface BrokerInfo {
  referral_code: string;
  tier_id: number;
  total_earnings: number;
  referred_sellers_count: number;
}

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [broker, setBroker] = useState<BrokerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cookieSet, setCookieSet] = useState(false);

  useEffect(() => {
    if (code) {
      setReferralCookie();
      fetchBrokerInfo();
    }
  }, [code]);

  const setReferralCookie = () => {
    // Set referral cookies
    const expires7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expires90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    
    document.cookie = `lux_ref_7=${code}; expires=${expires7Days.toUTCString()}; path=/`;
    document.cookie = `lux_ref=${code}; expires=${expires90Days.toUTCString()}; path=/`;
    
    setCookieSet(true);
  };

  const fetchBrokerInfo = async () => {
    if (!code) return;
    
    try {
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('referral_code, tier_id, total_earnings, referred_sellers_count')
        .eq('referral_code', code)
        .single();

      if (brokerData) {
        setBroker(brokerData);
      }
    } catch (error) {
      console.error('Error fetching broker info:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToMarketplace = () => {
    navigate('/marketplace');
  };

  const goToSignup = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Loading referral information...</p>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Invalid Referral Code</h1>
          <p className="text-gray-400 mb-6">
            The referral code "{code}" is not valid or has expired.
          </p>
          <Button onClick={() => navigate('/')} className="bg-yellow-600 hover:bg-yellow-700">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border-b border-yellow-600/30">
        <div className="container mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <CrownLottie height={80} className="mx-auto mb-6" />
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Welcome to LuxLedger
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              You've been invited to experience luxury asset trading
            </p>

            {cookieSet && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-green-600/20 border border-green-600/50 rounded-full px-4 py-2 mb-8"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Referral tracking activated</span>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={goToMarketplace}
                size="lg"
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8 py-4 text-lg"
              >
                Explore Marketplace
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                onClick={goToSignup}
                variant="outline"
                size="lg"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10 px-8 py-4 text-lg"
              >
                Create Account
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Referral Info */}
      <div className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-gray-900 border-gray-800 mb-12">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Referred by Broker {broker.referral_code}
                </h2>
                <p className="text-gray-400">
                  This broker has helped {broker.referred_sellers_count} sellers and earned ${broker.total_earnings.toLocaleString()} in commissions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gray-800 rounded-lg">
                  <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Expert Guidance</h3>
                  <p className="text-gray-400 text-sm">
                    Get personalized support from an experienced luxury asset broker
                  </p>
                </div>

                <div className="text-center p-6 bg-gray-800 rounded-lg">
                  <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Better Deals</h3>
                  <p className="text-gray-400 text-sm">
                    Access exclusive listings and negotiated pricing on premium assets
                  </p>
                </div>

                <div className="text-center p-6 bg-gray-800 rounded-lg">
                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">VIP Treatment</h3>
                  <p className="text-gray-400 text-sm">
                    Enjoy priority support and white-glove service throughout your journey
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">Why Choose LuxLedger?</h3>
              <div className="space-y-4">
                {[
                  'Verified luxury assets with blockchain authentication',
                  'Instant XRPL-based transactions and settlements',
                  'Professional escrow services for secure trading',
                  'Global marketplace with premium inventory',
                  'Expert broker network for personalized service'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-gradient-to-br from-yellow-600/10 to-yellow-400/10 border border-yellow-600/30 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Start?</h3>
              <p className="text-gray-300 mb-6">
                Join thousands of luxury asset traders who trust LuxLedger for their high-value transactions.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={goToMarketplace}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                >
                  Browse Luxury Assets
                </Button>
                
                <Button
                  onClick={goToSignup}
                  variant="outline"
                  className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                >
                  Create Free Account
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
