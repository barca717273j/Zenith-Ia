import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { LifeMap } from './components/LifeMap';
import { FinanceTracker } from './components/FinanceTracker';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { TetrisGame } from './components/TetrisGame';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'motion/react';

import { translations, Language } from './translations';
import { GamificationProvider } from './components/GamificationContext';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  const lang: Language = userData?.language || 'pt';
  const t = translations[lang];

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
      }
      
      setUserData(data || null);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-4 border-zenith-cyan border-t-transparent rounded-full shadow-[0_0_20px_rgba(0,240,255,0.3)] mx-auto"
          />
          <p className="text-white/40 text-xs font-display uppercase tracking-widest">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onSuccess={() => {}} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard key="home" userData={userData} t={t} setActiveTab={setActiveTab} />;
      case 'habits':
        return <HabitTracker key="habits" userData={userData} t={t} />;
      case 'map':
        return <LifeMap key="map" userData={userData} t={t} />;
      case 'finance':
        return <FinanceTracker key="finance" userData={userData} t={t} />;
      case 'profile':
        return <Profile key="profile" userData={userData} t={t} />;
      case 'break':
        return <TetrisGame key="break" t={t} />;
      default:
        return <Dashboard key="home" userData={userData} t={t} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <GamificationProvider>
      <div className="min-h-screen bg-zenith-black text-white selection:bg-zenith-cyan/30">
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto"
          >
            {renderContent()}
          </motion.main>
        </AnimatePresence>

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
        
        {/* Background Ambience */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#111,0%,#000,100%)]" />
        </div>
      </div>
    </GamificationProvider>
  );
}
