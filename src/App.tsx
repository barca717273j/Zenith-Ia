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
import { Stats } from './components/Stats';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
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

  const lang: Language = userData?.language || 'pt-BR';
  const t = translations[lang] || translations['pt-BR'];

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
        return <Profile key="profile" t={t} />;
      case 'social':
        return <Social key="social" t={t} />;
      case 'journal':
        return <Journal key="journal" t={t} />;
      case 'stats':
        return <Stats key="stats" />;
      case 'map':
        return <Axis key="map" t={t} />;
      case 'admin':
        return userData?.is_admin ? <AdminPanel key="admin" t={t} /> : null;
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
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

        {/* Background Ambience */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-zenith-black transition-colors duration-1000" />
          <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,0,0,0.05),transparent_70%)]" />
          </div>
          <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,0,0,0.02),transparent_70%)]" />
          </div>
        </div>
      </div>
    </GamificationProvider>
  );
}
