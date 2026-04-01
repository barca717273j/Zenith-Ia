import React, { useState, useEffect } from 'react';
import { InfinityAI } from './InfinityAI';
import { AIAssistant } from './AIAssistant';
import { ZenithLogo } from './ZenithLogo';
import { AdminPanel } from './AdminPanel';
import { RoutineSystem } from './RoutineSystem';
import { DailyMissions } from './DailyMissions';
import { FocusTimer } from './FocusTimer';
import { NotificationCenter } from './NotificationCenter';
import { motion } from 'motion/react';
import { FloatingThemeToggle } from './FloatingThemeToggle';
import { Zap, Target, TrendingUp, Wallet, User, ChevronRight, MessageSquare, Sparkles, Quote, Gamepad2, Brain, Activity, ArrowUpRight, Timer, Dumbbell, Flame, Book, Compass, Crown } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';
import { useUser } from '../contexts/UserContext';
import { TIER_LIMITS, SubscriptionTier } from '../types';

interface DashboardProps {
  t: any;
  setActiveTab: (tab: string) => void;
}

const UsageStats: React.FC<{ t: any; userData: any }> = ({ t, userData }) => {
  const tier = userData?.subscription_tier || 'free';
  const limits = TIER_LIMITS[tier as SubscriptionTier] || TIER_LIMITS.free;

  const stats = [
    {
      label: t.usage.aiMessages,
      current: userData?.ai_messages_count || 0,
      limit: limits.aiMessagesPerDay,
      icon: <MessageSquare size={14} className="text-zenith-cyan" />,
    },
    {
      label: t.usage.routines,
      current: userData?.habits_count || 0,
      limit: limits.routinesPerDay,
      icon: <Zap size={14} className="text-zenith-scarlet" />,
    },
    {
      label: t.usage.actions,
      current: userData?.actions_count || 0,
      limit: limits.actionsPerDay,
      icon: <Activity size={14} className="text-emerald-500" />,
    },
    {
      label: t.usage.aiGenerations,
      current: userData?.ai_generations_count || 0,
      limit: limits.aiGenerationsPerDay,
      icon: <Sparkles size={14} className="text-amber-500" />,
    }
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center space-x-3 px-1">
        <div className="w-1 h-4 bg-zenith-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]" />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zenith-text-secondary">{t.usage.title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => {
          const isUnlimited = stat.limit === Infinity;
          const percentage = isUnlimited ? 0 : Math.min((stat.current / stat.limit) * 100, 100);
          const remaining = isUnlimited ? t.usage.unlimited : Math.max(stat.limit - stat.current, 0);

          return (
            <div key={i} className="premium-card premium-card-hover space-y-4 group bg-zenith-surface-1 border-zenith-border-primary">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-zenith-surface-2 border border-zenith-border-primary group-hover:border-zenith-accent/30 transition-all shadow-inner">
                  {stat.icon}
                </div>
                <span className="text-[9px] font-bold text-zenith-text-tertiary uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <p className="text-2xl font-display font-bold text-zenith-text-primary tracking-tighter">
                    {stat.current}{!isUnlimited && <span className="text-xs text-zenith-text-tertiary font-normal ml-1 opacity-50">/{stat.limit}</span>}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 bg-zenith-surface-2 rounded-full overflow-hidden border border-zenith-border-primary">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                      className={`h-full ${percentage > 90 ? 'bg-zenith-accent' : 'bg-zenith-accent/60'} shadow-[0_0_12px_var(--accent-glow)]`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-widest opacity-40">
                      {isUnlimited ? t.usage.unlimited : `${remaining} ${t.usage.remaining}`}
                    </span>
                  </div>
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
      // In a real app, we'd show a custom modal or toast
      console.warn(limitCheck.message);
      return;
    }
    await incrementUsage('actions');
    onClick();
  };

  return (
    <motion.button
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleAction}
      className="premium-card premium-card-hover flex flex-col items-center justify-center space-y-4 group relative overflow-hidden bg-zenith-surface-1 border-zenith-border-primary"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zenith-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all border bg-zenith-surface-2 border-zenith-border-primary text-zenith-accent group-hover:border-zenith-accent/40 group-hover:shadow-[0_0_25px_var(--accent-glow)] relative z-10 shadow-inner">
        {React.cloneElement(icon as any, { size: 24 })}
      </div>
      
      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zenith-text-secondary group-hover:text-zenith-text-primary transition-colors relative z-10">
        {label}
      </span>
    </motion.button>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ t, setActiveTab }) => {
  const { userData, refreshUserData } = useUser();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [hotStreaks, setHotStreaks] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const { xp, level, levelName, streak, lifeScore, refreshStats } = useGamification();

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      setIsAdminOpen(true);
      setLogoClicks(0);
    }
    // Reset clicks after 3 seconds of inactivity
    setTimeout(() => setLogoClicks(0), 3000);
  };

  useEffect(() => {
    fetchHotStreaks();
    fetchRoutines();
    refreshStats();
  }, [userData?.id]);

  const fetchHotStreaks = async () => {
    if (!userData?.id) return;
    const { data } = await supabase
      .from('hot_streaks')
      .select('*')
      .or(`user1_id.eq.${userData.id},user2_id.eq.${userData.id}`)
      .eq('status', 'active');
    if (data) setHotStreaks(data);
  };

  const fetchRoutines = async () => {
    if (!userData?.id) return;
    const { data } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userData.id);
    if (data) setRoutines(data);
  };

  const dailyProgress = routines.length > 0 
    ? Math.round((routines.filter(r => r.completed).length / routines.length) * 100) 
    : 0;

  const isAdmin = userData?.role === 'admin';

  return (
    <div className="p-6 space-y-12 pb-32 max-w-4xl mx-auto min-h-screen">
      {/* Header & Life Score */}
      <header className="flex flex-col space-y-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-5">
            <motion.div 
              onClick={handleLogoClick}
              className="cursor-pointer"
            >
              <ZenithLogo size={48} />
            </motion.div>
            <motion.button 
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('profile')}
              className="w-24 h-24 rounded-[2rem] border border-zenith-accent/30 p-1 bg-zenith-surface-1 relative group shadow-[0_0_30px_var(--accent-glow)]"
            >
              <div className="w-full h-full rounded-[1.8rem] bg-zenith-black flex items-center justify-center overflow-hidden relative z-10 border border-zenith-border-primary">
                {(userData?.avatar_url || userData?.photo_url) ? (
                  <img src={userData.avatar_url || userData.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.id}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-zenith-accent rounded-xl flex items-center justify-center border-4 border-zenith-black z-20 shadow-xl">
                <Zap size={14} className="text-white fill-white" />
              </div>
              
              {/* Inner Glow */}
              <div className="absolute inset-0 rounded-[2rem] bg-zenith-accent/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zenith-text-tertiary">{t.dashboard.welcome}</p>
              </div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-zenith-text-primary uppercase leading-tight">
                {userData?.full_name || userData?.display_name || 'Zenith'}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-6">
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <div className="flex items-center space-x-2 bg-zenith-accent/10 border border-zenith-accent/20 px-4 py-2 rounded-2xl text-zenith-accent shadow-[0_0_15px_var(--accent-glow)]">
                  <Crown size={14} className="fill-zenith-accent" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">{t.common.adminMode}</span>
                </div>
              )}
              <NotificationCenter userId={userData?.id} />
            </div>
            <div className="flex flex-col items-end group cursor-pointer" onClick={() => setActiveTab('profile')}>
              <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-zenith-text-tertiary mb-2 group-hover:text-zenith-accent transition-colors">{t.gamification.lifeScore}</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl font-display font-bold text-zenith-text-primary tracking-tighter group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {String(lifeScore).padStart(3, '0')}
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-zenith-accent leading-none uppercase tracking-widest drop-shadow-[0_0_8px_var(--accent-glow)]">{t.common.pts}</span>
                  <TrendingUp size={12} className="text-emerald-500 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Block */}
        <div className="grid grid-cols-3 gap-5">
          <div className="premium-card premium-card-hover space-y-4 relative overflow-hidden group bg-zenith-surface-1 border-zenith-border-primary">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-accent/20 group-hover:bg-zenith-accent/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em]">{t.gamification.xp}</p>
              <div className="p-1.5 rounded-lg bg-zenith-accent/10 border border-zenith-accent/20">
                <Zap size={14} className="text-zenith-accent fill-zenith-accent" />
              </div>
            </div>
            <p className="text-4xl font-display font-bold tracking-tighter text-zenith-text-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{xp.toLocaleString()}</p>
            <div className="h-1.5 bg-zenith-surface-2 rounded-full overflow-hidden border border-zenith-border-primary">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(xp % 100)}%` }}
                className="h-full bg-zenith-accent shadow-[0_0_15px_var(--accent-glow)]" 
              />
            </div>
          </div>

          <div className="premium-card premium-card-hover space-y-4 relative overflow-hidden group bg-zenith-surface-1 border-zenith-border-primary">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-accent/20 group-hover:bg-zenith-accent/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em]">{t.gamification.streak}</p>
              <div className="p-1.5 rounded-lg bg-zenith-accent/10 border border-zenith-accent/20">
                <Flame size={14} className="text-zenith-accent fill-zenith-accent" />
              </div>
            </div>
            <p className="text-4xl font-display font-bold tracking-tighter text-zenith-text-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{streak}D</p>
            <div className="h-1.5 bg-zenith-surface-2 rounded-full overflow-hidden border border-zenith-border-primary">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(streak % 7) * 14.28}%` }}
                className="h-full bg-zenith-accent shadow-[0_0_15px_var(--accent-glow)]" 
              />
            </div>
          </div>

          <div className="premium-card premium-card-hover space-y-4 relative overflow-hidden group bg-zenith-surface-1 border-zenith-border-primary">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em]">{t.gamification.dailyProgress}</p>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Target size={14} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-4xl font-display font-bold tracking-tighter text-zenith-text-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{dailyProgress}%</p>
            <div className="h-1.5 bg-zenith-surface-2 rounded-full overflow-hidden border border-zenith-border-primary">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${dailyProgress}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Premium Banner */}
      {!userData?.subscription_tier || userData.subscription_tier === 'free' ? (
        <motion.section 
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveTab('subscription')}
          className="premium-card p-8 bg-gradient-to-br from-zenith-accent to-zenith-accent/80 border-zenith-accent/30 cursor-pointer relative overflow-hidden group shadow-[0_20px_40px_rgba(255,59,59,0.2)]"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md shadow-inner">
                <Crown size={32} className="text-white fill-white" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-white">Zenith Premium</h3>
                <p className="text-[11px] text-white/90 uppercase font-bold tracking-[0.2em]">{t.common.unlockAllFunctions}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white text-zenith-accent px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all">
              <span>{t.common.viewPlans}</span>
              <ChevronRight size={16} />
            </div>
          </div>
          
          {/* Animated Glow */}
          <motion.div 
            animate={{ 
              x: ['-100%', '200%'],
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "linear",
              repeatDelay: 1.5
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
          />
          
          {/* Background Pattern */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-black/5 rounded-full blur-3xl" />
        </motion.section>
      ) : (
        <div className="premium-card p-5 bg-zenith-surface-1 border-zenith-border-primary flex items-center justify-between group hover:border-zenith-accent/30 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-xl bg-zenith-accent/10">
              <Crown size={20} className="text-zenith-accent fill-zenith-accent" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zenith-text-tertiary mb-0.5">
                {t.common.activePlan}
              </span>
              <span className="text-sm font-bold text-zenith-text-primary uppercase tracking-widest">
                {userData.subscription_tier}
              </span>
            </div>
          </div>
          {userData.plan_expires_at && (
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zenith-text-tertiary opacity-60 mb-0.5">
                {t.common.expiresAt}
              </span>
              <span className="text-[10px] font-bold text-zenith-text-secondary">
                {new Date(userData.plan_expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Usage Stats */}
      <UsageStats t={t} userData={userData} />

      {/* Today's Routines */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-4 bg-zenith-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zenith-text-secondary">{t.nav.routine}</h3>
          </div>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-zenith-accent flex items-center space-x-2 hover:brightness-125 transition-all group"
          >
            <span>{t.common.seeAll}</span>
            <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
        <div className="premium-card p-4 border-zenith-border-primary bg-zenith-surface-1 shadow-2xl">
          <RoutineSystem t={t} userData={userData} />
        </div>
      </section>

      {/* AI Mentor Mini Card */}
      <section 
        className="premium-card premium-card-hover flex items-center justify-between relative group cursor-pointer overflow-hidden p-8 bg-zenith-surface-1 border-zenith-border-primary" 
        onClick={() => setIsAIOpen(true)}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zenith-accent/5 via-transparent to-zenith-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex items-center space-x-6 relative z-10">
          <div className="w-20 h-20 relative">
            <div className="absolute inset-0 bg-zenith-accent/20 blur-3xl rounded-full animate-pulse-glow" />
            <InfinityAI isResponding={false} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3 text-zenith-accent">
              <div className="p-1.5 rounded-lg bg-zenith-accent/10 border border-zenith-accent/20">
                <Brain size={16} className="fill-zenith-accent/20" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] drop-shadow-[0_0_8px_var(--accent-glow)]">{t.dashboard.infinityMentor}</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-zenith-text-primary tracking-tight uppercase leading-tight">
              {t.dashboard.aiGreeting.split('.')[0]}
            </h2>
            <p className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.2em] opacity-60">
              {t.dashboard.aiGreeting.split('.')[1] || 'Sua evolução é infinita'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-zenith-surface-2 flex items-center justify-center border border-zenith-border-primary group-hover:border-zenith-accent/40 group-hover:shadow-[0_0_25px_var(--accent-glow)] transition-all shadow-inner">
            <MessageSquare size={24} className="text-zenith-accent drop-shadow-[0_0_8px_var(--accent-glow)]" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-zenith-surface-2 flex items-center justify-center border border-zenith-border-primary group-hover:bg-zenith-accent/10 transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight size={18} className="text-zenith-text-tertiary group-hover:text-zenith-accent" />
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-zenith-accent/5 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-zenith-accent/5 blur-[60px] rounded-full pointer-events-none" />
      </section>

      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        t={t} 
      />

      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] bg-zenith-black">
          <AdminPanel t={t} onBack={() => setIsAdminOpen(false)} />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missions */}
        <div className="md:col-span-2">
          <DailyMissions t={t} userData={userData} />
        </div>

        {/* Energy & Focus Stats */}
        <div className="grid grid-cols-2 gap-5 md:col-span-2">
          <div className="premium-card premium-card-hover space-y-4 group bg-zenith-surface-1 border-zenith-border-primary">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-zenith-accent/10 border border-zenith-accent/20 shadow-inner">
                <Activity size={18} className="text-zenith-accent" />
              </div>
              <span className="text-[10px] font-bold text-zenith-text-tertiary uppercase tracking-[0.3em]">{t.dashboard.energyLevel}</span>
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-display font-bold text-zenith-text-primary tracking-tighter">{userData?.energy_level || 100}%</p>
              <div className="h-2 bg-zenith-surface-2 rounded-full overflow-hidden border border-zenith-border-primary">
                <div className="h-full bg-zenith-accent shadow-[0_0_15px_var(--accent-glow)] transition-all duration-1000" style={{ width: `${userData?.energy_level || 100}%` }} />
              </div>
            </div>
          </div>
          <div className="premium-card premium-card-hover space-y-4 group bg-zenith-surface-1 border-zenith-border-primary">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-zenith-accent/10 border border-zenith-accent/20 shadow-inner">
                <Brain size={18} className="text-zenith-accent" />
              </div>
              <span className="text-[10px] font-bold text-zenith-text-tertiary uppercase tracking-[0.3em]">{t.dashboard.mentalFocus}</span>
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-display font-bold text-zenith-text-primary tracking-tighter">82%</p>
              <div className="h-2 bg-zenith-surface-2 rounded-full overflow-hidden border border-zenith-border-primary">
                <div className="h-full bg-zenith-accent w-[82%] shadow-[0_0_15px_var(--accent-glow)] transition-all duration-1000" />
              </div>
            </div>
          </div>
        </div>

      {/* Quick Actions */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3 px-1">
          <div className="w-1 h-4 bg-zenith-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zenith-text-secondary">{t.common.quickAccess}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <QuickAction 
            icon={<Activity />} 
            label="Nexus" 
            onClick={() => setActiveTab('social')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Dumbbell />} 
            label={t.nav.exercises} 
            onClick={() => setActiveTab('exercises')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Wallet />} 
            label={t.nav.finance} 
            onClick={() => setActiveTab('finance')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Book />} 
            label={t.journal.title} 
            onClick={() => setActiveTab('journal')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Gamepad2 />} 
            label="Mental Gym" 
            onClick={() => setActiveTab('break')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Compass />} 
            label={t.map.title} 
            onClick={() => setActiveTab('map')} 
            color="scarlet"
          />
        </div>
      </section>

        {/* Focus Timer Mini */}
        <section className="space-y-6 md:col-span-2">
          <div className="flex items-center space-x-3 px-1">
            <div className="w-1 h-4 bg-zenith-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zenith-text-secondary">{t.common.focusSession}</h3>
          </div>
          <div onClick={() => setActiveTab('focus')} className="premium-card premium-card-hover cursor-pointer p-1">
            <FocusTimer t={t} />
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; trend: string; color: 'purple' | 'cyan' }> = ({ icon, label, value, trend, color }) => (
  <motion.div
    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.04)' }}
    className="glass-card p-8 space-y-6 border-zenith-border-primary bg-zenith-surface-1 transition-all relative overflow-hidden group"
  >
    {/* Background Glow */}
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
      color === 'purple' ? 'bg-zenith-electric-blue' : 'bg-zenith-cyan'
    }`} />


    <div className="flex justify-between items-center relative z-10">
      <div className="w-12 h-12 rounded-[20px] bg-zenith-surface-2 flex items-center justify-center border border-zenith-border-primary group-hover:border-zenith-border-primary transition-colors">
        {icon}
      </div>
      <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/10">
        <TrendingUp size={12} />
        <span className="text-[10px] font-bold uppercase tracking-tighter">{trend}</span>
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-zenith-text-tertiary text-[10px] uppercase tracking-[0.3em] font-bold mb-2">{label}</p>
      <p className="text-3xl font-display font-bold tracking-tighter text-zenith-text-primary">{value}</p>
    </div>
  </motion.div>
);
