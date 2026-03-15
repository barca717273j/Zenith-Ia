import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Zap, Sparkles, Timer, Brain } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';

export const FocusTimer: React.FC<{ t: any; userData: any; isFullPage?: boolean }> = ({ t, userData, isFullPage = false }) => {
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
    <div className={`${isFullPage ? 'min-h-screen p-8 flex flex-col items-center justify-center' : 'glass-card p-10 space-y-10'} relative overflow-hidden group border-white/5 bg-white/[0.01]`}>
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-zenith-electric-blue/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-zenith-cyan/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <div className="flex justify-between items-center w-full relative z-10 max-w-md">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'focus' ? 'bg-zenith-electric-blue' : 'bg-emerald-400'}`} />
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-white/90">
              {mode === 'focus' ? 'Focus Protocol' : 'Recovery Phase'}
            </h3>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Session #{sessions + 1}</p>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 flex items-center space-x-2">
          <Brain size={14} className={mode === 'focus' ? 'text-zenith-electric-blue' : 'text-emerald-400'} />
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
            {mode === 'focus' ? 'Deep Work' : 'Rest'}
          </span>
        </div>
      </div>

      {/* Time Presets */}
      {!isActive && mode === 'focus' && (
        <div className="flex flex-wrap justify-center gap-2 relative z-10">
          {presets.map((mins) => (
            <button
              key={mins}
              onClick={() => handlePresetClick(mins)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                focusDuration === mins * 60 
                  ? 'bg-white text-black' 
                  : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
              }`}
            >
              {mins}m
            </button>
          ))}
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              showCustomInput 
                ? 'bg-zenith-scarlet text-white' 
                : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
            }`}
          >
            Custom
          </button>
        </div>
      )}

      {showCustomInput && !isActive && mode === 'focus' && (
        <form onSubmit={handleCustomSubmit} className="flex items-center space-x-2 relative z-10 justify-center">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center text-white font-bold focus:outline-none focus:border-zenith-scarlet/50"
            placeholder="Mins"
          />
          <button type="submit" className="bg-zenith-scarlet text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest">
            Set
          </button>
        </form>
      )}

      <div className="relative flex items-center justify-center py-10">
        {/* Progress Ring */}
        <svg className={`${isFullPage ? 'w-80 h-80' : 'w-64 h-64'} transform -rotate-90`}>
          <circle
            cx={isFullPage ? "160" : "128"}
            cy={isFullPage ? "160" : "128"}
            r={isFullPage ? "150" : "120"}
            stroke="currentColor"
            strokeWidth="1"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx={isFullPage ? "160" : "128"}
            cy={isFullPage ? "160" : "128"}
            r={isFullPage ? "150" : "120"}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={isFullPage ? "942" : "754"}
            animate={{ strokeDashoffset: (isFullPage ? 942 : 754) - ((isFullPage ? 942 : 754) * progress) / 100 }}
            className={`${mode === 'focus' ? 'text-zenith-electric-blue' : 'text-emerald-400'} drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]`}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
          <motion.span 
            key={timeLeft}
            initial={{ opacity: 0.5, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isFullPage ? 'text-8xl' : 'text-6xl'} font-mono font-bold tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
          >
            {formatTime(timeLeft)}
          </motion.span>
          <div className="flex items-center space-x-2 text-zenith-cyan bg-zenith-cyan/10 px-3 py-1 rounded-xl border border-zenith-cyan/10">
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              {mode === 'focus' ? '+100 XP' : 'Recovery'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-8 w-full relative z-10 max-w-md">
        <motion.button
          whileHover={{ scale: 1.1, rotate: -90 }}
          whileTap={{ scale: 0.9 }}
          onClick={resetTimer}
          className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <RotateCcw size={24} className="text-white/30 group-hover:text-white transition-all" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className={`w-24 h-24 rounded-[32px] flex items-center justify-center transition-all relative ${
            isActive 
              ? 'bg-white/5 border border-white/20 text-white' 
              : 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]'
          }`}
        >
          {isActive ? (
            <Pause size={40} fill="currentColor" />
          ) : (
            <Play size={40} className="ml-1" fill="currentColor" />
          )}
          
          {isActive && (
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-[32px] border-2 border-white/20"
            />
          )}
        </motion.button>

        <div className="w-14 h-14" />
      </div>
    </div>
  );
};
