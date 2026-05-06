import React from 'react';
import { Home, ListTodo, Dumbbell, Wallet, User, Zap, Plus, Scale, Users } from 'lucide-react';
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
    className="flex flex-col items-center justify-center py-2 px-1 relative outline-none transition-all duration-500 min-h-[44px] min-w-[44px]"
  >
    <div className={`transition-all duration-500 flex flex-col items-center ${isActive ? 'scale-105' : ''}`}>
      <div className={`p-2 rounded-xl transition-all duration-500 relative ${isActive ? 'text-zenit-accent' : 'text-zenit-text-tertiary opacity-60'}`}>
        {isActive && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-zenit-accent/10 blur-xl rounded-full"
          />
        )}
        <div className="relative z-10">
          {React.cloneElement(icon as any, { 
            size: 18,
            strokeWidth: isActive ? 2.5 : 2,
            className: isActive ? 'drop-shadow-[0_0_8px_var(--accent-glow)]' : ''
          })}
        </div>
      </div>
      <span className={`text-[7px] mt-1 font-bold uppercase tracking-widest transition-all duration-500 ${isActive ? 'text-zenit-accent opacity-100' : 'text-zenit-text-tertiary opacity-70'}`}>
        {label}
      </span>
    </div>
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute -bottom-0.5 w-1 h-1 bg-zenit-accent rounded-full shadow-[0_0_10px_var(--accent-glow)]"
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
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg">
      <nav className="bg-zenit-surface-1/80 backdrop-blur-3xl border border-zenit-border-primary rounded-[2.5rem] p-1.5 flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex-1 flex justify-center">
          <NavItem
            icon={<Home />}
            label={t.nav.home}
            isActive={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
        </div>
        <div className="flex-1 flex justify-center">
          <NavItem
            icon={<ListTodo />}
            label={t.nav.routine}
            isActive={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
          />
        </div>
        
        {/* Central Plus Button */}
        <div className="flex-shrink-0 px-2">
          <button
            onClick={onPlusClick}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-zenit-accent to-zenit-crimson flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,36,0,0.4)] active:scale-90 transition-all -translate-y-4 border-4 border-zenit-black"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <NavItem
            icon={<Users />}
            label={t.nav.nexus}
            isActive={activeTab === 'social'}
            onClick={() => setActiveTab('social')}
          />
        </div>
        <div className="flex-1 flex justify-center">
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

