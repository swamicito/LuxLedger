/**
 * Subscription Page for LuxGuard Escrow Plans
 */

import React, { useState } from 'react';
import { SubscriptionComparison } from '../modules/escrow/components/SubscriptionCard';
import { SubscriptionDashboard } from '../modules/escrow/components/SubscriptionDashboard';
import { subscriptionManager } from '../modules/escrow/lib/subscription-model';
import type { SubscriptionTier } from '../modules/escrow/lib/subscription-model';

const Subscription: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Mock user ID - in production this would come from auth context
  const userId = 'user_123';
  const currentSubscription = subscriptionManager.getUserSubscription(userId);
  const allPlans = subscriptionManager.getAllPlans();

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    try {
      if (currentSubscription) {
        // Upgrade existing subscription
        await subscriptionManager.upgradeSubscription(userId, tier, billingCycle);
      } else {
        // Create new subscription
        await subscriptionManager.createSubscription({
          userId,
          tier,
          billingCycle,
          paymentMethod: 'stripe_card_123'
        });
      }
      
      // Show success message and redirect to dashboard
      setShowDashboard(true);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      // In production, show error toast
    }
  };

  const handleManageSubscription = () => {
    // In production, this would open billing portal
    console.log('Opening billing portal...');
  };

  if (showDashboard && currentSubscription) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--lux-black)' }}>
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1
                className="text-4xl font-bold mb-4"
                style={{ color: 'var(--ivory)', fontFamily: 'var(--font-display)' }}
              >
                Subscription Dashboard
              </h1>
              <button
                onClick={() => setShowDashboard(false)}
                className="text-lg underline"
                style={{ color: 'var(--lux-gold)' }}
              >
                ← Back to Plans
              </button>
            </div>
            
            <SubscriptionDashboard
              userId={userId}
              onUpgrade={(tier) => {
                setShowDashboard(false);
                // Scroll to plans
              }}
              onManage={handleManageSubscription}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--lux-black)' }}>
      <div className="container mx-auto px-6 py-12">
        {currentSubscription && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowDashboard(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border transition-all duration-200"
              style={{
                borderColor: 'var(--lux-gold)',
                color: 'var(--lux-gold)'
              }}
            >
              View Dashboard
            </button>
          </div>
        )}
        
        <SubscriptionComparison
          plans={allPlans}
          currentTier={currentSubscription?.tier}
          billingCycle={billingCycle}
          onSelectPlan={handleSelectPlan}
          onBillingCycleChange={setBillingCycle}
        />
      </div>
    </div>
  );
};

export default Subscription;
