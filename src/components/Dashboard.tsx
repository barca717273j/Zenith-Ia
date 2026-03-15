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
import { Zap, Target, TrendingUp, Wallet, User, ChevronRight, MessageSquare, Sparkles, Quote, Gamepad2, Brain, Activity, ArrowUpRight, Timer, Dumbbell, Flame, Book, Compass } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';

interface DashboardProps {
  userData: any;
  t: any;
  setActiveTab: (tab: string) => void;
  onUpdate: () => Promise<void> | void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userData, t, setActiveTab, onUpdate }) => {
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
              className="w-16 h-16 rounded-2xl border-2 border-white/5 p-0.5 bg-white/[0.02] relative group"
            >
              <div className="w-full h-full rounded-[14px] bg-zenith-black flex items-center justify-center overflow-hidden relative z-10 border border-white/10">
                {userData?.photo_url ? (
                  <img src={userData.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={28} className="text-white/10" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zenith-scarlet rounded-lg flex items-center justify-center border border-zenith-black z-20">
                <Zap size={10} className="text-white" />
              </div>
            </motion.button>

            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">{t.dashboard.welcome}</p>
              <h1 className="text-2xl font-bold font-display tracking-tight text-white uppercase">
                {userData?.display_name || 'Zenith'}
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-4">
            <NotificationCenter userId={userData?.id} />
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20 mb-1">Life Score</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-5xl font-display font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {String(lifeScore).padStart(3, '0')}
                </span>
                <span className="text-[10px] font-bold text-zenith-scarlet">PTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Block */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-5 space-y-3 border-white/5 bg-white/[0.01] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-electric-blue/20 group-hover:bg-zenith-electric-blue/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[8px] text-white/20 uppercase font-bold tracking-[0.2em]">{t.gamification.xp}</p>
              <Zap size={10} className="text-zenith-electric-blue" />
            </div>
            <p className="text-2xl font-display font-bold tracking-tighter">{xp.toLocaleString()}</p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(xp % 100)}%` }}
                className="h-full bg-zenith-electric-blue shadow-[0_0_10px_rgba(0,112,243,0.5)]" 
              />
            </div>
          </div>

          <div className="glass-card p-5 space-y-3 border-white/5 bg-white/[0.01] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-scarlet/20 group-hover:bg-zenith-scarlet/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[8px] text-white/20 uppercase font-bold tracking-[0.2em]">{t.gamification.streak}</p>
              <Flame size={10} className="text-zenith-scarlet" />
            </div>
            <p className="text-2xl font-display font-bold tracking-tighter">{streak}D</p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(streak % 7) * 14.28}%` }}
                className="h-full bg-zenith-scarlet shadow-[0_0_10px_rgba(255,36,0,0.5)]" 
              />
            </div>
          </div>

          <div className="glass-card p-5 space-y-3 border-white/5 bg-white/[0.01] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-all" />
            <div className="flex justify-between items-center">
              <p className="text-[8px] text-white/20 uppercase font-bold tracking-[0.2em]">{t.gamification.dailyProgress}</p>
              <Target size={10} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-display font-bold tracking-tighter">{dailyProgress}%</p>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${dailyProgress}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Life Score Section - Removed from here as it's now at the top */}

      {/* Today's Routines */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Zap size={14} className="text-zenith-scarlet" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t.nav.routine}</h3>
          </div>
          <button onClick={() => setActiveTab('tasks')} className="text-[9px] font-bold uppercase tracking-widest text-zenith-scarlet flex items-center space-x-1">
            <span>Ver Tudo</span>
            <ArrowUpRight size={10} />
          </button>
        </div>
        <div className="glass-card p-2 border-white/5 bg-white/[0.01]">
          <RoutineSystem t={t} />
        </div>
      </section>

      {/* AI Mentor Mini Card */}
      <section 
        className="glass-card p-6 flex items-center justify-between relative group cursor-pointer overflow-hidden border-white/5 bg-white/[0.01]" 
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
            <h2 className="text-lg font-display font-bold text-white tracking-tight uppercase">
              {t.dashboard.aiGreeting.split('.')[0]}
            </h2>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
          <MessageSquare size={18} className="text-zenith-cyan" />
        </div>
        
        {/* Subtle Glow */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-zenith-cyan/5 blur-[40px] rounded-full pointer-events-none" />
      </section>

      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        t={t} 
        userData={userData}
        onUpdate={onUpdate}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mascote & Missions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
          <MascoteBlock 
            state={userData?.energy_level > 70 ? 'energized' : userData?.energy_level > 30 ? 'happy' : 'tired'} 
            t={t} 
          />
          <DailyMissions t={t} userData={userData} />
        </div>

        {/* Energy & Focus Stats */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Activity size={14} className="text-zenith-scarlet" />
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t.dashboard.energyLevel}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-display font-bold">{userData?.energy_level || 100}%</p>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-zenith-scarlet shadow-[0_0_8px_rgba(255,36,0,0.4)]" style={{ width: `${userData?.energy_level || 100}%` }} />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Brain size={14} className="text-zenith-scarlet" />
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t.dashboard.mentalFocus}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-display font-bold">82%</p>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-zenith-scarlet w-[82%] shadow-[0_0_8px_rgba(255,36,0,0.4)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('exercises')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-scarlet/10 bg-zenith-scarlet/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
              <Dumbbell size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.nav.exercises}</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('finance')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-scarlet/10 bg-zenith-scarlet/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.nav.finance}</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('journal')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-scarlet/10 bg-zenith-scarlet/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
              <Book size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.journal.title}</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('stats')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-scarlet/10 bg-zenith-scarlet/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Analytics</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('map')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-scarlet/10 bg-zenith-scarlet/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
              <Compass size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.map.title}</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('break')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-scarlet/10 bg-zenith-scarlet/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
              <Gamepad2 size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Mental Gym</span>
          </motion.button>
        </div>

        {/* Focus Timer Mini */}
        <section className="space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2 px-1">
            <Timer size={14} className="text-zenith-scarlet" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Sessão de Foco</h3>
          </div>
          <div onClick={() => setActiveTab('focus')} className="glass-card p-5 cursor-pointer hover:bg-white/[0.02] transition-all">
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
    className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.01] transition-all relative overflow-hidden group"
  >
    {/* Background Glow */}
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
      color === 'purple' ? 'bg-zenith-electric-blue' : 'bg-zenith-cyan'
    }`} />


    <div className="flex justify-between items-center relative z-10">
      <div className="w-12 h-12 rounded-[20px] bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
        {icon}
      </div>
      <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/10">
        <TrendingUp size={12} />
        <span className="text-[10px] font-bold uppercase tracking-tighter">{trend}</span>
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold mb-2">{label}</p>
      <p className="text-3xl font-display font-bold tracking-tighter text-white">{value}</p>
    </div>
  </motion.div>
);
