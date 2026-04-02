import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Zap, Sparkles, Timer, Brain } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

export const FocusTimer: React.FC<{ t: any; isFullPage?: boolean }> = ({ t, isFullPage = false }) => {
  const { userData } = useUser();
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  const { addXP } = useGamification();

  const saveFocusSession = async (duration: number) => {
    if (!userData?.id) return;
    try {
      await supabase.from('focus_sessions').insert([{
        user_id: userData.id,
        duration: duration,
        mode: 'focus'
      }]);
    } catch (err) {
      console.error('Error saving focus session:', err);
    }
  };

  const BREAK_TIME = 5 * 60;

  const presets = [15, 25, 45, 60];

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        addXP(100);
        setSessions(s => s + 1);
        saveFocusSession(focusDuration);
        setMode('break');
        setTimeLeft(BREAK_TIME);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Zenith Focus', { body: 'Focus session complete! Time for a break.' });
        }
      } else {
        setMode('focus');
        setTimeLeft(focusDuration);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Zenith Focus', { body: 'Break over! Ready to focus?' });
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, addXP, focusDuration]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(focusDuration);
  };

  const handlePresetClick = (mins: number) => {
    setIsActive(false);
    setFocusDuration(mins * 60);
    setTimeLeft(mins * 60);
    setMode('focus');
    setShowCustomInput(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      handlePresetClick(mins);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'focus' ? focusDuration : BREAK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className={`${isFullPage ? 'min-h-screen p-8 flex flex-col items-center justify-center' : 'premium-card p-10 space-y-10'} relative overflow-hidden group border-zenith-border-primary bg-zenith-surface-1`}>
      {/* Background Glows */}
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-1000 ${mode === 'focus' ? 'bg-zenith-accent/10' : 'bg-emerald-500/10'}`} />
      <div className={`absolute bottom-0 left-0 w-64 h-64 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none transition-colors duration-1000 ${mode === 'focus' ? 'bg-purple-500/10' : 'bg-zenith-accent/10'}`} />
      
      <div className="flex justify-between items-center w-full relative z-10 max-w-md">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${mode === 'focus' ? 'text-zenith-accent bg-zenith-accent' : 'text-emerald-400 bg-emerald-400'}`} />
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.3em] text-zenith-text-primary italic">
              {mode === 'focus' ? 'Protocolo de Foco' : 'Fase de Recuperação'}
            </h3>
          </div>
          <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-black">Sessão #{sessions + 1}</p>
        </div>
        <div className="bg-zenith-surface-2 px-4 py-2 rounded-2xl border border-zenith-border-primary flex items-center space-x-2 shadow-sm">
          <Brain size={14} className={mode === 'focus' ? 'text-zenith-accent' : 'text-emerald-400'} />
          <span className="text-[10px] text-zenith-text-secondary font-black uppercase tracking-widest">
            {mode === 'focus' ? 'Trabalho Profundo' : 'Descanso'}
          </span>
        </div>
      </div>

      {/* Time Presets */}
      {!isActive && mode === 'focus' && (
        <div className="flex flex-wrap justify-center gap-3 relative z-10">
          {presets.map((mins) => (
            <button
              key={mins}
              onClick={() => handlePresetClick(mins)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                focusDuration === mins * 60 
                  ? 'bg-zenith-accent border-zenith-accent text-white shadow-[0_0_15px_var(--accent-glow)] scale-105' 
                  : 'bg-zenith-surface-2 text-zenith-text-tertiary border-zenith-border-primary hover:border-zenith-accent/30 hover:text-zenith-text-primary'
              }`}
            >
              {mins}m
            </button>
          ))}
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
              showCustomInput 
                ? 'bg-zenith-accent border-zenith-accent text-white shadow-[0_0_15px_var(--accent-glow)]' 
                : 'bg-zenith-surface-2 text-zenith-text-tertiary border-zenith-border-primary hover:border-zenith-accent/30'
            }`}
          >
            Custom
          </button>
        </div>
      )}

      {showCustomInput && !isActive && mode === 'focus' && (
        <form onSubmit={handleCustomSubmit} className="flex items-center space-x-3 relative z-10 justify-center">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="w-24 bg-zenith-surface-2 border border-zenith-border-primary rounded-xl px-4 py-2 text-center text-zenith-text-primary font-bold focus:outline-none focus:border-zenith-accent transition-all"
            placeholder="Mins"
          />
          <button type="submit" className="bg-zenith-accent text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_var(--accent-glow)] hover:brightness-110 transition-all">
            Set
          </button>
        </form>
      )}

      <div className="relative flex items-center justify-center py-6">
        {/* Progress Ring */}
        <svg className={`${isFullPage ? 'w-80 h-80' : 'w-72 h-72'} transform -rotate-90`}>
          <circle
            cx={isFullPage ? "160" : "144"}
            cy={isFullPage ? "160" : "144"}
            r={isFullPage ? "150" : "130"}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-zenith-border-primary opacity-20"
          />
          <motion.circle
            cx={isFullPage ? "160" : "144"}
            cy={isFullPage ? "160" : "144"}
            r={isFullPage ? "150" : "130"}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={isFullPage ? "942" : "816"}
            animate={{ strokeDashoffset: (isFullPage ? 942 : 816) - ((isFullPage ? 942 : 816) * progress) / 100 }}
            className={`${mode === 'focus' ? 'text-zenith-accent' : 'text-emerald-400'} transition-colors duration-1000`}
            style={{ filter: `drop-shadow(0 0 12px ${mode === 'focus' ? 'var(--accent-glow)' : 'rgba(52,211,153,0.4)'})` }}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
          <motion.span 
            key={timeLeft}
            initial={{ opacity: 0.8, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isFullPage ? 'text-9xl' : 'text-7xl'} font-mono font-bold tracking-tighter text-zenith-text-primary italic drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]`}
          >
            {formatTime(timeLeft)}
          </motion.span>
          <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl border transition-all duration-1000 ${mode === 'focus' ? 'text-zenith-accent bg-zenith-accent/10 border-zenith-accent/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'}`}>
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">
              {mode === 'focus' ? '+100 XP' : 'Recuperando'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-10 w-full relative z-10 max-w-md">
        <motion.button
          whileHover={{ scale: 1.1, rotate: -180 }}
          whileTap={{ scale: 0.9 }}
          onClick={resetTimer}
          className="w-16 h-16 rounded-2xl bg-zenith-surface-2 border border-zenith-border-primary flex items-center justify-center hover:bg-zenith-surface-1 hover:border-zenith-accent/30 transition-all group shadow-sm"
        >
          <RotateCcw size={28} className="text-zenith-text-tertiary group-hover:text-zenith-accent transition-all" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className={`w-28 h-28 rounded-[40px] flex items-center justify-center transition-all duration-500 relative border-2 ${
            isActive 
              ? 'bg-zenith-surface-2 border-zenith-border-primary text-zenith-text-primary' 
              : 'bg-zenith-accent border-zenith-accent text-white shadow-[0_0_50px_var(--accent-glow)]'
          }`}
        >
          {isActive ? (
            <Pause size={48} fill="currentColor" />
          ) : (
            <Play size={48} className="ml-1.5" fill="currentColor" />
          )}
          
          {isActive && (
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-[40px] border-2 border-zenith-accent/30"
            />
          )}
        </motion.button>

        <div className="w-16 h-16" />
      </div>
    </div>
  );
};
