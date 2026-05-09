import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Zap, Sparkles, Timer, Brain, ArrowLeft } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';

export const FocusTimer: React.FC<{ t: any; isFullPage?: boolean; onBack?: () => void }> = ({ t, isFullPage = false, onBack }) => {
  const { userData } = useUser();
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [focusDuration, setFocusDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customHours, setCustomHours] = useState('0');
  const [customDays, setCustomDays] = useState('0');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [customSeconds, setCustomSeconds] = useState('0');
  const { addXP } = useGamification();

  const saveFocusSession = async (duration: number) => {
    if (!userData?.id) return;
    try {
      const { error } = await supabase.from('focus_sessions').insert([{
        user_id: userData.id,
        duration: duration,
        mode: 'focus'
      }]);
      
      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving focus session:', err);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseInt(customDays) || 0;
    const h = parseInt(customHours) || 0;
    const m = parseInt(customMinutes) || 0;
    const s = parseInt(customSeconds) || 0;
    const totalSecs = d * 86400 + h * 3600 + m * 60 + s;
    
    if (totalSecs > 0) {
      setIsActive(false);
      setFocusDuration(totalSecs);
      setTimeLeft(totalSecs);
      setMode('focus');
      setShowCustomInput(false);
    }
  };

  const BREAK_TIME = 5 * 60;

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
          new Notification('Zenit Focus', { body: 'Sessão de foco concluída! Hora de uma pausa.' });
        }
      } else {
        setMode('focus');
        setTimeLeft(focusDuration);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Zenit Focus', { body: 'Pausa terminada! Pronto para focar?' });
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

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'focus' ? focusDuration : BREAK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className={`${isFullPage ? 'min-h-screen p-8 flex flex-col items-center justify-center' : 'p-6 flex items-center justify-between space-x-6'} relative overflow-hidden group border-zenit-border-primary bg-zenit-surface-1 rounded-[2.5rem]`}>
      
      {/* Timer Section */}
      <div className={`${isFullPage ? 'w-full max-w-md space-y-12' : 'flex items-center space-x-5 flex-1 min-w-0'}`}>
        <div className={`flex flex-col ${isFullPage ? 'items-center' : ''}`}>
          {showCustomInput && !isActive ? (
            <div className={`flex flex-col items-center space-y-8 ${isFullPage ? 'w-full' : ''}`}>
              <div className="flex items-center space-x-3">
                {[
                  { label: 'H', value: customHours, setter: setCustomHours, max: 23 },
                  { label: 'M', value: customMinutes, setter: setCustomMinutes, max: 59 },
                  { label: 'S', value: customSeconds, setter: setCustomSeconds, max: 59 }
                ].map((input, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-2">
                    <span className="text-[7px] font-black text-zenit-text-tertiary uppercase tracking-widest">{input.label}</span>
                    <input
                      type="number"
                      min="0"
                      max={input.max}
                      value={input.value}
                      onChange={(e) => input.setter(e.target.value)}
                      className="w-16 h-16 bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl text-xl text-center text-zenit-text-primary font-black focus:outline-none focus:border-zenit-accent transition-all shadow-inner"
                    />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleCustomSubmit}
                className="w-full py-5 bg-zenit-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.45em] flex items-center justify-center space-x-3 shadow-xl shadow-zenit-accent/20 italic"
              >
                <Timer size={16} />
                <span>Iniciar Protocolo</span>
              </button>
            </div>
          ) : (
            <div className={`flex flex-col ${isFullPage ? 'items-center' : ''}`} onClick={() => !isActive && setShowCustomInput(true)}>
              {!isFullPage && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${mode === 'focus' ? 'bg-zenit-accent' : 'bg-emerald-400'}`} />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary italic">
                    {mode === 'focus' ? 'Foco Neural' : 'Recuperação'}
                  </span>
                </div>
              )}
              <motion.div 
                key={timeLeft}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                className={`${isFullPage ? 'text-[120px] leading-none mb-12 sm:text-[160px]' : 'text-4xl'} font-display font-black tracking-tighter text-zenit-text-primary italic leading-none`}
              >
                {formatTime(timeLeft)}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Control Section */}
      <div className={`flex items-center ${isFullPage ? 'gap-8 px-4' : 'space-x-3'}`}>
        {!showCustomInput && isFullPage && (
          <button 
            onClick={resetTimer}
            className="w-16 h-16 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-accent transition-all"
          >
            <RotateCcw size={24} />
          </button>
        )}
        
        {!showCustomInput && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={`${isFullPage ? 'w-24 h-24 rounded-[2rem]' : 'w-14 h-14 rounded-2xl'} flex items-center justify-center transition-all duration-500 relative border ${
              isActive 
                ? 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-primary' 
                : 'bg-zenit-accent border-zenit-accent text-white shadow-xl shadow-zenit-accent/30'
            }`}
          >
            {isActive ? (
              <Pause size={isFullPage ? 36 : 24} fill="currentColor" stroke="none" />
            ) : (
              <Play size={isFullPage ? 36 : 24} className="ml-1" fill="currentColor" stroke="none" />
            )}
          </motion.button>
        )}
      </div>

      {/* Mode Indicator for Full Page */}
      {isFullPage && !showCustomInput && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-zenit-accent shadow-[0_0_10px_var(--accent-glow)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-zenit-text-tertiary italic">
            MODO: {mode === 'focus' ? 'Foco Intenso' : 'Recuperação Neural'}
          </span>
        </div>
      )}

      {/* Background Ambience */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-1000 ${mode === 'focus' ? 'bg-zenit-accent/10' : 'bg-emerald-500/10'}`} />
    </div>

  );
};
