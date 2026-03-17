import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { HabitTracker } from './components/HabitTracker';
import { LifeMap } from './components/LifeMap';
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
import { supabase, isSupabaseConfigured } from './supabase';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

import { translations, Language } from './translations';
import { GamificationProvider } from './components/GamificationContext';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const lang: Language = userData?.language || 'pt-BR';
  const t = translations[lang];

  useEffect(() => {
    // Step 3 & 8: Fix session persistence and add logs
    console.log("Zenith: Initializing Auth...");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Zenith: Session retrieved:", session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Zenith: Auth state changed:", _event, session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
        // Step 7: Ensure redirect after login
        setActiveTab('home');
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId?: string) => {
    const id = userId || user?.id;
    if (!id || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
      }
      
      if (data) {
        setUserData(data);
        // If user has no display name or hasn't completed onboarding, show it
        if (!data.display_name || !data.onboarding_completed) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } else {
        // No user record found, create one (common after Google Login)
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: id,
            email: user?.email || '',
            username: user?.email?.split('@')[0] || 'user',
            full_name: user?.user_metadata?.full_name || '',
            display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
            avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
            photo_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
            language: 'pt-BR',
            subscription_tier: 'free',
            energy_level: 100,
            xp: 0,
            streak: 0,
            onboarding_completed: false
          }])
          .select()
          .single();
        
        if (!insertError && newUser) {
          setUserData(newUser);
          setShowOnboarding(true);
        } else {
          console.error('Failed to create user record:', insertError);
          setShowOnboarding(true);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    if (!user || !isSupabaseConfigured) {
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
      await fetchUserData(user.id);
    } catch (err) {
      console.error('Error saving onboarding:', err);
      setShowOnboarding(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-8">
          <div className="flex justify-center">
            <div className="p-6 bg-red-900/20 rounded-full border border-red-500/30">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Configuração Necessária</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              O Zenith IA requer conexão com o Supabase para funcionar. Por favor, configure as variáveis de ambiente <code className="bg-white/10 px-2 py-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-white/10 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center"
            >
              Criar Projeto no Supabase <ExternalLink className="ml-2 w-4 h-4" />
            </a>
            <div className="flex items-center justify-center space-x-2 text-white/20">
              <ShieldCheck size={12} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Infraestrutura de Produção</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-12 h-12 border-4 border-zenith-scarlet border-t-transparent rounded-full shadow-[0_0_20px_rgba(255,36,0,0.3)] mx-auto"
          />
          <p className="text-white/40 text-xs font-display uppercase tracking-widest">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => setLoading(true)} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard key="home" userData={userData} t={t} setActiveTab={setActiveTab} onUpdate={fetchUserData} />;
      case 'tasks':
        return <HabitTracker key="tasks" userData={userData} t={t} />;
      case 'exercises':
        return <Exercises key="exercises" t={t} userData={userData} />;
      case 'focus':
        return <FocusTimer key="focus" t={t} userData={userData} isFullPage />;
      case 'finance':
        return <FinanceTracker key="finance" userData={userData} t={t} language={lang} />;
      case 'profile':
        return <Profile key="profile" userData={userData} t={t} onUpdate={fetchUserData} />;
      case 'social':
        return <Social key="social" userData={userData} t={t} onUpdate={fetchUserData} />;
      case 'journal':
        return <Journal key="journal" userData={userData} t={t} />;
      case 'stats':
        return <Stats key="stats" userData={userData} />;
      case 'map':
        return <LifeMap key="map" userData={userData} t={t} />;
      case 'admin':
        return userData?.is_admin ? <AdminPanel key="admin" t={t} userData={userData} /> : null;
      case 'break':
        return <MentalGym key="break" t={t} userData={userData} />;
      default:
        return <Dashboard key="home" userData={userData} t={t} setActiveTab={setActiveTab} onUpdate={fetchUserData} />;
    }
  };

  return (
    <GamificationProvider>
      <div className="min-h-screen bg-zenith-black text-white selection:bg-zenith-scarlet/30">
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

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} userData={userData} />

        {/* Background Ambience */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#111,0%,#000,100%)]" />
        </div>
      </div>
    </GamificationProvider>
  );
}
