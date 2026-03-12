import React, { useState } from 'react';
import { InfinityAI } from './InfinityAI';
import { AIAssistant } from './AIAssistant';
import { ZenithLogo } from './ZenithLogo';
import { RoutineSystem } from './RoutineSystem';
import { FocusTimer } from './FocusTimer';
import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp, User, MessageSquare, Sparkles, Brain, ArrowUpRight, Timer } from 'lucide-react';
import { useGamification } from './GamificationContext';

interface DashboardProps {
  userData: any;
  t: any;
  setActiveTab: (tab: string) => void;
  onUpdate: () => Promise<void> | void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userData, t, setActiveTab, onUpdate }) => {

  const [isAIOpen, setIsAIOpen] = useState(false);
  const { level, levelName } = useGamification();

  if (!userData) return null;

  const greeting =
    t?.dashboard?.aiGreeting?.split?.('.')?.[0] ||
    "Bem-vindo de volta";

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

            <h1 className="text-4xl font-bold font-display tracking-tighter leading-none uppercase text-white">
              Zenith
            </h1>

            <div className="flex items-center space-x-3">

              <div className="flex items-center space-x-2 bg-zenith-electric-blue/10 px-3 py-1 rounded-lg border border-zenith-electric-blue/20">
                <Sparkles size={12} className="text-zenith-electric-blue animate-pulse" />
                <span className="text-zenith-electric-blue text-[10px] font-bold uppercase tracking-[0.3em]">
                  {levelName}
                </span>
              </div>

              <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
                LVL {level}
              </span>

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
              <img
                src={userData.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={32} className="text-white/10" />
            )}

          </div>

          <div className="absolute inset-0 bg-gradient-to-tr from-zenith-electric-blue to-zenith-cyan opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

        </motion.button>

      </header>

      {/* AI Mentor */}

      <section
        className="glass-card p-6 flex items-center justify-between relative group cursor-pointer overflow-hidden border-white/5 bg-white/[0.01]"
        onClick={() => setIsAIOpen(true)}
      >

        <div className="flex items-center space-x-4 relative z-10">

          {/* Corrigido tamanho do InfinityAI */}
          <div className="scale-[0.25] origin-left">
            <InfinityAI isResponding={false} />
          </div>

          <div className="space-y-0.5">

            <div className="flex items-center space-x-2 text-zenith-cyan">
              <Brain size={12} />
              <span className="text-[8px] font-bold uppercase tracking-[0.3em]">
                {t?.dashboard?.infinityMentor || "Mentor IA"}
              </span>
            </div>

            <h2 className="text-lg font-display font-bold text-white tracking-tight uppercase">
              {greeting}
            </h2>

          </div>

        </div>

        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
          <MessageSquare size={18} className="text-zenith-cyan" />
        </div>

      </section>

      <AIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        t={t}
        userData={userData}
        onUpdate={onUpdate}
      />

      {/* GRID */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Daily */}

        <section className="space-y-4">

          <div className="flex items-center space-x-2 px-1">
            <Target size={14} className="text-zenith-scarlet" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {t?.dashboard?.dailySummary || "Resumo Diário"}
            </h3>
          </div>

          <div className="glass-card p-6 space-y-6 border-white/5 bg-white/[0.01]">

            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-1">
                <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest">
                  Missões
                </p>
                <p className="text-xl font-display font-bold">4/5</p>
              </div>

              <div className="space-y-1">
                <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest">
                  Hábitos
                </p>
                <p className="text-xl font-display font-bold">80%</p>
              </div>

            </div>

          </div>

        </section>

        {/* Weekly */}

        <section className="space-y-4">

          <div className="flex items-center space-x-2 px-1">
            <TrendingUp size={14} className="text-zenith-scarlet" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {t?.dashboard?.weeklyProgress || "Progresso Semanal"}
            </h3>
          </div>

          <div className="glass-card p-6 border-white/5 bg-white/[0.01]">

            <div className="flex items-center justify-between">

              <div className="space-y-1">
                <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest">
                  XP
                </p>
                <p className="text-xl font-display font-bold">+1,240</p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet border border-zenith-scarlet/20">
                <Zap size={20} />
              </div>

            </div>

          </div>

        </section>

        {/* Routine */}

        <section className="space-y-3 md:col-span-2">

          <div className="flex items-center justify-between px-1">

            <div className="flex items-center space-x-2">
              <Zap size={14} className="text-zenith-scarlet" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                {t?.nav?.routine || "Rotina"}
              </h3>
            </div>

            <button
              onClick={() => setActiveTab('tasks')}
              className="text-[9px] font-bold uppercase tracking-widest text-zenith-scarlet flex items-center space-x-1"
            >
              <span>Ver Tudo</span>
              <ArrowUpRight size={10} />
            </button>

          </div>

          <div
            onClick={() => setActiveTab('tasks')}
            className="glass-card p-5 cursor-pointer hover:bg-white/[0.02] transition-all"
          >
            <RoutineSystem t={t} />
          </div>

        </section>

        {/* Focus */}

        <section className="space-y-3 md:col-span-2">

          <div className="flex items-center space-x-2 px-1">
            <Timer size={14} className="text-zenith-scarlet" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              Sessão de Foco
            </h3>
          </div>

          <div
            onClick={() => setActiveTab('focus')}
            className="glass-card p-5 cursor-pointer hover:bg-white/[0.02] transition-all"
          >
            <FocusTimer t={t} />
          </div>

        </section>

      </div>

    </div>
  );
};
