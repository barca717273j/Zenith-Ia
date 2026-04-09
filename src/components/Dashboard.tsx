import React, { useState, useEffect } from 'react';
import { InfinityAI } from './InfinityAI';
import { AIAssistant } from './AIAssistant';
import { ZenitLogo } from './ZenitLogo';
import { AdminPanel } from './AdminPanel';
import { RoutineSystem } from './RoutineSystem';
import { DailyMissions } from './DailyMissions';
import { FocusTimer } from './FocusTimer';
import { NotificationCenter } from './NotificationCenter';
import { motion } from 'motion/react';
import { FloatingThemeToggle } from './FloatingThemeToggle';
import { Zap, Target, TrendingUp, Wallet, User, ChevronRight, MessageSquare, Sparkles, Quote, Gamepad2, Brain, Activity, ArrowUpRight, Timer, Dumbbell, Flame, Book, Compass, Crown, Shield, PenTool, BookOpen } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { TIER_LIMITS, SubscriptionTier } from '../types';

interface DashboardProps {
  t: any;
  setActiveTab: (tab: string) => void;
}

const UsageStats: React.FC<{ t: any; userData: any }> = ({ t, userData }) => {
  const tier = userData?.subscription_tier || 'basic';
  const limits = TIER_LIMITS[tier as SubscriptionTier] || TIER_LIMITS.basic;

  const stats = [
    {
      label: t.usage.aiMessages,
      current: userData?.ai_messages_count || 0,
      limit: limits.aiMessagesPerDay,
      icon: <MessageSquare size={16} className="text-zenit-cyan" />,
      color: 'cyan'
    },
    {
      label: t.usage.routines,
      current: userData?.habits_count || 0,
      limit: limits.routinesPerDay,
      icon: <Zap size={16} className="text-zenit-accent" />,
      color: 'accent'
    },
    {
      label: t.usage.actions,
      current: userData?.actions_count || 0,
      limit: limits.actionsPerDay,
      icon: <Activity size={16} className="text-emerald-500" />,
      color: 'emerald'
    },
    {
      label: t.usage.aiGenerations,
      current: userData?.ai_generations_count || 0,
      limit: limits.aiGenerationsPerDay,
      icon: <Sparkles size={16} className="text-amber-500" />,
      color: 'amber'
    }
  ];

  return (
    <section className="space-y-8 relative z-10">
      <div className="flex items-center space-x-4 px-2">
        <div className="w-2 h-6 bg-zenit-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]" />
        <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-zenit-text-primary italic">{t.usage.title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stats.map((stat, i) => {
          const isUnlimited = stat.limit === Infinity;
          const percentage = isUnlimited ? 0 : Math.min((stat.current / stat.limit) * 100, 100);
          const remaining = isUnlimited ? t.usage.unlimited : Math.max(stat.limit - stat.current, 0);

          return (
            <div key={i} className="relative group p-8 rounded-[2.5rem] bg-zenit-surface-1 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-zenit-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="p-3.5 rounded-2xl bg-zenit-surface-2 transition-all">
                  {stat.icon}
                </div>
                <span className="text-[10px] font-bold text-zenit-text-tertiary uppercase tracking-[0.3em] opacity-60">{stat.label}</span>
              </div>
              
              <div className="space-y-6 mt-8 relative z-10">
                <div className="flex justify-between items-end">
                  <p className="text-4xl font-display font-bold text-zenit-text-primary tracking-tighter italic">
                    {stat.current}{!isUnlimited && <span className="text-sm text-zenit-text-tertiary font-normal ml-2 opacity-30">/ {stat.limit}</span>}
                  </p>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-zenit-text-tertiary uppercase tracking-widest opacity-40 mb-1">
                      {isUnlimited ? t.usage.unlimited : `${remaining} ${t.usage.remaining}`}
                    </span>
                  </div>
                </div>
                
                <div className="relative h-2 bg-zenit-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                    className={`h-full ${percentage > 90 ? 'bg-zenit-accent' : 'bg-gradient-to-r from-zenit-accent/40 to-zenit-accent'}`}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const QuickAction: React.FC<{ icon: React.ReactElement; label: string; onClick: () => void; color: 'scarlet' | 'cyan' }> = ({ icon, label, onClick, color }) => {
  const { checkLimit, incrementUsage } = useUser();
  
  const handleAction = async () => {
    const limitCheck = await checkLimit('actions');
    if (!limitCheck.allowed) {
      console.warn(limitCheck.message);
      return;
    }
    await incrementUsage('actions');
    onClick();
  };

  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAction}
      className="relative group flex flex-col items-center justify-center space-y-4 p-6 rounded-[2.5rem] bg-zenit-surface-1 transition-all overflow-hidden"
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-zenit-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-zenit-surface-2 text-zenit-accent relative z-10 group-hover:scale-110 duration-500">
        {React.cloneElement(icon as any, { size: 28 })}
      </div>
      
      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zenit-text-tertiary group-hover:text-zenit-text-primary transition-colors relative z-10">
        {label}
      </span>
    </motion.button>
  );
};

