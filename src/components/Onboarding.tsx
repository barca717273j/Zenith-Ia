import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Target, Clock, Dumbbell, Brain, Check, Zap, Moon, Sun, Activity, Shield, Wind } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translations, Language } from '../translations';

import { useUser } from '../contexts/UserContext';

interface OnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'protocol' | 'schedule' | 'finalizing';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { userData } = useUser();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [objective, setObjective] = useState('performance');
  const [energyLevel, setEnergyLevel] = useState(80);
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [identity, setIdentity] = useState('');
  const [focus, setFocus] = useState('productivity');

  const lang: Language = userData?.language || 'pt-BR';
  const t = translations[lang];

  const handleComplete = async () => {
    setLoading(true);
    setStep('finalizing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // 1. Update User Profile
      await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          display_name: user.user_metadata?.full_name || 'Usuário Zenith', // Garante que temos um nome
          plan: 'free', // Etapa 6
          xp: 0
        })
        .eq('id', user.id);

      // 2. Create Initial Habits based on objective/focus
      const initialHabits = [
        { user_id: user.id, title: t.setup.water, category: 'health', icon: 'Droplets', target_value: 2000, current_value: 0, unit: t.setup.ml },
        { user_id: user.id, title: t.setup.meditation, category: 'mind', icon: 'Wind', target_value: 1, current_value: 0, unit: t.setup.session }
      ];

      if (focus === 'health' || objective === 'weight') {
        initialHabits.push({ user_id: user.id, title: t.setup.training, category: 'body', icon: 'Dumbbell', target_value: 1, current_value: 0, unit: t.setup.workout });
      }
      if (focus === 'productivity' || objective === 'focus') {
        initialHabits.push({ user_id: user.id, title: t.setup.deepWork, category: 'work', icon: 'Zap', target_value: 1, current_value: 0, unit: t.setup.session });
      }

      await supabase.from('habits').insert(initialHabits);

      // 3. Create Initial Routines based on wake/sleep times
      const initialRoutines = [
        { user_id: user.id, time: wakeTime, task: t.setup.wakeUp, category: 'body', period: 'morning', icon: 'Sun' },
        { user_id: user.id, time: sleepTime, task: t.setup.sleepProtocol, category: 'mind', period: 'evening', icon: 'Moon' }
      ];

      // Add a mid-day routine
      initialRoutines.push({ 
        user_id: user.id, 
        time: '12:00', 
        task: t.setup.midDayReview, 
        category: 'focus', 
        period: 'afternoon',
        icon: 'Zap'
      });

      await supabase.from('routines').insert(initialRoutines);

      // Small delay for effect
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Onboarding error:', error);
      onComplete(); // Fallback
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 text-center"
          >
            <div className="flex justify-center">
              <div className="p-6 bg-zenit-accent/10 rounded-full border border-zenit-accent/20 shadow-[0_0_30px_rgba(255,38,33,0.1)]">
                <Sparkles className="w-12 h-12 text-zenit-accent" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-display font-medium tracking-tighter text-zenit-text-primary uppercase italic">{t.onboarding.title}</h2>
              <p className="text-zenit-text-tertiary text-lg leading-relaxed font-medium">
                {t.onboarding.subtitle}
              </p>
            </div>
            <button
              onClick={() => setStep('protocol')}
              className="w-full py-5 bg-zenit-accent hover:bg-zenit-accent/80 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group shadow-[0_0_30px_rgba(255,38,33,0.3)]"
            >
              {t.common.start}
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        );

      case 'protocol':
        return (
          <motion.div
            key="protocol"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-medium text-zenit-text-primary uppercase tracking-tight italic">Escolha seu Protocolo</h2>
              <p className="text-zenit-text-tertiary text-sm">Defina a base neural da sua otimização.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { id: 'discipline_warrior', label: t.onboarding.identities.discipline_warrior, icon: <Shield size={20} />, focus: 'discipline' },
                { id: 'strategic_mind', label: t.onboarding.identities.strategic_mind, icon: <Brain size={20} />, focus: 'productivity' },
                { id: 'mental_athlete', label: t.onboarding.identities.mental_athlete, icon: <Activity size={20} />, focus: 'mindfulness' },
                { id: 'wealth_builder', label: t.onboarding.identities.wealth_builder, icon: <Target size={20} />, focus: 'discipline' },
                { id: 'focus_monk', label: t.onboarding.identities.focus_monk, icon: <Wind size={20} />, focus: 'mindfulness' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setIdentity(opt.id);
                    setFocus(opt.focus);
                    setStep('schedule');
                  }}
                  className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all text-left group shadow-sm ${
                    identity === opt.id ? 'bg-zenit-accent/20 border-zenit-accent text-zenit-text-primary' : 'bg-zenit-surface-1 border-zenit-border-primary text-zenit-text-tertiary hover:bg-zenit-surface-2'
                  }`}
                >
                  <div className={`transition-colors ${identity === opt.id ? 'text-zenit-accent' : 'text-zenit-text-tertiary/20 group-hover:text-zenit-text-tertiary'}`}>
                    {opt.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-widest text-[10px]">{opt.label}</span>
                    <span className="text-[8px] text-zenit-text-tertiary uppercase tracking-normal opacity-40">Protocolo Verificado</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'schedule':
        return (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-medium text-zenit-text-primary uppercase tracking-tight italic">{t.onboarding.step3Title}</h2>
              <p className="text-zenit-text-tertiary text-sm">{t.onboarding.step3Desc}</p>
            </div>
            <div className="flex flex-col items-center space-y-8">
              <div className="w-full max-w-[200px] space-y-3">
                <label className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary">
                  <Sun size={14} className="text-yellow-500" />
                  <span>Acordar</span>
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-4 px-2 text-3xl font-bold text-zenit-text-primary text-center focus:outline-none focus:border-zenit-accent transition-all shadow-inner"
                />
              </div>
              <div className="w-full max-w-[200px] space-y-3">
                <label className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary">
                  <Moon size={14} className="text-indigo-400" />
                  <span>Dormir</span>
                </label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-4 px-2 text-3xl font-bold text-zenit-text-primary text-center focus:outline-none focus:border-zenit-accent transition-all shadow-inner"
                />
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="w-full py-5 bg-zenit-accent hover:bg-zenit-accent/80 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group"
            >
              Confirmar Sincronização
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </motion.div>
        );

      case 'finalizing':
        return (
          <motion.div
            key="finalizing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-12"
          >
            <div className="relative flex justify-center">
              <div className="w-24 h-24 border-4 border-zenit-accent/20 border-t-zenit-accent rounded-full animate-spin shadow-[0_0_20px_rgba(255,38,33,0.2)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-zenit-accent w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-display font-medium text-zenit-text-primary uppercase tracking-tighter italic">{t.onboarding.finalizingTitle}</h2>
              <p className="text-zenit-text-tertiary text-lg font-medium">{t.onboarding.finalizingDesc}</p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zenit-bg flex items-center justify-center p-6 overflow-hidden transition-colors">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,38,33,0.05)_0%,transparent_70%)]" />
      
      <div className="w-full max-w-lg relative">
        <div className="glass-card p-10 rounded-[40px] border border-zenit-border-primary bg-zenit-surface-1 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 z-30 bg-zenit-accent/20 animate-scanline" />
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
