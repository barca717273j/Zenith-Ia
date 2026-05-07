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
    className="flex flex-col items-center justify-center py-1 flex-1 relative outline-none transition-all duration-300"
  >
    <div className={`transition-all duration-300 flex flex-col items-center ${isActive ? 'scale-110' : 'scale-100 opacity-60 hover:opacity-100'}`}>
      <div className={`p-2 rounded-2xl transition-all duration-300 relative ${isActive ? 'text-zenit-accent' : 'text-zenit-text-tertiary'}`}>
        <div className="relative z-10 flex items-center justify-center">
          {React.cloneElement(icon as any, { 
            size: 18,
            strokeWidth: isActive ? 3 : 2,
            className: isActive ? 'drop-shadow-[0_0_12px_rgba(227,28,37,0.5)]' : ''
          })}
        </div>
        {isActive && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-zenit-accent/10 blur-xl rounded-full -z-10"
          />
        )}
      </div>
      <span className={`text-[8px] mt-1 font-black uppercase tracking-[0.25em] transition-all duration-300 italic ${isActive ? 'text-zenit-accent' : 'text-zenit-text-tertiary'}`}>
        {label}
      </span>
    </div>
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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 sm:p-6 pb-6 overflow-visible pointer-events-none">
      <nav className="bg-zenit-surface-1/90 backdrop-blur-2xl border border-zenit-border-primary rounded-[2.5rem] px-4 py-3 flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-md pointer-events-auto relative overflow-visible">
        {/* Subtle Inner Glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zenit-accent/20 to-transparent" />
        
        <div className="flex-1 flex justify-center">
          <NavItem
            icon={<Home />}
            label="Dashboard"
            isActive={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
        </div>
        <div className="flex-1 flex justify-center">
          <NavItem
            icon={<ListTodo />}
            label="Rotina"
            isActive={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
          />
        </div>
        
        {/* Central Plus Button - Bolinha Zenith */}
        <div className="flex-shrink-0 px-2 relative -top-3">
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPlusClick}
            className="w-14 h-14 rounded-full bg-zenit-accent flex items-center justify-center text-white shadow-xl shadow-zenit-accent/30 active:scale-95 transition-all border-[3.5px] border-zenit-surface-1 relative group overflow-visible"
          >
            <Plus size={28} strokeWidth={3} className="relative z-10" />
            
            {/* Pulsing Outer Ring */}
            <div className="absolute -inset-[3.5px] rounded-full border-[3.5px] border-zenit-surface-1 pointer-events-none" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-1 rounded-full bg-zenit-accent/20 blur-md pointer-events-none"
            />
          </motion.button>
        </div>

        <div className="flex-1 flex justify-center">
          <NavItem
            icon={<Users />}
            label="Nexus"
            isActive={activeTab === 'social'}
            onClick={() => setActiveTab('social')}
          />
        </div>
        <div className="flex-1 flex justify-center">
          <NavItem
            icon={<User />}
            label="Perfil"
            isActive={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </nav>
    </div>
  );
};

