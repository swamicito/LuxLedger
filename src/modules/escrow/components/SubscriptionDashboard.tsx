/**
 * Subscription Dashboard Component for LuxGuard Escrow
 * Shows user's current subscription status, usage, and analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Calendar,
  BarChart3,
  Settings,
  AlertCircle
} from 'lucide-react';
import { 
  UserSubscription, 
  SubscriptionTier, 
  subscriptionManager 
} from '../lib/subscription-model';

interface SubscriptionDashboardProps {
  userId: string;
  onUpgrade: (tier: SubscriptionTier) => void;
  onManage: () => void;
}

export const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({
  userId,
  onUpgrade,
  onManage
}) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [upgradeRecommendation, setUpgradeRecommendation] = useState<any>(null);

  useEffect(() => {
    // Load subscription data
    const userSub = subscriptionManager.getUserSubscription(userId);
    setSubscription(userSub);

    if (userSub) {
      const userAnalytics = subscriptionManager.getSubscriptionAnalytics(userId);
      setAnalytics(userAnalytics);

      // Calculate upgrade recommendation for Pro tier
      if (userSub.tier === 'basic') {
        const recommendation = subscriptionManager.calculateUpgradeROI(
          userId,
          'pro',
          userAnalytics?.volumeThisMonth || 0
        );
        setUpgradeRecommendation(recommendation);
      }
    }
  }, [userId]);

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return <Shield className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />;
      case 'pro':
        return <TrendingUp className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />;
      case 'enterprise':
        return <Crown className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return '#6B7280';
      case 'pro':
        return 'var(--lux-gold)';
      case 'enterprise':
        return '#8B5CF6';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (!subscription) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--lux-dark-gray)' }}
      >
        <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--lux-gold)' }} />
        <h3
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--ivory)', fontFamily: 'var(--font-display)' }}
        >
          No Active Subscription
        </h3>
        <p className="text-lg mb-6" style={{ color: 'var(--ivory)', opacity: 0.8 }}>
          Upgrade to a LuxGuard plan to save on escrow fees and unlock premium features.
        </p>
        <button
          onClick={() => onUpgrade('pro')}
          className="px-8 py-3 rounded-lg font-semibold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)',
            color: 'var(--lux-black)'
          }}
        >
          View Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div
        className="rounded-2xl p-8"
        style={{
          background: 'var(--lux-dark-gray)',
          border: `2px solid ${getTierColor(subscription.tier)}`
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {getTierIcon(subscription.tier)}
            <div>
              <h2
                className="text-2xl font-bold capitalize"
                style={{ color: 'var(--ivory)', fontFamily: 'var(--font-display)' }}
              >
                {subscription.tier} Plan
              </h2>
              <p className="opacity-80" style={{ color: 'var(--ivory)' }}>
                Status: <span className="capitalize font-semibold">{subscription.status}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onManage}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200"
            style={{
              borderColor: 'var(--lux-gold)',
              color: 'var(--lux-gold)'
            }}
          >
            <Settings className="w-4 h-4" />
            Manage
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--lux-gold)' }} />
            <div className="text-sm opacity-70" style={{ color: 'var(--ivory)' }}>
              Next Billing
            </div>
            <div className="font-semibold" style={{ color: 'var(--ivory)' }}>
              {formatDate(subscription.nextBillingDate)}
            </div>
          </div>
          
          <div className="text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--lux-gold)' }} />
            <div className="text-sm opacity-70" style={{ color: 'var(--ivory)' }}>
              Monthly Volume
            </div>
            <div className="font-semibold" style={{ color: 'var(--ivory)' }}>
              {formatCurrency(subscription.monthlyVolumeUsed)}
            </div>
          </div>
          
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--lux-gold)' }} />
            <div className="text-sm opacity-70" style={{ color: 'var(--ivory)' }}>
              Total Saved
            </div>
            <div className="font-semibold" style={{ color: 'var(--ivory)' }}>
              {formatCurrency(subscription.totalEscrowsSaved)}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid md:grid-cols-2 gap-6">
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--lux-dark-gray)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--ivory)' }}
              >
                Usage Analytics
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="opacity-80" style={{ color: 'var(--ivory)' }}>
                  Escrows This Month
                </span>
                <span className="font-semibold" style={{ color: 'var(--ivory)' }}>
                  {analytics.escrowsThisMonth}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80" style={{ color: 'var(--ivory)' }}>
                  Avg Transaction Size
                </span>
                <span className="font-semibold" style={{ color: 'var(--ivory)' }}>
                  {formatCurrency(analytics.averageTransactionSize)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80" style={{ color: 'var(--ivory)' }}>
                  Projected Annual Savings
                </span>
                <span
                  className="font-semibold"
                  style={{ color: 'var(--lux-gold)' }}
                >
                  {formatCurrency(analytics.projectedAnnualSavings)}
                </span>
              </div>
            </div>
          </div>

          {/* Volume Limit Card */}
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--lux-dark-gray)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--ivory)' }}
              >
                Volume Limits
              </h3>
            </div>
            
            {subscription.tier === 'enterprise' ? (
              <div className="text-center py-4">
                <div
                  className="text-2xl font-bold mb-2"
                  style={{ color: 'var(--lux-gold)' }}
                >
                  Unlimited
                </div>
                <div className="opacity-80" style={{ color: 'var(--ivory)' }}>
                  No volume restrictions
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="opacity-80" style={{ color: 'var(--ivory)' }}>
                    Used This Month
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--ivory)' }}>
                    {formatCurrency(subscription.monthlyVolumeUsed)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80" style={{ color: 'var(--ivory)' }}>
                    Monthly Limit
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--ivory)' }}>
                    {subscription.tier === 'pro' ? formatCurrency(500000) : 'No limit'}
                  </span>
                </div>
                {subscription.tier === 'pro' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--ivory)', opacity: 0.8 }}>Usage</span>
                      <span style={{ color: 'var(--ivory)', opacity: 0.8 }}>
                        {((subscription.monthlyVolumeUsed / 500000) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full"
                      style={{ background: 'rgba(212, 175, 55, 0.2)' }}
                    >
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          background: 'var(--lux-gold)',
                          width: `${Math.min((subscription.monthlyVolumeUsed / 500000) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Recommendation */}
      {upgradeRecommendation && upgradeRecommendation.recommendation === 'upgrade' && (
        <div
          className="rounded-xl p-6 border"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            borderColor: 'var(--lux-gold)'
          }}
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 mt-1" style={{ color: 'var(--lux-gold)' }} />
            <div className="flex-1">
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--ivory)' }}
              >
                Upgrade Recommended
              </h3>
              <p className="mb-4" style={{ color: 'var(--ivory)', opacity: 0.9 }}>
                Based on your usage, upgrading to Pro would save you{' '}
                <span className="font-semibold" style={{ color: 'var(--lux-gold)' }}>
                  {formatCurrency(upgradeRecommendation.monthlySavings)}/month
                </span>
                {' '}with an ROI of{' '}
                <span className="font-semibold" style={{ color: 'var(--lux-gold)' }}>
                  {upgradeRecommendation.roi.toFixed(0)}%
                </span>
              </p>
              <button
                onClick={() => onUpgrade('pro')}
                className="px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)',
                  color: 'var(--lux-black)'
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
