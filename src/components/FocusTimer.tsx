import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Zap, Sparkles, Timer, Brain } from 'lucide-react';
import { useGamification } from './GamificationContext';

export const FocusTimer: React.FC<{ t: any }> = ({ t }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const { addXP } = useGamification();

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      addXP(50);
      if (Notification.permission === 'granted') {
        new Notification('Zenith Focus', { body: 'Sessão de foco concluída! Hora de uma pausa.' });
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, addXP]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="glass-card p-10 space-y-10 relative overflow-hidden group border-white/5 bg-white/[0.01]">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-zenith-electric-blue/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-zenith-cyan/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <div className="flex justify-between items-center relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-zenith-electric-blue rounded-full animate-pulse" />
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-white/90">Foco Neural</h3>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Protocolo Pomodoro v4.0</p>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 flex items-center space-x-2">
          <Brain size={14} className="text-zenith-electric-blue" />
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">25:00</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center py-10">
        {/* Progress Ring */}
        <svg className="w-64 h-64 transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="1"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray="754"
            animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
            className="text-zenith-electric-blue drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
          <motion.span 
            key={timeLeft}
            initial={{ opacity: 0.5, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl font-mono font-bold tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {formatTime(timeLeft)}
          </motion.span>
          <div className="flex items-center space-x-2 text-zenith-cyan bg-zenith-cyan/10 px-3 py-1 rounded-xl border border-zenith-cyan/10">
            <Sparkles size={12} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">+50 XP</span>
          </div>
        </div>
      </div>


      <div className="flex justify-center items-center space-x-8 relative z-10">
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

        <div className="w-14 h-14" /> {/* Spacer for symmetry */}
      </div>
    </div>
  );
};