import { NewProtocolModal } from './NewProtocolModal';
import { RefreshCw, PlusCircle, CheckCircle2 } from 'lucide-react';

export const Dashboard: React.FC<DashboardProps> = ({ t, setActiveTab }) => {
  const { userData, refreshUserData } = useUser();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    
    try {
      // Simulate synchronization logic
      // In a real app, this would trigger backend calculations to update
      // routine, finances, moral, and mental gym based on active protocols.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { error } = await supabase
        .from('users')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', userData?.id);
        
      if (error) throw error;
      
      await refreshUserData();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      setIsAdminOpen(true);
      setLogoClicks(0);
    }
    setTimeout(() => setLogoClicks(0), 3000);
  };

  return (
    <div className="p-6 space-y-12 pb-32 max-w-4xl mx-auto min-h-screen bg-zenit-black relative overflow-hidden">
      {/* Living Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zenit-accent/5 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zenit-accent/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <header className="flex justify-between items-center bg-zenit-surface-1/40 backdrop-blur-2xl p-5 rounded-[2.5rem] relative z-20">
        <div className="flex items-center space-x-8">
          <div onClick={handleLogoClick} className="cursor-pointer flex items-center space-x-5 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zenit-accent to-zenit-crimson flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <ZenitLogo size={36} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary leading-none italic">ZENITH</span>
              <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-zenit-text-tertiary mt-1.5 opacity-50">Neural Interface</span>
            </div>
          </div>
          
          <div className="h-10 w-[1px] bg-white/5" />

          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zenit-surface-1 transition-all p-0.5">
              <div className="w-full h-full rounded-full overflow-hidden">
                {(userData?.avatar_url || userData?.photo_url) ? (
                  <img src={userData.avatar_url || userData.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.id}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zenit-text-primary group-hover:text-zenit-accent transition-colors">{userData?.display_name?.split(' ')[0] || 'Usuário'}</span>
              <div className="flex items-center space-x-2 mt-1">
                <Crown size={8} className="text-zenit-accent" />
                <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-zenit-text-tertiary">Nível {userData?.level || 1}</span>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationCenter userId={userData?.id || ''} />
        </div>
      </header>

      {/* AI Mentor Hero */}
      <section className="premium-card premium-card-hover relative overflow-hidden group bg-zenit-surface-1 border-zenit-border-primary">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Brain size={120} className="text-zenit-accent" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 sm:p-10">
          <div className="flex-shrink-0 relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-zenit-accent via-zenit-crimson to-zenit-accent p-1 animate-pulse-slow">
              <div className="w-full h-full rounded-[2.3rem] bg-zenit-black flex items-center justify-center overflow-hidden border-4 border-zenit-black">
                <InfinityAI isResponding={false} />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-4 border-zenit-black flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white animate-pulse" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <span className="px-3 py-1 bg-zenit-accent/10 text-zenit-accent text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-zenit-accent/20 shadow-[0_0_15px_rgba(255,59,59,0.1)]">Neural Core v4.0</span>
                <div className="flex space-x-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-zenit-accent animate-ping" style={{ animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-zenit-text-primary tracking-tighter italic leading-none">
                Olá, eu sou o <span className="text-zenit-accent">ZENITH</span>
              </h2>
              <p className="text-sm text-zenit-text-tertiary font-medium max-w-md leading-relaxed">
                Sua interface neural para otimização humana. Como posso acelerar sua evolução hoje?
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button 
                onClick={() => setIsAIOpen(true)}
                className="px-8 py-4 bg-zenit-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(255,36,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
              >
                <MessageSquare size={16} />
                <span>Iniciar Diálogo</span>
              </button>
              <button 
                onClick={() => setActiveTab('manual')}
                className="px-8 py-4 bg-zenit-surface-2 text-zenit-text-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-zenit-border-primary hover:bg-zenit-surface-1 transition-all flex items-center space-x-3"
              >
                <Sparkles size={16} className="text-zenit-accent" />
                <span>Ver Diretrizes</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sincronização de Protocolo (Timer) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <div className="w-1.5 h-6 bg-zenit-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]" />
            <h3 className="text-[11px] font-display font-bold text-zenit-text-primary uppercase tracking-[0.4em] italic">Sincronização de Protocolo</h3>
          </div>
          <div className="flex items-center space-x-2 text-zenit-accent">
            <Timer size={14} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">Tempo Real</span>
          </div>
        </div>
        
        <FocusTimer t={t} />
      </section>

      {/* Quick Actions - Expanded to 9 buttons */}
      <section className="space-y-8 relative z-10">
        <div className="flex items-center space-x-4 px-2">
          <div className="w-2 h-6 bg-zenit-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-zenit-text-primary italic">Acesso Rápido</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction 
            icon={<Brain />} 
            label="Axis" 
            onClick={() => setActiveTab('axis')} 
            color="cyan"
          />
          <QuickAction 
            icon={<Dumbbell />} 
            label="Exercícios" 
            onClick={() => setActiveTab('exercises')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Target />} 
            label="Hábitos" 
            onClick={() => setActiveTab('tasks')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Wallet />} 
            label="Finanças" 
            onClick={() => setActiveTab('finance')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<BookOpen />} 
            label="Manual" 
            onClick={() => setActiveTab('manual')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<PenTool />} 
            label="Diário" 
            onClick={() => setActiveTab('journal')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Gamepad2 />} 
            label="Mental Gym" 
            onClick={() => setActiveTab('gym')} 
            color="scarlet"
          />
        </div>
      </section>

      {/* Today's Routine */}
      <section className="space-y-8 relative z-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-6 bg-zenit-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]" />
            <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-zenit-text-primary italic">Rotina Diária</h3>
          </div>
        </div>
        <div className="relative p-8 rounded-[3rem] bg-zenit-surface-1 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-zenit-accent/5 blur-[60px] rounded-full" />
          <RoutineSystem t={t} userData={userData} />
        </div>
      </section>

      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        t={t} 
      />

      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] bg-zenit-black">
          <AdminPanel t={t} onBack={() => setIsAdminOpen(false)} />
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; trend: string; color: 'purple' | 'cyan' }> = ({ icon, label, value, trend, color }) => (
  <motion.div
    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.04)' }}
    className="glass-card p-8 space-y-6 bg-zenit-surface-1 transition-all relative overflow-hidden group"
  >
    {/* Background Glow */}
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
      color === 'purple' ? 'bg-zenit-electric-blue' : 'bg-zenit-cyan'
    }`} />


    <div className="flex justify-between items-center relative z-10">
      <div className="w-12 h-12 rounded-[20px] bg-zenit-surface-2 flex items-center justify-center transition-colors">
        {icon}
      </div>
      <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
        <TrendingUp size={12} />
        <span className="text-[10px] font-bold uppercase tracking-tighter">{trend}</span>
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-zenit-text-tertiary text-[10px] uppercase tracking-[0.3em] font-bold mb-2">{label}</p>
      <p className="text-3xl font-display font-bold tracking-tighter text-zenit-text-primary">{value}</p>
    </div>
  </motion.div>
);
