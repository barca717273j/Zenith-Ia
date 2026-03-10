import React from 'react';
import { Home, ListTodo, Dumbbell, Wallet, User } from 'lucide-react';
import { motion } from 'motion/react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center w-full py-2 relative group outline-none"
  >
    <div className={`transition-all duration-300 ${isActive ? 'text-zenith-cyan scale-110' : 'text-white/40 group-hover:text-white/60'}`}>
      {icon}
    </div>
    <span className={`text-[8px] mt-1.5 font-bold uppercase tracking-[0.1em] transition-all duration-300 ${isActive ? 'text-zenith-cyan' : 'text-white/40'}`}>
      {label}
    </span>
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute -top-4 w-8 h-[2px] bg-zenith-cyan rounded-full shadow-[0_0_10px_#00d2ff]"
      />
    )}
  </button>
);

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  t: any;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, t }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 nav-blur px-6 pb-8 pt-4 z-50 border-t border-white/5">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        <NavItem
          icon={<Home size={20} />}
          label={t.nav.home}
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <NavItem
          icon={<ListTodo size={20} />}
          label={t.nav.routine}
          isActive={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
        />
        <NavItem
          icon={<Dumbbell size={20} />}
          label={t.nav.exercises}
          isActive={activeTab === 'exercises'}
          onClick={() => setActiveTab('exercises')}
        />
        <NavItem
          icon={<Wallet size={20} />}
          label={t.nav.finance}
          isActive={activeTab === 'finance'}
          onClick={() => setActiveTab('finance')}
        />
        <NavItem
          icon={<User size={20} />}
          label={t.nav.profile}
          isActive={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
      </div>
    </nav>
  );
};

