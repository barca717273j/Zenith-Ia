import React, { useState, useEffect } from 'react';
import { InfinityAI } from './InfinityAI';
import { AIAssistant } from './AIAssistant';
import { ZenithLogo } from './ZenithLogo';
import { RoutineSystem } from './RoutineSystem';
import { DailyMissions } from './DailyMissions';
import { FocusTimer } from './FocusTimer';
import { import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp, Wallet, User, ChevronRight, MessageSquare, Sparkles, Quote, Gamepad2, Brain, Activity, ArrowUpRight } from 'lucide-react';
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

      {/* AI Mentor Panel - The "Infinity Core" */}
      <section 
        className="glass-card p-12 flex flex-col items-center justify-center space-y-12 relative group cursor-pointer overflow-hidden border-white/5 bg-white/[0.01]" 
        onClick={() => setIsAIOpen(true)}
      >
        {/* Animated Borders */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zenith-electric-blue/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zenith-cyan/50 to-transparent" />
        
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-zenith-electric-blue/5 blur-[120px] rounded-full pointer-events-none" />
        
        <InfinityAI isResponding={false} />
        
        <div className="text-center space-y-6 relative z-10">
          <div className="flex items-center justify-center space-x-3 text-zenith-electric-blue">
            <div className="h-px w-6 bg-zenith-electric-blue/30" />
            <Brain size={18} />
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] drop-shadow-[0_0_8px_#3b82f6]">Infinity Core v4.0</span>
            <div className="h-px w-6 bg-zenith-electric-blue/30" />
          </div>
          <h2 className="text-5xl font-display font-bold text-white tracking-tighter uppercase leading-none">
            Pronto para o <span className="text-zenith-electric-blue drop-shadow-[0_0_15px_#3b82f6]">Ápice?</span>
          </h2>
          <p className="text-white/30 text-xs font-medium max-w-[320px] mx-auto leading-relaxed italic uppercase tracking-widest">
            "Sua biologia é o hardware, sua rotina é o software. Otimize o sistema agora."
          </p>
        </div>

        <div className="flex space-x-6 w-full pt-8 relative z-10">
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className="flex-1 bg-white/[0.02] border border-white/10 py-5 rounded-[24px] text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 group"
          >
            <MessageSquare size={18} className="text-white/20 group-hover:text-zenith-electric-blue transition-colors" />
            <span className="text-white/60 group-hover:text-white transition-colors">Neural Chat</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className="flex-1 bg-white/[0.02] border border-white/10 py-5 rounded-[24px] text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 group"
          >
            <Zap size={18} className="text-white/20 group-hover:text-zenith-cyan transition-colors" />
            <span className="text-white/60 group-hover:text-white transition-colors">Otimizar</span>
          </motion.button>
        </div>
      </section>


      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} t={t} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          <RoutineSystem t={t} />
          <FocusTimer t={t} />
          
          {/* Break Game Card */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-display font-bold uppercase tracking-[0.3em] flex items-center space-x-3 text-white/80">
                <Gamepad2 size={18} className="text-zenith-cyan" />
                <span>Mental Gym</span>
              </h3>
              <ArrowUpRight size={16} className="text-white/20" />
            </div>
            <motion.div 
              whileHover={{ scale: 1.01, y: -4 }}
              onClick={() => setActiveTab('break')}
              className="glass-card p-8 flex items-center justify-between border-zenith-cyan/10 bg-zenith-cyan/[0.02] group cursor-pointer hover:border-zenith-cyan/30 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-zenith-cyan/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="space-y-3 relative z-10">
                <p className="text-lg font-bold text-white/90">Pausa Cognitiva</p>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Sessão de 3 minutos ativa</p>
                <div className="flex items-center space-x-2 text-zenith-cyan pt-2">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">+100 XP Disponível</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-[24px] bg-zenith-cyan/10 flex items-center justify-center border border-zenith-cyan/20 group-hover:bg-zenith-cyan/20 group-hover:scale-110 transition-all duration-500">
                <ChevronRight size={28} className="text-zenith-cyan" />
              </div>
            </motion.div>
          </section>
        </div>
        
        <div className="space-y-12">
          <DailyMissions t={t} />
          
          {/* Motivation Feed */}
          <section className="space-y-6">
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.3em] flex items-center space-x-3 text-white/80 px-2">
              <Quote size={18} className="text-zenith-electric-blue" />
              <span>Neural Feed</span>
            </h3>
            <div className="glass-card p-10 border-l-4 border-l-zenith-electric-blue relative overflow-hidden bg-white/[0.01] border-white/5">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-zenith-electric-blue">
                <Quote size={96} />
              </div>
              <p className="text-base text-white/70 leading-relaxed font-medium italic relative z-10">
                "A excelência não é um ato, mas um hábito. Nós somos o que fazemos repetidamente."
              </p>
              <div className="flex items-center space-x-4 mt-8">
                <div className="w-8 h-px bg-zenith-electric-blue/40" />
                <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold">Aristóteles</p>
              </div>
            </div>
          </section>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-8">
            <StatCard
              icon={<Activity size={20} className="text-zenith-electric-blue" />}
              label="Foco Neural"
              value="4.2h"
              trend="+12%"
              color="purple"
            />
            <StatCard
              icon={<Target size={20} className="text-zenith-cyan" />}
              label="Sincronia"
              value="85%"
              trend="+5%"
              color="cyan"
            />
          </div>
        </div>
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
