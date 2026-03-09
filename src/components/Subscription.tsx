import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Crown, ShieldCheck, Star, Sparkles, ChevronRight, Award } from 'lucide-react';

interface SubscriptionProps {
  userData: any;
  t: any;
}

export const Subscription: React.FC<SubscriptionProps> = ({ userData, t }) => {
  const currentTier = userData?.subscriptionTier || 'free';

  const plans = [
    {
      name: 'Free',
      price: 'R$ 0',
      features: ['Rastreamento Básico', 'Rotina Diária', 'Insights IA Limitados'],
      icon: <ShieldCheck size={28} />,
      color: 'text-white/40',
      glow: 'rgba(255,255,255,0.05)',
      desc: 'Essencial para iniciantes'
    },
    {
      name: 'Pro',
      price: 'R$ 29/mês',
      features: ['Analytics Avançado', 'Mapa da Vida', 'Estratégia IA Ilimitada', 'Academia Mental'],
      icon: <Zap size={28} />,
      color: 'text-zenith-cyan',
      glow: 'rgba(0,240,255,0.1)',
      popular: true,
      desc: 'Otimização de performance'
    },
    {
      name: 'Elite',
      price: 'R$ 99/mês',
      features: ['Mentor IA Pessoal', 'Estratégia Financeira', 'Suporte Prioritário', 'Acesso Antecipado'],
      icon: <Crown size={28} />,
      color: 'text-zenith-electric-blue',
      glow: 'rgba(59,130,246,0.1)',
      desc: 'Domínio total da vida'
    },
    {
      name: 'Master',
      price: 'R$ 249/mês',
      features: ['Consultoria IA Master', 'Predições de Hábito', 'Zenith OS Completo', 'Comunidade VIP'],
      icon: <Star size={28} />,
      color: 'text-zenith-cyan',
      glow: 'rgba(0,240,255,0.1)',
      desc: 'Legado e maestria neural'
    }
  ];

  const handleSubscribe = async (planName: string) => {
    if (planName.toLowerCase() === currentTier.toLowerCase()) return;
    if (planName === 'Free') return;
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: planName.toLowerCase(),
          userId: userData?.id 
        })
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  return (
    <div className="p-6 space-y-12 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-3 text-zenith-electric-blue">
          <div className="h-px w-8 bg-zenith-electric-blue/30" />
          <Sparkles size={18} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Zenith Upgrade</span>
          <div className="h-px w-8 bg-zenith-electric-blue/30" />
        </div>
        <h1 className="text-5xl font-display font-bold tracking-tighter uppercase leading-none">
          Evolua seu <span className="text-zenith-electric-blue">Status</span>
        </h1>
        <p className="text-white/30 text-xs font-medium max-w-[320px] mx-auto leading-relaxed uppercase tracking-widest">
          Desbloqueie protocolos de elite e otimize sua existência neural.
        </p>
      </header>

      <div className="space-y-8">
        {plans.map((plan) => {
          const isCurrent = plan.name.toLowerCase() === currentTier.toLowerCase();
          return (
            <motion.div
              key={plan.name}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`glass-card p-10 relative overflow-hidden transition-all duration-500 border-white/5 bg-white/[0.01] ${plan.popular ? 'border-zenith-cyan/20 ring-1 ring-zenith-cyan/10' : ''}`}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-zenith-cyan text-zenith-black text-[9px] font-bold px-6 py-2 rounded-bl-[24px] uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                  Recomendado
                </div>
              )}
              
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center space-x-6">
                  <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center bg-white/5 border border-white/10 ${plan.color} shadow-inner`}>
                    {plan.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-display font-bold tracking-tight uppercase leading-none">{plan.name}</h3>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{plan.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-white tracking-tighter">{plan.price}</p>
                  <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-1">Faturamento Mensal</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 mb-12">
                {plan.features.map((feature: string) => (
                  <div key={feature} className="flex items-center space-x-5 group/item">
                    <div className="w-6 h-6 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-white/20 transition-colors">
                      <Check size={14} className={plan.color} />
                    </div>
                    <span className="text-xs text-white/50 font-medium group-hover/item:text-white/80 transition-colors">{feature}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSubscribe(plan.name)}
                disabled={isCurrent}
                className={`w-full py-6 rounded-[24px] font-bold text-[10px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center space-x-3 ${
                  isCurrent 
                    ? 'bg-white/5 text-white/20 border border-white/10 cursor-default' 
                    : 'btn-primary shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]'
                }`}
              >
                {isCurrent ? (
                  <>
                    <Award size={14} />
                    <span>Protocolo Ativo</span>
                  </>
                ) : (
                  <>
                    <span>Ativar {plan.name}</span>
                    <ChevronRight size={14} />
                  </>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
