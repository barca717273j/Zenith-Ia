import React from 'react';
import { Home, CheckCircle2, Map, Wallet, User, LayoutGrid } from 'lucide-react';
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
    <div className={`transition-all duration-500 ${isActive ? 'text-zenith-electric-blue scale-110' : 'text-white/20 group-hover:text-white/40'}`}>
      {icon}
    </div>
    <span className={`text-[8px] mt-2 font-bold uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? 'text-white opacity-100' : 'opacity-0'}`}>
      {label}
    </span>
    {isActive && (
      <motion.div
        layoutId="nav-indicator"
        className="absolute -top-4 w-8 h-[2px] bg-zenith-electric-blue rounded-full shadow-[0_0_10px_#3b82f6]"
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
    <nav className="fixed bottom-0 left-0 right-0 nav-blur px-6 pb-10 pt-6 z-50 border-t border-white/5">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        <NavItem
          icon={<LayoutGrid size={20} />}
          label="Início"
          isActive={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <NavItem
          icon={<CheckCircle2 size={20} />}
          label="Hábitos"
          isActive={activeTab === 'habits'}
          onClick={() => setActiveTab('habits')}
        />
        <NavItem
          icon={<Map size={20} />}
          label="Mapa"
          isActive={activeTab === 'map'}
          onClick={() => setActiveTab('map')}
        />
        <NavItem
          icon={<Wallet size={20} />}
          label="Finanças"
          isActive={activeTab === 'finance'}
          onClick={() => setActiveTab('finance')}
        />
        <NavItem
          icon={<User size={20} />}
          label="Perfil"
          isActive={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
      </div>
    </nav>
  );
};

