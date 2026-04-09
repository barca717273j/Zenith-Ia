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
import { Manual } from './components/Manual';
import { Protocols } from './components/Protocols';
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
  const { user, userData, loading, isSupabaseConnected, connectionError, refreshUserData } = useUser();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewProtocolOpen, setIsNewProtocolOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // The UserProvider will re-run the connection test if we trigger a state change or wait
    window.location.reload();
  };

  useEffect(() => {
    if (userData && (!userData.display_name || !userData.onboarding_completed)) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [userData]);

  const lang: Language = userData?.language || 'pt-BR';
  const t = translations[lang] || translations['pt-BR'] || translations['en'];

  if (!isSupabaseConfigured || !isSupabaseConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zenit-black relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none bg-zenit-black">
          <div className="absolute inset-0 bg-fluid-marble opacity-30" />
          <div className="marble-blob w-[600px] h-[600px] bg-zenit-scarlet/10 -top-20 -left-20" />
          <div className="marble-blob w-[500px] h-[500px] bg-white/5 bottom-20 right-20" />
        </div>

        <div className="max-w-md w-full premium-card p-10 border-zenit-scarlet/30 space-y-8 text-center relative z-10 backdrop-blur-3xl bg-zenit-surface-1/80">
          <div className="w-20 h-20 rounded-3xl bg-zenit-scarlet/10 flex items-center justify-center mx-auto border border-zenit-scarlet/20 shadow-[0_0_30px_rgba(255,36,0,0.3)] animate-pulse">
            <AlertTriangle className="text-zenit-scarlet" size={40} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold text-zenit-text-primary uppercase tracking-tighter italic leading-none">
              ZENITH <span className="text-zenit-accent">Offline</span>
            </h2>
            <p className="text-[11px] font-bold text-zenit-text-tertiary uppercase tracking-[0.3em] opacity-60">
              {!isSupabaseConfigured ? 'Configuração Supabase Pendente' : 'Erro de Conexão com Supabase'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary text-left space-y-4">
            <p className="text-xs text-zenit-text-secondary leading-relaxed">
              {connectionError || (!isSupabaseConfigured 
                ? 'As credenciais do Supabase não foram detectadas no ambiente. Para ativar o sistema neural, configure as seguintes chaves:'
                : 'Não foi possível estabelecer uma conexão estável com o Supabase. Verifique se as credenciais estão corretas e se o banco de dados está ativo.')}
            </p>
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex items-center justify-between p-2 bg-zenit-black rounded border border-zenit-border-primary">
                <span className="text-zenit-text-tertiary">VITE_SUPABASE_URL</span>
                <span className={!import.meta.env.VITE_SUPABASE_URL ? "text-zenit-scarlet" : "text-green-500"}>
                  {!import.meta.env.VITE_SUPABASE_URL ? "MISSING" : "CONFIGURED"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-zenit-black rounded border border-zenit-border-primary">
                <span className="text-zenit-text-tertiary">VITE_SUPABASE_ANON_KEY</span>
                <span className={!import.meta.env.VITE_SUPABASE_ANON_KEY ? "text-zenit-scarlet" : "text-green-500"}>
                  {!import.meta.env.VITE_SUPABASE_ANON_KEY ? "MISSING" : "CONFIGURED"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center justify-center space-x-3 w-full py-5 bg-zenit-accent text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.3em] hover:shadow-[0_0_30px_var(--accent-glow)] transition-all group disabled:opacity-50"
            >
              {isRetrying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
              )}
              <span>{isRetrying ? 'Tentando Conexão...' : 'Tentar Novamente'}</span>
            </button>
            <p className="text-[9px] text-zenit-text-tertiary/50 uppercase tracking-widest leading-relaxed">
              Dica: Verifique se o projeto no Supabase não está pausado e se as chaves no menu "Settings" estão corretas.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
    const loadingText = t?.common?.loading || 'Carregando ZENITH...';
    return (
      <div className="min-h-screen flex items-center justify-center transition-colors duration-500 bg-zenit-black">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-4 border-zenit-scarlet border-t-transparent rounded-full shadow-[0_0_20px_rgba(255,36,0,0.3)] mx-auto"
          />
          <p className="text-zenit-text-tertiary text-xs font-display uppercase tracking-widest">{loadingText}</p>
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
      case 'manual':
        return <Manual key="manual" />;
      case 'protocols':
        return <Protocols key="protocols" t={t} />;
      case 'stats':
        return <Stats key="stats" />;
      case 'axis':
        return <Axis key="axis" t={t} />;
      case 'admin':
        return userData?.is_admin ? <AdminPanel key="admin" t={t} onBack={() => setActiveTab('profile')} /> : null;
      case 'gym':
        return <MentalGym key="gym" t={t} />;
      case 'subscription':
        return <SubscriptionScreen key="subscription" />;
      default:
        return <Dashboard key="home" t={t} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <GamificationProvider>
      <div className="min-h-screen transition-colors duration-500 bg-zenit-black text-zenit-text-primary selection:bg-zenit-scarlet/30">
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
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-zenit-black">
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
            className="marble-blob w-[600px] h-[600px] bg-zenit-scarlet/20 -top-20 -left-20"
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
            className="marble-blob w-[800px] h-[800px] bg-zenit-crimson/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
          
          {/* Grain Overlay for Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
      </div>
    </GamificationProvider>
  );
}
