import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Target, Clock, Dumbbell, Brain, Check, Zap, Moon, Sun, Activity, Shield, Wind } from 'lucide-react';
import { supabase } from '../supabase';
import { translations, Language } from '../translations';

import { useUser } from '../contexts/UserContext';

interface OnboardingProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'objective' | 'energy' | 'schedule' | 'identity' | 'focus' | 'finalizing';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { userData } = useUser();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [objective, setObjective] = useState('');
  const [energyLevel, setEnergyLevel] = useState(80);
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [identity, setIdentity] = useState('');
  const [focus, setFocus] = useState('');

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
        .from('users')
        .update({ 
          onboarding_completed: true,
          energy_level: energyLevel,
          identity: identity,
          life_score: 500, // Initial score
          level: 1,
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
              <div className="p-6 bg-zenith-scarlet/10 rounded-full border border-zenith-scarlet/20 shadow-[0_0_30px_rgba(255,38,33,0.1)]">
                <Sparkles className="w-12 h-12 text-zenith-scarlet" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-display font-bold tracking-tighter text-white uppercase">{t.onboarding.title}</h2>
              <p className="text-white/60 text-lg leading-relaxed font-medium">
                {t.onboarding.subtitle}
              </p>
            </div>
            <button
              onClick={() => setStep('objective')}
              className="w-full py-5 bg-zenith-scarlet hover:bg-zenith-scarlet/80 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group shadow-[0_0_30px_rgba(255,38,33,0.3)]"
            >
              {t.common.start}
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        );

      case 'objective':
        return (
          <motion.div
            key="objective"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{t.onboarding.step1Title}</h2>
              <p className="text-white/40 text-sm">{t.onboarding.step1Desc}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'performance', label: t.onboarding.objectives.performance, icon: <Zap size={20} /> },
                { id: 'balance', label: t.onboarding.objectives.balance, icon: <Activity size={20} /> },
                { id: 'health', label: t.onboarding.objectives.health, icon: <Target size={20} /> }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setObjective(opt.id);
                    setStep('energy');
                  }}
                  className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all text-left group ${
                    objective === opt.id ? 'bg-zenith-scarlet/20 border-zenith-scarlet text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div className={`transition-colors ${objective === opt.id ? 'text-zenith-scarlet' : 'text-white/20 group-hover:text-white/40'}`}>
                    {opt.icon}
                  </div>
                  <span className="font-bold uppercase tracking-widest text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'energy':
        return (
          <motion.div
            key="energy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{t.onboarding.step2Title}</h2>
              <p className="text-white/40 text-sm">{t.onboarding.step2Desc}</p>
            </div>
            <div className="space-y-12 py-10">
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-zenith-scarlet"
                />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zenith-scarlet text-white px-4 py-2 rounded-xl font-bold text-xl shadow-lg shadow-zenith-scarlet/20">
                  {energyLevel}%
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                <span>{t.onboarding.energy.low}</span>
                <span>{t.onboarding.energy.high}</span>
              </div>
            </div>
            <button
              onClick={() => setStep('schedule')}
              className="w-full py-5 bg-zenith-scarlet hover:bg-zenith-scarlet/80 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group"
            >
              {t.common.save}
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
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
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{t.onboarding.step3Title}</h2>
              <p className="text-white/40 text-sm">{t.onboarding.step3Desc}</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <Sun size={14} className="text-yellow-500" />
                  <span>Acordar</span>
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-2xl font-bold text-white focus:outline-none focus:border-zenith-scarlet transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <Moon size={14} className="text-indigo-400" />
                  <span>Dormir</span>
                </label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-2xl font-bold text-white focus:outline-none focus:border-zenith-scarlet transition-all"
                />
              </div>
            </div>
            <button
              onClick={() => setStep('identity')}
              className="w-full py-5 bg-zenith-scarlet hover:bg-zenith-scarlet/80 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group"
            >
              {t.common.save}
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </motion.div>
        );

      case 'identity':
        return (
          <motion.div
            key="identity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{t.onboarding.step4Title}</h2>
              <p className="text-white/40 text-sm">{t.onboarding.step4Desc}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { id: 'discipline_warrior', label: t.onboarding.identities.discipline_warrior, icon: <Shield size={20} /> },
                { id: 'strategic_mind', label: t.onboarding.identities.strategic_mind, icon: <Brain size={20} /> },
                { id: 'mental_athlete', label: t.onboarding.identities.mental_athlete, icon: <Activity size={20} /> },
                { id: 'wealth_builder', label: t.onboarding.identities.wealth_builder, icon: <Target size={20} /> },
                { id: 'focus_monk', label: t.onboarding.identities.focus_monk, icon: <Wind size={20} /> }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setIdentity(opt.id);
                    setStep('focus');
                  }}
                  className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all text-left group ${
                    identity === opt.id ? 'bg-zenith-scarlet/20 border-zenith-scarlet text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div className={`transition-colors ${identity === opt.id ? 'text-zenith-scarlet' : 'text-white/20 group-hover:text-white/40'}`}>
                    {opt.icon}
                  </div>
                  <span className="font-bold uppercase tracking-widest text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'focus':
        return (
          <motion.div
            key="focus"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{t.onboarding.step5Title}</h2>
              <p className="text-white/40 text-sm">{t.onboarding.step5Desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'discipline', label: t.onboarding.focus.discipline, icon: <Shield size={20} /> },
                { id: 'productivity', label: t.onboarding.focus.productivity, icon: <Zap size={20} /> },
                { id: 'mindfulness', label: t.onboarding.focus.mindfulness, icon: <Wind size={20} /> },
                { id: 'fitness', label: t.onboarding.focus.fitness, icon: <Dumbbell size={20} /> }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setFocus(opt.id);
                  }}
                  className={`flex flex-col items-center justify-center space-y-4 p-6 rounded-2xl border transition-all text-center group ${
                    focus === opt.id ? 'bg-zenith-scarlet/20 border-zenith-scarlet text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div className={`transition-colors ${focus === opt.id ? 'text-zenith-scarlet' : 'text-white/20 group-hover:text-white/40'}`}>
                    {opt.icon}
                  </div>
                  <span className="font-bold uppercase tracking-widest text-[10px]">{opt.label}</span>
                </button>
              ))}
            </div>
            <button
              disabled={!focus}
              onClick={handleComplete}
              className="w-full py-5 bg-zenith-scarlet hover:bg-zenith-scarlet/80 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center group disabled:opacity-50 shadow-[0_0_30px_rgba(255,38,33,0.2)]"
            >
              {t.onboarding.complete}
              <Check className="ml-2 w-5 h-5" />
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
              <div className="w-24 h-24 border-4 border-zenith-scarlet/20 border-t-zenith-scarlet rounded-full animate-spin shadow-[0_0_20px_rgba(255,38,33,0.2)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-zenith-scarlet w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tighter">{t.onboarding.finalizingTitle}</h2>
              <p className="text-white/60 text-lg font-medium">{t.onboarding.finalizingDesc}</p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zenith-black flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,38,33,0.05)_0%,transparent_70%)]" />
      
      <div className="w-full max-w-lg relative">
        <div className="glass-card p-10 rounded-[40px] border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
