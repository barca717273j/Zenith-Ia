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
        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zenit-text-primary italic">Métricas de Performance</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stats.map((stat, i) => {
          const isUnlimited = stat.limit === Infinity;
          const percentage = isUnlimited ? 0 : Math.min((stat.current / stat.limit) * 100, 100);

          return (
            <div key={i} className="relative group p-8 rounded-[3rem] bg-zenit-glass border border-zenit-glass-border transition-all overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-zenit-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="p-3.5 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary transition-all">
                  {stat.icon}
                </div>
                <div className="text-right">
                  <span className="text-[7px] font-black text-zenit-text-tertiary uppercase tracking-[0.4em] block">Sinal Neural</span>
                  <span className="text-[10px] font-black text-zenit-text-primary uppercase tracking-[0.2em] italic">{stat.label}</span>
                </div>
              </div>
              
              <div className="space-y-6 mt-8 relative z-10">
                <div className="flex justify-between items-end">
                  <p className="text-5xl font-display font-black text-zenit-text-primary tracking-tighter italic leading-none">
                    {stat.current}
                  </p>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-zenit-accent uppercase tracking-widest italic animate-pulse">
                      OPTIMAL
                    </span>
                  </div>
                </div>
                
                <div className="relative h-1 bg-zenit-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                    className="h-full bg-zenit-accent shadow-[0_0_10px_var(--accent-glow)]"
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-[7.5px] font-black uppercase tracking-widest text-zenit-text-tertiary italic">
                  <span>Prot: 0.0</span>
                  <span>Max: {isUnlimited ? '∞' : stat.limit}</span>
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
  const handleAction = () => {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!userData?.id) return;

      const { error } = await supabase
        .from('profiles')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', userData.id);
        
      if (error) throw error;
      
      await refreshUserData();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      console.error('Sync error:', err);
      const message = err.message === 'Failed to fetch' 
        ? 'Erro de conexão. Verifique sua internet.' 
        : 'Erro ao sincronizar dados.';
      alert(message);
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
    <div className="px-6 pt-12 pb-56 max-w-2xl mx-auto min-h-screen bg-zenit-black relative overflow-hidden">
      {/* Living Background Elements */}
      <div className="absolute top-[-5%] left-[-10%] w-[100%] h-[40%] bg-zenit-accent/[0.04] rounded-full blur-[140px] animate-pulse-glow" />
      <div className="absolute bottom-[10%] right-[-10%] w-[70%] h-[40%] bg-zenit-accent/[0.03] rounded-full blur-[140px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <header className="flex justify-between items-center bg-zenit-glass backdrop-blur-3xl p-6 rounded-[3rem] relative z-20 border border-zenit-glass-border shadow-2xl mb-20">
        <div className="flex items-center space-x-4 min-w-0">
          <div onClick={handleLogoClick} className="cursor-pointer flex items-center space-x-3 group flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zenit-accent to-zenit-crimson flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-lg shadow-zenit-accent/20">
              <ZenitLogo size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-black uppercase tracking-tighter text-zenit-text-primary leading-none italic">ZENITH</span>
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-zenit-text-tertiary mt-1">SISTEMA INTEGRADO</span>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-zenit-border-primary flex-shrink-0" />

          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-3 group min-w-0 cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab('profile')}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zenit-surface-2 transition-all p-0.5 border border-zenit-border-primary flex-shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden shadow-inner">
                {(userData?.avatar_url || userData?.photo_url) ? (
                  <img src={userData.avatar_url || userData.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.id}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-zenit-text-primary group-hover:text-zenit-accent transition-colors truncate">{userData?.display_name?.split(' ')[0] || 'Usuário'}</span>
              <div className="flex items-center space-x-3 mt-0.5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-1">
                  <Crown size={8} className="text-zenit-accent opacity-70" />
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zenit-text-tertiary">LVL {userData?.level || 1}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-zenit-border-primary" />
                <NotificationCenter userId={userData?.id || ''} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 opacity-0 pointer-events-none">
          {/* Hidden but kept for spacing balance if needed, or removed */}
          <div className="w-10 h-10" />
        </div>
      </header>

      {/* AI Mentor Hero */}
      <section className="relative overflow-hidden group rounded-[3.5rem] bg-zenit-glass border border-zenit-glass-border p-12 mb-20 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Brain size={180} className="text-zenit-accent" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-10">
          <div className="relative">
            <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-zenit-accent via-zenit-crimson to-zenit-accent p-0.5 animate-pulse-slow">
              <div className="w-full h-full rounded-[2.4rem] bg-zenit-black flex items-center justify-center overflow-hidden border-2 border-zenit-black">
                <InfinityAI isResponding={false} />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl bg-emerald-500 border-4 border-zenit-black flex items-center justify-center shadow-lg">
              <Zap size={16} className="text-white animate-pulse" />
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="px-3 py-1 bg-zenit-accent/10 text-zenit-accent text-[7px] font-black uppercase tracking-[0.4em] rounded-full border border-zenit-accent/20 italic">Acesso Premium</div>
                <div className="flex space-x-1">
                  {[1, 2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-zenit-accent/40 animate-ping" style={{ animationDelay: `${i * 0.2}s` }} />)}
                </div>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-black text-zenit-text-primary tracking-tighter italic leading-none">
                CENTRAL <span className="text-zenit-accent">ZENITH</span>
              </h2>
              <p className="text-[10px] text-zenit-text-tertiary font-black tracking-[0.2em] max-w-xs mx-auto leading-relaxed uppercase italic">
                Sua interface neural para otimização humana. Como deseja evoluir hoje?
              </p>
            </div>

            <button 
              onClick={() => setIsAIOpen(true)}
              className="w-full max-w-[200px] mx-auto px-8 py-4 bg-zenit-text-primary text-zenit-black rounded-[2rem] text-[9px] font-black uppercase tracking-[0.5em] shadow-xl shadow-zenit-accent/10 active:scale-95 transition-all flex items-center justify-center space-x-3 italic"
            >
              <MessageSquare size={14} />
              <span>Diálogo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Access - Bento Grid Style */}
      <section className="space-y-8 px-1 mb-20">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center space-x-5">
            <div className="w-1 h-5 bg-zenit-scarlet rounded-full shadow-[0_0_20px_rgba(255,0,0,0.5)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] h-full text-white italic leading-none">Módulos Ativos</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-5">
          {/* NEXUS - Large Featured Card */}
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('nexus')}
            className="col-span-2 relative group p-0.5 rounded-[3rem] bg-gradient-to-br from-zenit-scarlet/20 via-transparent to-transparent overflow-hidden cursor-pointer"
          >
            <div className="p-10 rounded-[2.9rem] bg-zenit-glass backdrop-blur-xl border border-zenit-glass-border flex items-center justify-between shadow-2xl">
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 rounded-2xl bg-zenit-surface-2 flex items-center justify-center text-zenit-scarlet border border-zenit-border-primary group-hover:scale-110 transition-all duration-500">
                  <Zap size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-2xl font-display font-black text-zenit-text-primary tracking-tighter italic leading-none uppercase">NEXUS</h4>
                  <p className="text-[7.5px] font-black uppercase tracking-[0.5em] text-zenit-text-tertiary mt-2 italic leading-none">Neural Connectivity</p>
                </div>
              </div>
              <div className="flex -space-x-4 opacity-20 group-hover:opacity-100 transition-all duration-500">
                {[1, 2].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border border-zenit-border-primary bg-zenit-surface-2 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-zenit-scarlet animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <QuickAction 
            icon={<Wallet />} 
            label="Finanças" 
            onClick={() => setActiveTab('finance')} 
            color="cyan"
          />
          <QuickAction 
            icon={<Target />} 
            label="Hábitos" 
            onClick={() => setActiveTab('tasks')} 
            color="cyan"
          />
          <QuickAction 
            icon={<Dumbbell />} 
            label="Exercícios" 
            onClick={() => setActiveTab('exercises')} 
            color="cyan"
          />
          <QuickAction 
            icon={<Gamepad2 />} 
            label="Mental" 
            onClick={() => setActiveTab('gym')} 
            color="cyan"
          />
        </div>
      </section>

      {/* Today's Routine */}
      <section className="space-y-8 px-1 mb-20">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="w-1 h-4 bg-zenit-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-zenit-text-primary italic leading-none">Ordem do Dia</h3>
          </div>
        </div>
        <div className="rounded-[3rem] bg-zenit-glass border border-zenit-glass-border p-4 overflow-hidden shadow-2xl">
          <RoutineSystem t={t} userData={userData} />
        </div>
      </section>

      {/* Sincronização de Protocolo (Timer) - Repositioned to bottom */}
      <section className="space-y-8 px-1 mb-20">
        <div className="flex items-center justify-between px-6">
          <div className="flex items-center space-x-5">
            <div className="w-1.5 h-6 bg-zenit-accent rounded-full shadow-[0_0_25px_var(--accent-glow)]" />
            <h3 className="text-sm font-black text-white uppercase tracking-[0.6em] italic leading-none">Timeline Protocol</h3>
          </div>
          <div className="flex items-center space-x-3 text-zenit-accent">
             <Timer size={18} className="animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sync Ativo</span>
          </div>
        </div>
        
        <div className="w-full rounded-[4rem] overflow-hidden border border-zenit-glass-border bg-zenit-glass shadow-2xl p-3">
          <FocusTimer t={t} />
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
