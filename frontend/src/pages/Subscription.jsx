import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import MainLayout from '../components/MainLayout';
import { PageHeader, Card, Button, Modal } from '../components/UIComponents';
import { Crown, Check, Zap, Users, FolderKanban, Shield, TrendingUp } from 'lucide-react';

export default function Subscription() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    setCurrentPlan(user?.subscription_plan || 'free');
  }, [user]);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '5 Projects',
        '10 Users',
        'Basic task management',
        'Email support',
        '1GB Storage',
      ],
      limitations: [
        'No advanced analytics',
        'No API access',
        'No priority support',
      ],
      color: 'gray',
      icon: FolderKanban,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For growing teams',
      features: [
        'Unlimited Projects',
        '50 Users',
        'Advanced analytics',
        'Priority email support',
        '10GB Storage',
        'Custom workflows',
        'API access',
      ],
      recommended: true,
      color: 'primary',
      icon: Zap,
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large organizations',
      features: [
        'Unlimited Everything',
        'Unlimited Users',
        'Advanced security',
        'Dedicated support',
        'Unlimited Storage',
        'Custom integrations',
        'SLA guarantee',
        'On-premise deployment',
      ],
      color: 'premium',
      icon: Crown,
    },
  ];

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = () => {
    // TODO: Implement actual payment flow
    alert(`Upgrade to ${selectedPlan.name} plan would be processed here. This is a demo.`);
    setShowUpgradeModal(false);
  };

  const getPlanBadgeColor = (plan) => {
    if (plan === 'enterprise') return 'premium-badge';
    if (plan === 'pro') return 'badge-primary';
    return 'badge-gray';
  };

  return (
    <MainLayout>
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage your subscription plan and billing information"
      />

      {/* Current Plan Card */}
      <Card className="mb-8 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Current Plan</h3>
              <div className="flex items-center gap-3">
                <span className={`badge ${getPlanBadgeColor(currentPlan)}`}>
                  {currentPlan.toUpperCase()}
                </span>
                {currentPlan === 'free' && (
                  <span className="text-sm text-gray-600">
                    Upgrade to unlock premium features
                  </span>
                )}
              </div>
            </div>
            {currentPlan !== 'enterprise' && (
              <Button
                variant="primary"
                icon={TrendingUp}
                onClick={() => handleUpgrade(plans[currentPlan === 'free' ? 1 : 2])}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Usage Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Projects</h3>
            <FolderKanban className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {user?.projects_count || 0}
              </span>
              <span className="text-sm text-gray-500">
                / {currentPlan === 'free' ? '5' : 'Unlimited'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{
                  width: `${currentPlan === 'free' ? ((user?.projects_count || 0) / 5) * 100 : 50}%`,
                }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Users</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {user?.users_count || 0}
              </span>
              <span className="text-sm text-gray-500">
                / {currentPlan === 'free' ? '10' : currentPlan === 'pro' ? '50' : 'Unlimited'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-accent-600 h-2 rounded-full"
                style={{
                  width: `${currentPlan === 'free' ? ((user?.users_count || 0) / 10) * 100 : 50}%`,
                }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Storage</h3>
            <Shield className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">0.2</span>
              <span className="text-sm text-gray-500">
                / {currentPlan === 'free' ? '1GB' : currentPlan === 'pro' ? '10GB' : 'Unlimited'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.name.toLowerCase();

            return (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.recommended ? 'ring-2 ring-primary-500 shadow-soft-lg' : ''
                } ${isCurrentPlan ? 'bg-gray-50' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="badge badge-primary px-4 py-1">Recommended</span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        plan.color === 'premium'
                          ? 'bg-gradient-to-br from-premium-400 to-premium-600'
                          : plan.color === 'primary'
                          ? 'bg-primary-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          plan.color === 'premium'
                            ? 'text-white'
                            : plan.color === 'primary'
                            ? 'text-primary-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500">/ {plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <div className="text-center py-3 bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
                      Current Plan
                    </div>
                  ) : (
                    <Button
                      variant={plan.recommended ? 'primary' : 'secondary'}
                      onClick={() => handleUpgrade(plan)}
                      className="w-full"
                    >
                      {currentPlan === 'free' ? 'Upgrade' : 'Switch Plan'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Confirm Upgrade"
        size="md"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upgrade to {selectedPlan.name}
              </h3>
              <p className="text-gray-600">
                You're about to upgrade to the {selectedPlan.name} plan for {selectedPlan.price}/
                {selectedPlan.period}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium text-gray-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Billing</span>
                <span className="font-medium text-gray-900">Monthly</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{selectedPlan.price}/month</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmUpgrade} className="flex-1">
                Confirm Upgrade
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              This is a demo. No actual payment will be processed.
            </p>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
