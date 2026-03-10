import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, CreditCard, Brain, LogOut, ChevronRight, Book, User, Award, Zap, Target, Flame, Sparkles, Shield } from 'lucide-react';
import { Subscription } from './Subscription';
import { TetrisGame } from './TetrisGame';
import { Journal } from './Journal';
import { useGamification } from './GamificationContext';

import { supabase } from '../supabase';

interface ProfileProps {
  userData: any;
  t: any;
}

export const Profile: React.FC<ProfileProps> = ({ userData, t }) => {
  const [view, setView] = useState<'main' | 'subscription' | 'gym' | 'journal'>('main');
  const { level, levelName, xp, streak } = useGamification();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderView = () => {
    switch (view) {
      case 'subscription':
        return <Subscription userData={userData} t={t} />;
      case 'gym':
        return <TetrisGame t={t} />;
      case 'journal':
        return <Journal userData={userData} t={t} />;
      default:
        return (
          <div className="p-6 space-y-12 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="flex flex-col items-center text-center space-y-8">
              <div className="relative group">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 bg-gradient-to-tr from-zenith-electric-blue via-zenith-cyan to-zenith-electric-blue rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="relative w-40 h-40 rounded-full border-2 border-white/5 p-1.5 bg-white/[0.02] backdrop-blur-xl">
                  <div className="w-full h-full rounded-full bg-zenith-black flex items-center justify-center overflow-hidden border border-white/10">
                    {userData?.photoURL ? (
                      <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <User size={64} className="text-white/10" />
                      </div>
                    )}
                  </div>
                  
                  {/* Level Badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 right-2 bg-zenith-electric-blue text-white text-[10px] font-bold px-4 py-1.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-white/20 flex items-center space-x-1.5"
                  >
                    <Award size={12} />
                    <span>LVL {level}</span>
                  </motion.div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-4xl font-display font-bold tracking-tighter uppercase leading-none text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {userData?.displayName || 'Zenith User'}
                </h1>
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2 bg-zenith-electric-blue/10 px-3 py-1 rounded-lg border border-zenith-electric-blue/20">
                    <Sparkles size={12} className="text-zenith-electric-blue" />
                    <span className="text-zenith-electric-blue text-[10px] font-bold uppercase tracking-[0.2em]">
                      {levelName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    <Shield size={12} className="text-white/40" />
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                      {userData?.subscriptionTier || 'Free'}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-5">
              <StatItem icon={<Zap size={18} />} label="XP Total" value={xp.toString()} color="text-zenith-cyan" />
              <StatItem icon={<Flame size={18} />} label="Streak" value={`${streak}d`} color="text-orange-500" />
              <StatItem icon={<Award size={18} />} label="Rank" value={`#${level}`} color="text-zenith-electric-blue" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-6 ml-2">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">Protocolos</h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <MenuButton 
                icon={<Brain size={20} />} 
                label="Academia Mental" 
                sublabel="Treinamento cognitivo e foco" 
                onClick={() => setView('gym')} 
              />
              <MenuButton 
                icon={<Book size={20} />} 
                label="Diário Neural" 
                sublabel="Reflexões diárias e progresso" 
                onClick={() => setView('journal')} 
              />

              <div className="flex items-center space-x-3 my-8 ml-2">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">Configurações</h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <MenuButton 
                icon={<User size={20} />} 
                label="Conta" 
                sublabel="Editar perfil e dados pessoais" 
                onClick={() => {}} 
              />
              <MenuButton 
                icon={<CreditCard size={20} />} 
                label="Assinatura" 
                sublabel="Gerenciar seu plano e pagamentos" 
                onClick={() => setView('subscription')} 
              />
              <MenuButton 
                icon={<Settings size={20} />} 
                label="Preferências" 
                sublabel="Ajustes de interface e tema" 
                onClick={() => {}} 
              />
              <MenuButton 
                icon={<Shield size={20} />} 
                label="Segurança" 
                sublabel="Senha e autenticação" 
                onClick={() => {}} 
              />
              <MenuButton 
                icon={<LogOut size={20} />} 
                label="Sair do Sistema" 
                sublabel="Encerrar sessão com segurança" 
                onClick={handleLogout} 
                danger
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zenith-black">
      {view !== 'main' && (
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setView('main')}
          className="fixed top-8 left-8 z-[60] p-4 bg-white/5 rounded-[20px] border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group"
        >
          <ChevronRight size={20} className="rotate-180 text-white/40 group-hover:text-white transition-colors" />
        </motion.button>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-white/5 bg-white/[0.01] relative overflow-hidden group">
    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className={`${color} opacity-60 group-hover:opacity-100 transition-opacity`}>{icon}</div>
    <p className="text-2xl font-display font-bold tracking-tighter text-white">{value}</p>
    <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.3em]">{label}</p>
  </div>
);

const MenuButton: React.FC<{ icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; danger?: boolean }> = ({ icon, label, sublabel, onClick, danger }) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className="w-full glass-card p-6 flex items-center justify-between group hover:bg-white/[0.03] transition-all border-white/5 bg-white/[0.01]"
  >
    <div className="flex items-center space-x-6">
      <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-500 ${
        danger 
          ? 'bg-red-500/5 text-red-400/40 group-hover:bg-red-500/20 group-hover:text-red-400' 
          : 'bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-white'
      }`}>
        {icon}
      </div>
      <div className="text-left space-y-1">
        <p className={`text-lg font-bold tracking-tight ${danger ? 'text-red-400/80' : 'text-white/90'}`}>{label}</p>
        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{sublabel}</p>
      </div>
    </div>
    <ChevronRight size={20} className="text-white/5 group-hover:text-white/40 transition-all translate-x-0 group-hover:translate-x-1" />
  </motion.button>
);
