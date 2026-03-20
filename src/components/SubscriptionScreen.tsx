import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Shield, Sparkles, Star, Crown, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useUser } from '../contexts/UserContext';
import { SubscriptionTier } from '../types';

interface PlanCardProps {
  tier: SubscriptionTier;
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  onSelect: (tier: SubscriptionTier) => void;
  loading?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ tier, title, price, period, features, isPopular, onSelect, loading }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`relative p-8 rounded-[2.5rem] border transition-all ${
      isPopular 
        ? 'bg-white/5 border-zenith-scarlet shadow-[0_0_40px_rgba(255,36,0,0.1)]' 
        : 'bg-white/[0.02] border-white/5'
    }`}
  >
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zenith-scarlet text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
        Mais Popular
      </div>
    )}

    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-display font-bold uppercase tracking-tight">{title}</h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-bold tracking-tighter">{price}</span>
          <span className="text-white/40 text-xs font-medium lowercase">/{period}</span>
        </div>
      </div>

      <ul className="space-y-4">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start space-x-3">
            <div className="mt-1 w-4 h-4 rounded-full bg-zenith-scarlet/20 flex items-center justify-center border border-zenith-scarlet/30">
              <Check size={10} className="text-zenith-scarlet" />
            </div>
            <span className="text-xs text-white/60 leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(tier)}
        disabled={loading}
        className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${
          isPopular 
            ? 'bg-white text-black hover:bg-white/90' 
            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
        }`}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Assinar Agora</span>}
      </button>
    </div>
  </motion.div>
);

export const SubscriptionScreen: React.FC = () => {
  const { userData, refreshUserData } = useUser();
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!userData) return;
    setLoading(tier);
    
    try {
      // In a real app, this would redirect to Stripe/Checkout
      // For now, we'll simulate a successful subscription
      const expiresAt = new Date();
      if (tier === 'weekly') expiresAt.setDate(expiresAt.getDate() + 7);
      else if (tier === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
      else if (tier === 'annual') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      else if (tier === 'master') expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Lifetime-ish
      
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: tier,
          plan_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (error) throw error;
      
      // Notification
      await supabase.from('notifications').insert([{
        user_id: userData.id,
        title: 'Assinatura Ativada!',
        message: `Parabéns! Você agora é um membro ${tier.toUpperCase()}. Seu potencial foi desbloqueado.`,
        type: 'achievement'
      }]);

      await refreshUserData();
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#111,0%,#000,100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zenith-scarlet/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zenith-cyan/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-16 pt-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-4">
            <Crown size={14} className="text-zenith-scarlet" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Zenith Premium</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter uppercase leading-none">
            Desbloqueie seu <span className="text-zenith-scarlet italic">Potencial Máximo</span>
          </h1>
          <p className="text-white/40 text-sm max-w-xl mx-auto leading-relaxed">
            Escolha o plano que melhor se adapta à sua jornada de evolução. Acesso ilimitado a todas as ferramentas neurais do Zenith.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PlanCard
            tier="weekly"
            title="Semanal"
            price="R$ 19,90"
            period="semana"
            features={[
              '20 mensagens IA/dia',
              '10 rotinas/dia',
              '15 ações/dia',
              'Exercícios Premium',
              'Controle financeiro'
            ]}
            onSelect={handleSubscribe}
            loading={loading === 'weekly'}
          />
          <PlanCard
            tier="monthly"
            title="Mensal"
            price="R$ 49,90"
            period="mês"
            isPopular
            features={[
              '100 mensagens IA/dia',
              '30 rotinas/dia',
              '50 ações/dia',
              'Social (Nexus) Completo',
              'Análise avançada',
              'Mentoria Financeira'
            ]}
            onSelect={handleSubscribe}
            loading={loading === 'monthly'}
          />
          <PlanCard
            tier="annual"
            title="Anual"
            price="R$ 399,90"
            period="ano"
            features={[
              'Mensagens IA Ilimitadas',
              'Rotinas Ilimitadas',
              'Ações Ilimitadas',
              'Suporte Prioritário',
              'Economia de 33%',
              'Acesso antecipado'
            ]}
            onSelect={handleSubscribe}
            loading={loading === 'annual'}
          />
          <PlanCard
            tier="master"
            title="Master"
            price="R$ 899,90"
            period="vitalício"
            features={[
              'Tudo Ilimitado Para Sempre',
              'Selo de Fundador',
              'Consultoria Trimestral',
              'Conteúdo Exclusivo Elite',
              'Acesso Vitalício',
              'Suporte VIP'
            ]}
            onSelect={handleSubscribe}
            loading={loading === 'master'}
          />
        </div>

        <div className="flex flex-col items-center space-y-6 pt-8">
          <div className="flex items-center space-x-8 text-white/20">
            <div className="flex items-center space-x-2">
              <Shield size={16} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Pagamento Seguro</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star size={16} />
              <span className="text-[9px] font-bold uppercase tracking-widest">7 Dias de Garantia</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap size={16} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Acesso Imediato</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.history.back()}
            className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold transition-colors"
          >
            Continuar com Plano Free (Limitado)
          </button>
        </div>
      </div>
    </div>
  );
};
