import React, { useState, useEffect } from 'react';
import { InfinityAI } from './InfinityAI';
import { AIAssistant } from './AIAssistant';
import { ZenithLogo } from './ZenithLogo';
import { RoutineSystem } from './RoutineSystem';
import { DailyMissions } from './DailyMissions';
import { FocusTimer } from './FocusTimer';
import { NotificationCenter } from './NotificationCenter';
import { MascoteBlock } from './MascoteBlock';
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
    <section className="space-y-4">
      <div className="flex items-center space-x-2 px-1">
        <TrendingUp size={14} className="text-zenith-scarlet" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-secondary">{t.usage.title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => {
          const isUnlimited = stat.limit === Infinity;
          const percentage = isUnlimited ? 0 : Math.min((stat.current / stat.limit) * 100, 100);
          const remaining = isUnlimited ? t.usage.unlimited : Math.max(stat.limit - stat.current, 0);

          return (
            <div key={i} className="glass-card p-4 space-y-3 bg-zenith-surface-1 border-zenith-border-primary">
              <div className="flex items-center justify-between">
                {stat.icon}
                <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <p className="text-lg font-display font-bold text-zenith-text-primary">
                    {stat.current}{!isUnlimited && <span className="text-[10px] text-zenith-text-tertiary font-normal">/{stat.limit}</span>}
                  </p>
                  <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase">
                    {isUnlimited ? t.usage.unlimited : `${remaining} ${t.usage.remaining}`}
                  </span>
                </div>
                <div className="h-1 bg-zenith-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                    className={`h-full ${percentage > 90 ? 'bg-zenith-scarlet' : 'bg-zenith-cyan'} shadow-[0_0_8px_rgba(0,112,243,0.4)]`}
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

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; color: 'scarlet' | 'cyan' }> = ({ icon, label, onClick, color }) => {
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
      whileHover={{ y: -2, backgroundColor: 'var(--zenith-surface-2)' }}
      whileTap={{ scale: 0.98 }}
      onClick={handleAction}
      className="glass-card p-4 flex flex-col items-center justify-center space-y-3 border-zenith-border-primary bg-zenith-surface-1 transition-all relative overflow-hidden group rounded-2xl"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${
        color === 'scarlet' 
          ? 'bg-zenith-scarlet/10 border-zenith-scarlet/20 text-zenith-scarlet group-hover:bg-zenith-scarlet/20' 
          : 'bg-zenith-cyan/10 border-zenith-cyan/20 text-zenith-cyan group-hover:bg-zenith-cyan/20'
      }`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-secondary group-hover:text-zenith-text-primary transition-colors">
        {label}
      </span>
    </motion.button>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ t, setActiveTab }) => {
  const { userData, refreshUserData } = useUser();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const { xp, level, levelName, streak, lifeScore, dailyProgress, refreshStats } = useGamification();
  const [hotStreaks, setHotStreaks] = useState<any[]>([]);
  const identity = userData?.identity || 'discipline_warrior';
  const mascoteState = userData?.mascote_state || 'happy';

  useEffect(() => {
    fetchHotStreaks();
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

  return (
    <div className="p-6 space-y-12 pb-32 max-w-4xl mx-auto min-h-screen">
      {/* Header & Life Score */}
      <header className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('profile')}
              className="w-16 h-16 rounded-2xl border-2 border-zenith-border-primary p-0.5 bg-zenith-surface-1 relative group"
            >
              <div className="w-full h-full rounded-[14px] bg-zenith-black flex items-center justify-center overflow-hidden relative z-10 border border-zenith-border-primary">
                {(userData?.avatar_url || userData?.photo_url) ? (
                  <img src={userData.avatar_url || userData.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.id}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zenith-scarlet rounded-lg flex items-center justify-center border border-zenith-black z-20">
                <Zap size={10} className="text-white" />
              </div>
            </motion.button>

            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zenith-text-tertiary">{t.dashboard.welcome}</p>
              <h1 className="text-2xl font-bold font-display tracking-tight text-zenith-text-primary uppercase">
                {userData?.full_name || userData?.display_name || 'Zenith'}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-4">
            <NotificationCenter userId={userData?.id} />
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-zenith-text-tertiary mb-1">Life Score</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-5xl font-display font-bold text-zenith-text-primary tracking-tighter">
                  {String(lifeScore).padStart(3, '0')}
                </span>
                <span className="text-[10px] font-bold text-zenith-scarlet">PTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Block */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-5 space-y-3 border-zenith-border-primary bg-zenith-surface-1 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-electric-blue/20 group-hover:bg-zenith-electric-blue/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[8px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em]">{t.gamification.xp}</p>
              <Zap size={10} className="text-zenith-electric-blue" />
            </div>
            <p className="text-2xl font-display font-bold tracking-tighter text-zenith-text-primary">{xp.toLocaleString()}</p>
            <div className="h-1 bg-zenith-surface-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(xp % 100)}%` }}
                className="h-full bg-zenith-electric-blue shadow-[0_0_10px_rgba(0,112,243,0.5)]" 
              />
            </div>
          </div>

          <div className="glass-card p-5 space-y-3 border-zenith-border-primary bg-zenith-surface-1 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-scarlet/20 group-hover:bg-zenith-scarlet/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[8px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em]">{t.gamification.streak}</p>
              <Flame size={10} className="text-zenith-scarlet" />
            </div>
            <p className="text-2xl font-display font-bold tracking-tighter text-zenith-text-primary">{streak}D</p>
            <div className="h-1 bg-zenith-surface-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(streak % 7) * 14.28}%` }}
                className="h-full bg-zenith-scarlet shadow-[0_0_10px_rgba(255,36,0,0.5)]" 
              />
            </div>
          </div>

          <div className="glass-card p-5 space-y-3 border-zenith-border-primary bg-zenith-surface-1 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[8px] text-zenith-text-tertiary uppercase font-bold tracking-[0.2em]">{t.gamification.dailyProgress}</p>
              <Target size={10} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-display font-bold tracking-tighter text-zenith-text-primary">{dailyProgress}%</p>
            <div className="h-1 bg-zenith-surface-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${dailyProgress}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Premium Banner */}
      {!userData?.subscription_tier || userData.subscription_tier === 'free' ? (
        <motion.section 
          whileHover={{ y: -2 }}
          onClick={() => setActiveTab('subscription')}
          className="glass-card p-6 bg-gradient-to-r from-zenith-scarlet/80 to-zenith-crimson border-zenith-scarlet/30 cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
                <Crown size={24} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold uppercase tracking-tight text-white">Zenith Premium</h3>
                <p className="text-[10px] text-white/80 uppercase font-bold tracking-widest">Desbloqueie todas as funções neurais</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white text-zenith-scarlet px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-white/90 transition-all">
              <span>Ver Planos</span>
              <ChevronRight size={14} />
            </div>
          </div>
          
          {/* Animated Glow */}
          <motion.div 
            animate={{ 
              x: ['-100%', '200%'],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear",
              repeatDelay: 2
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
          />
        </motion.section>
      ) : (
        <div className="glass-card p-4 bg-zenith-surface-1 border-zenith-border-primary flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown size={16} className="text-zenith-scarlet" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zenith-text-tertiary">
              Plano Ativo: <span className="text-zenith-text-primary">{userData.subscription_tier}</span>
            </span>
          </div>
          {userData.plan_expires_at && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-zenith-text-tertiary opacity-50">
              Expira em: {new Date(userData.plan_expires_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Usage Stats */}
      <UsageStats t={t} userData={userData} />

      {/* Today's Routines */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Zap size={14} className="text-zenith-scarlet" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-secondary">{t.nav.routine}</h3>
          </div>
          <button onClick={() => setActiveTab('tasks')} className="text-[9px] font-bold uppercase tracking-widest text-zenith-scarlet flex items-center space-x-1">
            <span>Ver Tudo</span>
            <ArrowUpRight size={10} />
          </button>
        </div>
        <div className="glass-card p-2 border-zenith-border-primary bg-zenith-surface-1">
          <RoutineSystem t={t} userData={userData} />
        </div>
      </section>

      {/* AI Mentor Mini Card */}
      <section 
        className="glass-card p-6 flex items-center justify-between relative group cursor-pointer overflow-hidden border-zenith-border-primary bg-zenith-surface-1" 
        onClick={() => setIsAIOpen(true)}
      >
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 relative">
            <InfinityAI isResponding={false} />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-zenith-cyan">
              <Brain size={12} />
              <span className="text-[8px] font-bold uppercase tracking-[0.3em]">{t.dashboard.infinityMentor}</span>
            </div>
            <h2 className="text-lg font-display font-bold text-zenith-text-primary tracking-tight uppercase">
              {t.dashboard.aiGreeting.split('.')[0]}
            </h2>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-zenith-surface-2 flex items-center justify-center border border-zenith-border-primary group-hover:bg-zenith-surface-2 transition-all">
          <MessageSquare size={18} className="text-zenith-cyan" />
        </div>
        
        {/* Subtle Glow */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-zenith-cyan/5 blur-[40px] rounded-full pointer-events-none" />
      </section>

      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        t={t} 
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mascote & Missions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
          <MascoteBlock 
            state={userData?.energy_level > 70 ? 'energized' : userData?.energy_level > 30 ? 'happy' : 'tired'} 
            energyLevel={userData?.energy_level}
            t={t} 
          />
          <DailyMissions t={t} userData={userData} />
        </div>

        {/* Energy & Focus Stats */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <div className="glass-card p-4 space-y-3 bg-zenith-surface-1 border-zenith-border-primary">
            <div className="flex items-center justify-between">
              <Activity size={14} className="text-zenith-scarlet" />
              <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-widest">{t.dashboard.energyLevel}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-display font-bold text-zenith-text-primary">{userData?.energy_level || 100}%</p>
              <div className="h-1 bg-zenith-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-zenith-scarlet shadow-[0_0_8px_rgba(255,36,0,0.4)]" style={{ width: `${userData?.energy_level || 100}%` }} />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 space-y-3 bg-zenith-surface-1 border-zenith-border-primary">
            <div className="flex items-center justify-between">
              <Brain size={14} className="text-zenith-scarlet" />
              <span className="text-[8px] font-bold text-zenith-text-tertiary uppercase tracking-widest">{t.dashboard.mentalFocus}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-display font-bold text-zenith-text-primary">82%</p>
              <div className="h-1 bg-zenith-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-zenith-scarlet w-[82%] shadow-[0_0_8px_rgba(255,36,0,0.4)]" />
              </div>
            </div>
          </div>
        </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 px-1">
          <Sparkles size={14} className="text-zenith-scarlet" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-secondary">Acesso Rápido</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <QuickAction 
            icon={<Activity size={20} />} 
            label="Nexus" 
            onClick={() => setActiveTab('social')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Dumbbell size={20} />} 
            label={t.nav.exercises} 
            onClick={() => setActiveTab('exercises')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Wallet size={20} />} 
            label={t.nav.finance} 
            onClick={() => setActiveTab('finance')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Book size={20} />} 
            label={t.journal.title} 
            onClick={() => setActiveTab('journal')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Gamepad2 size={20} />} 
            label="Mental Gym" 
            onClick={() => setActiveTab('break')} 
            color="scarlet"
          />
          <QuickAction 
            icon={<Compass size={20} />} 
            label={t.map.title} 
            onClick={() => setActiveTab('map')} 
            color="scarlet"
          />
        </div>
      </section>

        {/* Focus Timer Mini */}
        <section className="space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2 px-1">
            <Timer size={14} className="text-zenith-scarlet" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zenith-text-secondary">Sessão de Foco</h3>
          </div>
          <div onClick={() => setActiveTab('focus')} className="glass-card p-5 cursor-pointer bg-zenith-surface-1 border-zenith-border-primary hover:bg-zenith-surface-2 transition-all">
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
