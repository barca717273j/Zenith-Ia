import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Shield, Crown, Star, ArrowRight, Sparkles } from 'lucide-react';

interface SubscriptionProps {
  userData: any;
  t: any;
}

export const Subscription: React.FC<SubscriptionProps> = ({ userData, t }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'basic',
      name: t.subscription.basic.name,
      price: t.subscription.basic.price,
      features: t.subscription.basic.features,
      icon: <Zap className="text-white/40" />,
      color: 'border-white/10',
      bg: 'bg-white/[0.02]',
      button: 'bg-white/10 text-white/60',
      popular: false
    },
    {
      id: 'pro',
      name: t.subscription.pro.name,
      price: t.subscription.pro.price,
      features: t.subscription.pro.features,
      icon: <Shield className="text-zenith-scarlet" />,
      color: 'border-zenith-scarlet/30',
      bg: 'bg-zenith-scarlet/5',
      button: 'btn-primary',
      popular: true
    },
    {
      id: 'elite',
      name: t.subscription.elite.name,
      price: t.subscription.elite.price,
      features: t.subscription.elite.features,
      icon: <Crown className="text-zenith-neon-red" />,
      color: 'border-zenith-neon-red/30',
      bg: 'bg-zenith-neon-red/5',
      button: 'bg-zenith-neon-red text-white shadow-[0_0_20px_rgba(255,36,0,0.4)]',
      popular: false
    },
    {
      id: 'master',
      name: t.subscription.master.name,
      price: t.subscription.master.price,
      features: t.subscription.master.features,
      icon: <Star className="text-yellow-500" />,
      color: 'border-yellow-500/30',
      bg: 'bg-yellow-500/5',
      button: 'bg-yellow-500 text-black font-bold shadow-[0_0_20px_rgba(234,179,8,0.4)]',
      popular: false
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (planId === 'basic') return;
    
    setLoading(planId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: `price_${planId}_placeholder`, // In real app, use actual Stripe price IDs
          userId: userData.id,
          email: userData.email
        }),
      });
      
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-12 pb-32 max-w-2xl mx-auto">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-zenith-scarlet/10 px-4 py-2 rounded-full border border-zenith-scarlet/20 mb-4">
          <Sparkles size={14} className="text-zenith-scarlet" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zenith-scarlet">Premium Access</span>
        </div>
        <h2 className="text-4xl font-display font-bold tracking-tighter uppercase text-white">{t.subscription.title}</h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
          {t.subscription.choosePlan}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -4 }}
            className={`glass-card p-8 border ${plan.color} ${plan.bg} relative overflow-hidden group`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-zenith-scarlet text-white text-[8px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                {t.common.mostPopular}
              </div>
            )}

            <div className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white tracking-tighter uppercase">{plan.name}</h3>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.id !== 'basic' && <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{plan.id === 'master' ? '/yr' : '/mo'}</span>}
                </div>
              </div>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-center space-x-3 text-white/60 group-hover:text-white/80 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className={plan.id !== 'basic' ? 'text-zenith-scarlet' : 'text-white/20'} />
                  </div>
                  <span className="text-xs font-medium tracking-tight">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null || userData?.subscriptionTier === plan.id}
              className={`w-full py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 ${plan.button} disabled:opacity-50`}
            >
              {loading === plan.id ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{userData?.subscriptionTier === plan.id ? t.common.currentPlan : t.common.get}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
