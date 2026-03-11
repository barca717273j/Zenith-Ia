import React, { useState, useEffect } from 'react';
//import { InfinityAI } from './InfinityAI';
//import { AIAssistant } from './AIAssistant';
//import { ZenithLogo } from './ZenithLogo';
//import { RoutineSystem } from './RoutineSystem';
//import { DailyMissions } from './DailyMissions';
//import { FocusTimer } from './FocusTimer';
//import { motion } from "framer-motion";
import { Zap, Target, TrendingUp, Wallet, User, ChevronRight, MessageSquare, Sparkles, Quote, Gamepad2, Brain, Activity, ArrowUpRight, Timer, Dumbbell } from 'lucide-react';
import { useGamification } from './GamificationContext';

interface DashboardProps {
  userData: any;
  t: any;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userData, t, setActiveTab }) => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const { level, levelName } = useGamification();

  return (
    <div className="p-6 space-y-12 pb-32 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-5">
          <div className="relative group">
            <ZenithLogo size={56} className="text-white relative z-10" />
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-zenith-electric-blue blur-2xl -z-10"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold font-display tracking-tighter leading-none uppercase text-white">Zenith</h1>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-zenith-electric-blue/10 px-3 py-1 rounded-lg border border-zenith-electric-blue/20">
                <Sparkles size={12} className="text-zenith-electric-blue animate-pulse" />
                <span className="text-zenith-electric-blue text-[10px] font-bold uppercase tracking-[0.3em]">{levelName}</span>
              </div>
              <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">LVL {level}</span>
            </div>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('profile')}
          className="w-16 h-16 rounded-[24px] border border-white/5 p-1 bg-white/[0.02] relative group backdrop-blur-xl"
        >
          <div className="w-full h-full rounded-[20px] bg-zenith-black flex items-center justify-center overflow-hidden relative z-10 border border-white/10">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={32} className="text-white/10" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-zenith-electric-blue to-zenith-cyan opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
        </motion.button>
      </header>

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

      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} t={t} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Energy & Focus Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Activity size={14} className="text-zenith-cyan" />
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t.dashboard.energyLevel}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-display font-bold">94%</p>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-zenith-cyan w-[94%] shadow-[0_0_8px_#00d2ff]" />
              </div>
            </div>
          </div>
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Brain size={14} className="text-zenith-electric-blue" />
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t.dashboard.mentalFocus}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-display font-bold">82%</p>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-zenith-electric-blue w-[82%] shadow-[0_0_8px_#0066ff]" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Routines */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <Zap size={14} className="text-zenith-cyan" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t.nav.routine}</h3>
            </div>
            <button onClick={() => setActiveTab('tasks')} className="text-[9px] font-bold uppercase tracking-widest text-zenith-cyan flex items-center space-x-1">
              <span>Ver Tudo</span>
              <ArrowUpRight size={10} />
            </button>
          </div>
          <div onClick={() => setActiveTab('tasks')} className="glass-card p-5 cursor-pointer hover:bg-white/[0.02] transition-all">
            <RoutineSystem t={t} />
          </div>
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('exercises')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-cyan/10 bg-zenith-cyan/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-cyan/10 flex items-center justify-center text-zenith-cyan">
              <Dumbbell size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.nav.exercises}</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('finance')}
            className="glass-card p-5 flex flex-col items-center justify-center space-y-3 border-zenith-electric-blue/10 bg-zenith-electric-blue/[0.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-zenith-electric-blue/10 flex items-center justify-center text-zenith-electric-blue">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.nav.finance}</span>
          </motion.button>
        </div>

        {/* Focus Timer Mini */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <Timer size={14} className="text-zenith-electric-blue" />
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
