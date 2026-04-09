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
      <div className={`p-2.5 rounded-2xl transition-all duration-500 relative ${isActive ? 'text-zenit-accent' : 'text-zenit-text-tertiary opacity-60 group-hover:opacity-100'}`}>
        {isActive && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-zenit-accent/20 blur-2xl rounded-full"
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
      <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-zenit-accent opacity-100' : 'text-zenit-text-tertiary opacity-70 group-hover:opacity-100'}`}>
        {label}
      </span>
    </div>
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute -bottom-1 w-1.5 h-1.5 bg-zenit-accent rounded-full shadow-[0_0_15px_var(--accent-glow)]"
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
    <div className="fixed bottom-8 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
      <nav className="rounded-[2.5rem] px-4 py-2 flex justify-between items-center w-full max-w-lg relative shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-zenit-border-primary bg-zenit-nav backdrop-blur-3xl pointer-events-auto">
        <div className="flex items-center justify-around flex-1">
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
        </div>
        
        {/* Central Action Button */}
        <div className="relative mx-4">
          <button
            onClick={onPlusClick}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-300 bg-gradient-to-br from-zenit-accent to-zenit-crimson border border-white/20 shadow-[0_0_20px_var(--accent-glow)] relative group active:scale-95"
          >
            <Plus size={28} className="relative z-10" />
            <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />
          </button>
        </div>

        <div className="flex items-center justify-around flex-1">
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
        </div>
      </nav>
    </div>
  );
};

