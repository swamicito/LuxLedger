/**
 * Subscription Card Component for LuxGuard Escrow
 * Displays subscription tiers with pricing and features
 */

import React from 'react';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { SubscriptionPlan, SubscriptionTier } from '../lib/subscription-model';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  currentTier?: SubscriptionTier;
  billingCycle: 'monthly' | 'annual';
  onSelect: (tier: SubscriptionTier) => void;
  isPopular?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  currentTier,
  billingCycle,
  onSelect,
  isPopular = false
}) => {
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const monthlyPrice = billingCycle === 'annual' ? plan.annualPrice / 12 : plan.monthlyPrice;
  const savings = billingCycle === 'annual' ? plan.monthlyPrice * 12 - plan.annualPrice : 0;
  const isCurrentTier = currentTier === plan.tier;

  const getTierIcon = () => {
    switch (plan.tier) {
      case 'basic':
        return <Shield className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />;
      case 'pro':
        return <Zap className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />;
      case 'enterprise':
        return <Crown className="w-6 h-6" style={{ color: 'var(--lux-gold)' }} />;
    }
  };

  const getCardStyle = () => {
    if (isPopular) {
      return {
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
        border: '2px solid var(--lux-gold)',
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)'
      };
    }
    return {
      background: 'var(--lux-dark-gray)',
      border: '1px solid rgba(212, 175, 55, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
    };
  };

  return (
    <div
      className="relative rounded-2xl p-8 transition-all duration-300 hover:scale-105"
      style={getCardStyle()}
    >
      {isPopular && (
        <div
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)',
            color: 'var(--lux-black)'
          }}
        >
          Most Popular
        </div>
      )}

      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          {getTierIcon()}
        </div>
        <h3
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--ivory)', fontFamily: 'var(--font-display)' }}
        >
          {plan.name}
        </h3>
        <p
          className="text-sm opacity-80"
          style={{ color: 'var(--ivory)' }}
        >
          {plan.description}
        </p>
      </div>

      <div className="text-center mb-8">
        {plan.monthlyPrice === 0 ? (
          <div>
            <span
              className="text-4xl font-bold"
              style={{ color: 'var(--lux-gold)' }}
            >
              Free
            </span>
          </div>
        ) : (
          <div>
            <span
              className="text-4xl font-bold"
              style={{ color: 'var(--lux-gold)' }}
            >
              ${monthlyPrice.toFixed(0)}
            </span>
            <span
              className="text-lg opacity-70 ml-1"
              style={{ color: 'var(--ivory)' }}
            >
              /month
            </span>
            {billingCycle === 'annual' && savings > 0 && (
              <div
                className="text-sm mt-1"
                style={{ color: 'var(--lux-gold)' }}
              >
                Save ${savings}/year
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              style={{ color: 'var(--lux-gold)' }}
            />
            <span
              className="text-sm"
              style={{ color: 'var(--ivory)' }}
            >
              {feature}
            </span>
          </div>
        ))}
      </div>

      {plan.escrowDiscount > 0 && (
        <div
          className="text-center p-4 rounded-lg mb-6"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}
        >
          <div
            className="text-lg font-semibold"
            style={{ color: 'var(--lux-gold)' }}
          >
            {plan.escrowDiscount}% Escrow Discount
          </div>
          <div
            className="text-sm opacity-80"
            style={{ color: 'var(--ivory)' }}
          >
            Save on every transaction
          </div>
        </div>
      )}

      <button
        onClick={() => onSelect(plan.tier)}
        disabled={isCurrentTier}
        className="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: isCurrentTier
            ? 'var(--lux-dark-gray)'
            : isPopular
            ? 'linear-gradient(135deg, var(--lux-gold) 0%, #FFD700 100%)'
            : 'transparent',
          color: isCurrentTier
            ? 'var(--ivory)'
            : isPopular
            ? 'var(--lux-black)'
            : 'var(--lux-gold)',
          border: isPopular ? 'none' : '1px solid var(--lux-gold)'
        }}
      >
        {isCurrentTier ? 'Current Plan' : `Choose ${plan.name}`}
      </button>
    </div>
  );
};

interface SubscriptionComparisonProps {
  plans: SubscriptionPlan[];
  currentTier?: SubscriptionTier;
  billingCycle: 'monthly' | 'annual';
  onSelectPlan: (tier: SubscriptionTier) => void;
  onBillingCycleChange: (cycle: 'monthly' | 'annual') => void;
}

export const SubscriptionComparison: React.FC<SubscriptionComparisonProps> = ({
  plans,
  currentTier,
  billingCycle,
  onSelectPlan,
  onBillingCycleChange
}) => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2
          className="text-4xl font-bold mb-4"
          style={{ color: 'var(--ivory)', fontFamily: 'var(--font-display)' }}
        >
          Choose Your LuxGuard Plan
        </h2>
        <p
          className="text-xl opacity-80 mb-8"
          style={{ color: 'var(--ivory)' }}
        >
          Secure your luxury transactions with confidence
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span
            className={`text-lg ${billingCycle === 'monthly' ? 'font-semibold' : 'opacity-70'}`}
            style={{ color: 'var(--ivory)' }}
          >
            Monthly
          </span>
          <button
            onClick={() => onBillingCycleChange(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-16 h-8 rounded-full transition-colors duration-200"
            style={{
              background: billingCycle === 'annual' ? 'var(--lux-gold)' : 'var(--lux-dark-gray)'
            }}
          >
            <div
              className="absolute top-1 w-6 h-6 rounded-full transition-transform duration-200"
              style={{
                background: 'var(--ivory)',
                transform: billingCycle === 'annual' ? 'translateX(36px)' : 'translateX(4px)'
              }}
            />
          </button>
          <span
            className={`text-lg ${billingCycle === 'annual' ? 'font-semibold' : 'opacity-70'}`}
            style={{ color: 'var(--ivory)' }}
          >
            Annual
          </span>
          {billingCycle === 'annual' && (
            <span
              className="text-sm px-2 py-1 rounded-full ml-2"
              style={{
                background: 'var(--lux-gold)',
                color: 'var(--lux-black)'
              }}
            >
              Save 17%
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <SubscriptionCard
            key={plan.tier}
            plan={plan}
            currentTier={currentTier}
            billingCycle={billingCycle}
            onSelect={onSelectPlan}
            isPopular={index === 1} // Make Pro plan popular
          />
        ))}
      </div>

      <div className="text-center mt-12">
        <p
          className="text-sm opacity-70"
          style={{ color: 'var(--ivory)' }}
        >
          All plans include secure escrow protection and dispute resolution.
          <br />
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
};
