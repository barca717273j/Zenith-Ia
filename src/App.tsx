import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { Axis } from './components/Axis';
import { FinanceTracker } from './components/FinanceTracker';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { TetrisGame } from './components/TetrisGame';
import { Exercises } from './components/Exercises';
import { FocusTimer } from './components/FocusTimer';
import { Onboarding } from './components/Onboarding';
import { MentalGym } from './components/MentalGym';
import { Social } from './components/Social';
import { AdminPanel } from './components/AdminPanel';
import { Journal } from './components/Journal';
import { NewProtocolModal } from './components/NewProtocolModal';
import { Stats } from './components/Stats';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { FloatingThemeToggle } from './components/FloatingThemeToggle';

import { translations, Language } from './translations';
import { GamificationProvider } from './components/GamificationContext';
import { useUser } from './contexts/UserContext';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { user, userData, loading, refreshUserData } = useUser();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewProtocolOpen, setIsNewProtocolOpen] = useState(false);

  const lang: Language = userData?.language || 'pt-BR';
  const t = translations[lang] || translations['pt-BR'];

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zenith-black relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none bg-zenith-black">
          <div className="absolute inset-0 bg-fluid-marble opacity-30" />
          <div className="marble-blob w-[600px] h-[600px] bg-zenith-scarlet/10 -top-20 -left-20" />
          <div className="marble-blob w-[500px] h-[500px] bg-white/5 bottom-20 right-20" />
        </div>

        <div className="max-w-md w-full premium-card p-10 border-zenith-scarlet/30 space-y-8 text-center relative z-10 backdrop-blur-3xl bg-zenith-surface-1/80">
          <div className="w-20 h-20 rounded-3xl bg-zenith-scarlet/10 flex items-center justify-center mx-auto border border-zenith-scarlet/20 shadow-[0_0_30px_rgba(255,36,0,0.3)] animate-pulse">
            <AlertTriangle className="text-zenith-scarlet" size={40} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold text-zenith-text-primary uppercase tracking-tighter italic leading-none">
              Zenith <span className="text-zenith-accent">Offline</span>
            </h2>
            <p className="text-[11px] font-bold text-zenith-text-tertiary uppercase tracking-[0.3em] opacity-60">
              Configuração Supabase Pendente
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zenith-surface-2 border border-zenith-border-primary text-left space-y-4">
            <p className="text-xs text-zenith-text-secondary leading-relaxed">
              As credenciais do Supabase não foram detectadas no ambiente. Para ativar o sistema neural, configure as seguintes chaves:
            </p>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex items-center justify-between p-2 bg-zenith-black rounded border border-zenith-border-primary">
                <span className="text-zenith-text-tertiary">VITE_SUPABASE_URL</span>
                <span className="text-zenith-scarlet">MISSING</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-zenith-black rounded border border-zenith-border-primary">
                <span className="text-zenith-text-tertiary">VITE_SUPABASE_ANON_KEY</span>
                <span className="text-zenith-scarlet">MISSING</span>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-3 w-full py-5 bg-zenith-accent text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] hover:shadow-[0_0_30px_var(--accent-glow)] transition-all group"
            >
              <span>Acessar Supabase</span>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-widest font-bold">
              Reinicie o servidor após configurar
            </p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (userData && (!userData.display_name || !userData.onboarding_completed)) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [userData]);

  const handleOnboardingComplete = async () => {
    if (!user) {
      setShowOnboarding(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setShowOnboarding(false);
      await refreshUserData();
    } catch (err) {
      console.error('Error saving onboarding:', err);
      setShowOnboarding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500 bg-zenith-black">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-4 border-zenith-scarlet border-t-transparent rounded-full shadow-[0_0_20px_rgba(255,36,0,0.3)] mx-auto"
          />
          <p className="text-zenith-text-tertiary text-xs font-display uppercase tracking-widest">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard key="home" t={t} setActiveTab={setActiveTab} />;
      case 'tasks':
        return <HabitTracker key="tasks" t={t} />;
      case 'exercises':
        return <Exercises key="exercises" t={t} />;
      case 'focus':
        return <FocusTimer key="focus" t={t} isFullPage />;
      case 'finance':
        return <FinanceTracker key="finance" t={t} language={lang} setAppTab={setActiveTab} />;
      case 'profile':
        return <Profile key="profile" t={t} setActiveTab={setActiveTab} />;
      case 'social':
        return <Social key="social" t={t} />;
      case 'journal':
        return <Journal key="journal" t={t} />;
      case 'stats':
        return <Stats key="stats" />;
      case 'map':
        return <Axis key="map" t={t} />;
      case 'admin':
        return userData?.is_admin ? <AdminPanel key="admin" t={t} onBack={() => setActiveTab('profile')} /> : null;
      case 'break':
        return <MentalGym key="break" t={t} />;
      case 'subscription':
        return <SubscriptionScreen key="subscription" />;
      default:
        return <Dashboard key="home" t={t} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <GamificationProvider>
      <div className="min-h-screen transition-colors duration-500 bg-zenith-black text-zenith-text-primary selection:bg-zenith-scarlet/30">
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderContent()}
          </motion.main>
        </AnimatePresence>

        {!showOnboarding && <FloatingThemeToggle />}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} onPlusClick={() => setIsNewProtocolOpen(true)} t={t} />
        <NewProtocolModal isOpen={isNewProtocolOpen} onClose={() => setIsNewProtocolOpen(false)} t={t} />

        {/* Background Ambience */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-zenith-black">
          <div className="absolute inset-0 bg-fluid-marble opacity-50" />
          
          {/* Animated Marble Blobs */}
          <motion.div 
            animate={{ 
              x: [0, 100, -50, 0],
              y: [0, -100, 50, 0],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="marble-blob w-[600px] h-[600px] bg-zenith-scarlet/20 -top-20 -left-20"
          />
          <motion.div 
            animate={{ 
              x: [0, -150, 100, 0],
              y: [0, 150, -100, 0],
              scale: [1, 0.9, 1.1, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="marble-blob w-[500px] h-[500px] bg-white/5 bottom-20 right-20"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="marble-blob w-[800px] h-[800px] bg-zenith-crimson/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
          
          {/* Grain Overlay for Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      </div>
    </GamificationProvider>
  );
}
