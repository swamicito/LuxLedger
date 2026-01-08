/**
 * Subscription Page for LuxGuard Escrow Plans
 */

import React, { useState } from 'react';
import { SubscriptionComparison } from '../modules/escrow/components/SubscriptionCard';
import { SubscriptionDashboard } from '../modules/escrow/components/SubscriptionDashboard';
import { subscriptionManager } from '../modules/escrow/lib/subscription-model';
import type { SubscriptionTier } from '../modules/escrow/lib/subscription-model';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const Subscription: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationComplete, setCancellationComplete] = useState(false);
  
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
    setShowCancelDialog(true);
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, call subscriptionManager.cancelSubscription(userId)
      setCancellationComplete(true);
      toast.success('Subscription cancelled. You have access until the end of your billing period.');
    } catch (error) {
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDowngrade = async () => {
    setShowDowngradeDialog(false);
    try {
      await subscriptionManager.upgradeSubscription(userId, 'basic', billingCycle);
      toast.success('Downgraded to Basic plan. Changes take effect at end of billing period.');
      setShowDashboard(true);
    } catch (error) {
      toast.error('Failed to downgrade. Please try again.');
    }
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

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md border border-white/10 bg-neutral-950">
          {!cancellationComplete ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Cancel Subscription
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel your subscription?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <h4 className="font-medium mb-2">What happens when you cancel:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• You keep access until {currentSubscription?.nextBillingDate?.toLocaleDateString() || 'end of billing period'}</li>
                    <li>• Your data is retained for 30 days</li>
                    <li>• You can resubscribe anytime</li>
                    <li>• Escrow fees will return to standard rates</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm text-amber-300">
                    <strong>Consider downgrading instead?</strong> Keep some benefits at a lower cost.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setShowCancelDialog(false);
                      setShowDowngradeDialog(true);
                    }}
                  >
                    View Downgrade Options
                  </Button>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                  Keep Subscription
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Subscription Cancelled
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground">
                  Your subscription has been cancelled. You'll continue to have access until the end of your current billing period.
                </p>
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm">
                    <strong>Access ends:</strong> {currentSubscription?.nextBillingDate?.toLocaleDateString() || 'End of billing period'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setShowCancelDialog(false);
                  setCancellationComplete(false);
                }}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Downgrade Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent className="sm:max-w-md border border-white/10 bg-neutral-950">
          <DialogHeader>
            <DialogTitle>Downgrade to Basic</DialogTitle>
            <DialogDescription>
              Keep essential features at a lower cost.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h4 className="font-medium mb-2">Basic Plan includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Standard escrow protection</li>
                <li>✓ Email support</li>
                <li>✓ Basic analytics</li>
              </ul>
              <p className="mt-3 text-sm">
                <strong>Price:</strong> Free (pay-per-use escrow fees)
              </p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Downgrade takes effect at the end of your current billing period.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDowngrade}>
              Downgrade to Basic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscription;
