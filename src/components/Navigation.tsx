import React from 'react';
import { Home, ListTodo, Dumbbell, Wallet, User, Zap, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center py-2 px-3 relative group outline-none transition-all duration-500"
  >
    <div className={`transition-all duration-500 flex flex-col items-center ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
      <div className={`p-2.5 rounded-2xl transition-all duration-500 relative ${isActive ? 'text-zenith-accent' : 'text-zenith-text-tertiary opacity-60 group-hover:opacity-100'}`}>
        {isActive && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-zenith-accent/20 blur-2xl rounded-full"
          />
        )}
        <div className="relative z-10">
          {React.cloneElement(icon as any, { 
            size: 20,
            strokeWidth: isActive ? 2.5 : 2,
            className: isActive ? 'drop-shadow-[0_0_12px_var(--accent-glow)]' : ''
          })}
        </div>
      </div>
      <span className={`text-[7px] mt-1 font-bold uppercase tracking-[0.3em] transition-all duration-500 ${isActive ? 'text-zenith-accent opacity-100' : 'text-zenith-text-tertiary opacity-40 group-hover:opacity-80'}`}>
        {label}
      </span>
    </div>
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute -bottom-1 w-1.5 h-1.5 bg-zenith-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]"
      />
    )}
  </button>
);

import { useUser } from '../contexts/UserContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onPlusClick: () => void;
  t: any;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onPlusClick, t }) => {
  const { userData } = useUser();
  
  return (
    <div className="fixed bottom-8 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
      <nav className="rounded-[2.5rem] px-8 py-2 flex justify-between items-center w-full max-w-md relative shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-zenith-border-primary bg-zenith-nav backdrop-blur-3xl pointer-events-auto overflow-hidden">
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {/* Animated Border Glow */}
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-zenith-accent/5 to-transparent animate-spin-slow opacity-30 pointer-events-none" style={{ animationDuration: '10s' }} />

        <NavItem
          icon={<Home />}
          label={t.nav.home}
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <NavItem
          icon={<ListTodo />}
          label={t.nav.routine}
          isActive={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
        />
        
        {/* Central Action Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPlusClick}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all duration-500 bg-gradient-to-br from-zenith-accent to-zenith-crimson border border-white/20 shadow-[0_0_30px_var(--accent-glow),0_0_60px_var(--accent-glow)] relative group overflow-hidden"
          >
            {/* Button Surface Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50" />
            
            {/* Hover Shine */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
            />
            
            <Plus size={32} className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
            
            {/* Inner Border Glow */}
            <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
          </motion.button>
          
          {/* Outer Pulse Ring */}
          <div className="absolute inset-0 -m-3 rounded-[2rem] border border-zenith-accent/20 animate-pulse pointer-events-none" />
          <div className="absolute inset-0 -m-5 rounded-[2.5rem] border border-zenith-accent/5 animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }} />
        </div>

        <NavItem
          icon={<Zap />}
          label={t.social.title}
          isActive={activeTab === 'social'}
          onClick={() => setActiveTab('social')}
        />
        <NavItem
          icon={<User />}
          label={t.nav.profile}
          isActive={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
      </nav>
    </div>
  );
};

