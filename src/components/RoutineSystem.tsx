import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Bell, CheckCircle2, Circle, Plus, Trash2, 
  Calendar, Sparkles, Zap, AlertCircle, Target, 
  Brain, Dumbbell, Wind, Activity, Sun, Moon, 
  Coffee, TrendingUp, ChevronRight, X, Loader2, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGamification } from './GamificationContext';

interface Routine {
  id: string;
  time: string;
  duration?: string;
  title: string;
  description?: string;
  completed: boolean;
  notified: boolean;
  category: string;
  icon: string;
  period: 'morning' | 'afternoon' | 'evening';
  priority: 'low' | 'medium' | 'high';
  frequency: 'daily' | 'weekly' | 'custom';
  energy_level_expected?: number;
  xp_reward: number;
  alarm_sound?: string;
  days?: string[];
}

import { CustomSlider } from './CustomSlider';
import { askAI } from '../services/gemini';
import { useUser } from '../contexts/UserContext';

export const RoutineSystem: React.FC<{ t: any; userData: any }> = ({ t, userData }) => {
  const { checkLimit, incrementUsage } = useUser();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDuration, setNewDuration] = useState('30min');
  const [newCategory, setNewCategory] = useState('focus');
  const [newPeriod, setNewPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [newEnergy, setNewEnergy] = useState(50);
  const [newAlarmSound, setNewAlarmSound] = useState('zenit-classic');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [activePeriod, setActivePeriod] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const { addXP } = useGamification();

  const categories = [
    { id: 'focus', label: 'Foco', icon: <Brain size={14} />, color: 'text-blue-400' },
    { id: 'health', label: 'Saúde', icon: <Activity size={14} />, color: 'text-zenit-scarlet' },
    { id: 'mental', label: 'Mental', icon: <Wind size={14} />, color: 'text-emerald-400' },
    { id: 'finance', label: 'Financeiro', icon: <TrendingUp size={14} />, color: 'text-amber-400' },
  ];

  const priorities = [
    { id: 'low', label: 'Baixa', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'medium', label: 'Média', color: 'bg-amber-500/20 text-amber-400' },
    { id: 'high', label: 'Alta', color: 'bg-zenit-scarlet/20 text-zenit-scarlet' },
  ];

  const alarmSounds = [
    { id: 'zenit-classic', label: 'Zenit Classic', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
    { id: 'digital-pulse', label: 'Digital Pulse', url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
    { id: 'soft-chime', label: 'Soft Chime', url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' },
  ];

  const weekDays = [
    { id: 'mon', label: 'S' },
    { id: 'tue', label: 'T' },
    { id: 'wed', label: 'Q' },
    { id: 'thu', label: 'Q' },
    { id: 'fri', label: 'S' },
    { id: 'sat', label: 'S' },
    { id: 'sun', label: 'D' },
  ];

  const periods = [
    { id: 'morning', label: 'Manhã', icon: <Sun size={14} /> },
    { id: 'afternoon', label: 'Tarde', icon: <Coffee size={14} /> },
    { id: 'evening', label: 'Noite', icon: <Moon size={14} /> },
  ];

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (userData?.id) {
      fetchRoutines();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setRoutines(prev => prev.map(r => {
        if (r.time === currentTime && !r.notified && !r.completed) {
          triggerAlarm(r);
          return { ...r, notified: true };
        }
        return r;
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, [userData?.id]);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const triggerAlarm = (routine: Routine) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Zenit', {
        body: `Protocolo Ativo: ${routine.title}`,
        icon: '/zenit-logo.png',
        silent: false,
        tag: routine.id
      });
      
      // Play sound
      const soundUrl = alarmSounds.find(s => s.id === routine.alarm_sound)?.url || alarmSounds[0].url;
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.log('Audio play failed', e));
    }
  };

  const fetchRoutines = async () => {
    if (!userData?.id) return;
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userData.id)
        .order('time', { ascending: true });
      
      if (error) throw error;
      if (data && Array.isArray(data)) setRoutines(data);
    } catch (err: any) {
      console.error('Error fetching routines:', err);
    }
  };

  const generateAiRoutine = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    
    const limitCheck = await checkLimit('ai_messages');
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
    }

    setIsAiGenerating(true);
    try {
      const prompt = `Generate a high-performance daily routine for a user with the following goals/context: "${promptToUse}". 
      Return ONLY a JSON object with a "tasks" array. Each task must have:
      - time (HH:mm)
      - title (string)
      - description (string)
      - category (one of: focus, health, mental, finance)
      - period (one of: morning, afternoon, evening)
      - priority (one of: low, medium, high)
      
      Example format:
      {
        "tasks": [
          { "time": "06:00", "title": "Meditation", "description": "10 min mindfulness", "category": "mental", "period": "morning", "priority": "high" }
        ]
      }`;

      const response = await askAI({ prompt });
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const generatedData = JSON.parse(cleanResponse);
      
      if (!generatedData.tasks || !Array.isArray(generatedData.tasks)) {
        throw new Error('Invalid AI response format');
      }
      
      const tasksToInsert = generatedData.tasks.map((t: any) => ({
        user_id: userData.id,
        time: t.time,
        title: t.title,
        name: t.title,
        description: t.description || '',
        category: t.category || 'focus',
        period: t.period || 'morning',
        completed: false,
        notified: false,
        priority: t.priority || 'medium',
        frequency: 'daily',
        xp_reward: t.priority === 'high' ? 100 : 50,
        energy_level_expected: 80,
        alarm_sound: 'zenit-classic',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        icon: t.category === 'health' ? 'Activity' : t.category === 'mental' ? 'Wind' : t.category === 'finance' ? 'TrendingUp' : 'Brain'
      }));
      
      const { error: tasksError } = await supabase
        .from('routines')
        .insert(tasksToInsert);
        
      if (tasksError) throw tasksError;
      
      await incrementUsage('ai_messages');
      setAiPrompt('');
      fetchRoutines();
      alert('Protocolo de Rotina Zenit gerado com sucesso! 🚀');
    } catch (err: any) {
      console.error('Routine Generation Error:', err);
      alert('Erro ao gerar rotina: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const addRoutine = async () => {
    if (!newTask || !userData?.id) return;

    // Check limits
    const limitCheck = await checkLimit('routines');
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
    }

    const xpReward = newPriority === 'high' ? 100 : newPriority === 'medium' ? 50 : 25;

    const { data, error } = await supabase
      .from('routines')
      .insert([{ 
        user_id: userData.id, 
        title: newTask, 
        name: newTask, // Adicionando 'name' conforme solicitado pelo usuário
        description: '',
        time: newTime, 
        duration: newDuration,
        category: newCategory,
        icon: newCategory === 'health' ? 'Activity' : newCategory === 'mental' ? 'Wind' : newCategory === 'finance' ? 'TrendingUp' : 'Brain',
        period: newPeriod,
        priority: newPriority,
        frequency: newFrequency,
        energy_level_expected: newEnergy,
        xp_reward: xpReward,
        alarm_sound: newAlarmSound,
        days: selectedDays,
        completed: false, 
        notified: false 
      }])
      .select()
      .single();
    
    if (data) {
      setRoutines(prev => [...prev, data].sort((a, b) => a.time.localeCompare(b.time)));
      setNewTask('');
      setIsAdding(false);
      await incrementUsage('actions');
    }
  };

  const toggleRoutine = async (id: string, completed: boolean) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    const { error } = await supabase
      .from('routines')
      .update({ 
        completed: !completed,
        last_completed: !completed ? new Date().toISOString() : null
      })
      .eq('id', id);
    
    if (!error) {
      setRoutines(prev => prev.map(r => r.id === id ? { ...r, completed: !completed } : r));
      if (!completed) {
        addXP(routine.xp_reward || 25);
        await incrementUsage('actions');
      }
    }
  };

  const deleteRoutine = async (id: string) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setRoutines(prev => prev.filter(r => r.id !== id));
    }
  };

  const filteredRoutines = activePeriod === 'all' 
    ? routines 
    : routines.filter(r => r.period === activePeriod);

  const completionRate = routines.length > 0 
    ? Math.round((routines.filter(r => r.completed).length / routines.length) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6 p-4 pb-32 max-w-2xl mx-auto min-h-screen bg-zenit-black">
      <header className="flex justify-between items-end mb-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-display font-bold tracking-tight text-zenit-text-primary uppercase italic tracking-tighter">
            {t.routine.title.split(' ')[0]} <span className="text-zenit-accent">{t.routine.title.split(' ')[1]}</span>
          </h2>
          <p className="text-zenit-text-tertiary text-[11px] font-bold uppercase tracking-[0.3em] opacity-60">{t.routine.subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="w-12 h-12 rounded-2xl bg-zenit-surface-1 border border-zenit-border-primary text-zenit-text-tertiary hover:text-zenit-accent hover:border-zenit-accent/30 transition-all flex items-center justify-center shadow-lg"
            >
              <Bell size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsAdding(true)}
            className="w-14 h-14 rounded-2xl bg-zenit-accent text-white shadow-[0_0_25px_rgba(255,0,0,0.3)] flex items-center justify-center hover:scale-105 transition-all active:scale-95 border border-white/20"
          >
            <Plus size={28} />
          </button>
        </div>
      </header>

      {/* AI Assistant Section */}
      <section className="premium-card premium-card-hover relative overflow-hidden group bg-zenit-surface-1 border-zenit-border-primary">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles className="text-zenit-accent" size={64} />
        </div>
        <div className="space-y-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-zenit-accent/10 flex items-center justify-center border border-zenit-accent/20 shadow-inner">
              <Zap size={22} className="text-zenit-accent" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-zenit-text-secondary">{t.routine.aiArchitect}</h2>
              <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-bold opacity-60">{t.routine.aiSubtitle}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <textarea
              placeholder={t.routine.aiPlaceholder}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-3xl p-6 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/30 transition-all min-h-[140px] resize-none placeholder:text-zenit-text-tertiary/40 leading-relaxed shadow-inner"
            />
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => {
                  const prompt = "Sugira uma rotina otimizada com base nos meus hábitos e objetivos atuais para um dia de alta performance.";
                  setAiPrompt(prompt);
                  generateAiRoutine(prompt);
                }}
                disabled={isAiGenerating}
                className="w-full sm:flex-1 bg-zenit-surface-2 border border-zenit-border-primary text-zenit-text-secondary px-6 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-zenit-surface-3 active:scale-95 flex items-center justify-center gap-2 shadow-inner"
              >
                <Brain size={16} />
                <span>{t.routine.optimizeProfile}</span>
              </button>
              <button
                onClick={() => generateAiRoutine()}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-zenit-accent to-zenit-crimson text-white text-[11px] font-bold uppercase tracking-[0.3em] shadow-[0_0_25px_var(--accent-glow)] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/20 disabled:opacity-50 disabled:scale-100"
              >
                {isAiGenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>{t.routine.generateProtocol}</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Card */}
      <div className="premium-card premium-card-hover flex items-center justify-between group bg-zenit-surface-1 border-zenit-border-primary">
        <div className="space-y-3">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.3em] text-zenit-text-tertiary opacity-60">{t.routine.dailyEfficiency}</h3>
          <div className="flex items-center space-x-6">
            <p className="text-4xl font-display font-bold text-zenit-text-primary tracking-tighter italic">{completionRate}%</p>
            <div className="w-40 h-2.5 bg-zenit-surface-2 rounded-full overflow-hidden border border-zenit-border-primary shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                className="h-full bg-zenit-accent shadow-[0_0_15px_var(--accent-glow)]"
              />
            </div>
          </div>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-zenit-surface-2 flex items-center justify-center group-hover:bg-zenit-accent/10 transition-all border border-zenit-border-primary group-hover:border-zenit-accent/30 shadow-inner">
          <Target size={28} className="text-zenit-text-tertiary group-hover:text-zenit-accent transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setActivePeriod('all')}
          className={`px-6 py-3 text-[10px] uppercase tracking-[0.3em] font-bold rounded-2xl border transition-all whitespace-nowrap active:scale-95 shadow-lg ${activePeriod === 'all' ? 'bg-zenit-text-primary text-zenit-black border-zenit-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-zenit-surface-1 border-zenit-border-primary text-zenit-text-tertiary hover:text-zenit-text-secondary hover:border-zenit-border-primary/50'}`}
        >
          {t.routine.all}
        </button>
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id as any)}
            className={`px-6 py-3 text-[10px] uppercase tracking-[0.3em] font-bold rounded-2xl border transition-all whitespace-nowrap flex items-center space-x-2 active:scale-95 shadow-lg ${activePeriod === p.id ? 'bg-zenit-text-primary text-zenit-black border-zenit-text-primary shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-zenit-surface-1 border-zenit-border-primary text-zenit-text-tertiary hover:text-zenit-text-secondary hover:border-zenit-border-primary/50'}`}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Timeline View */}
      <div className="relative space-y-10 pl-8">
        <div className="absolute left-[39px] top-8 bottom-8 w-px bg-gradient-to-b from-zenit-accent/30 via-zenit-border-primary to-transparent" />
        
        {filteredRoutines.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-20">
            <div className="w-16 h-16 rounded-3xl bg-zenit-surface-1 border border-zenit-border-primary flex items-center justify-center mx-auto">
              <Zap size={32} className="text-zenit-text-primary" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-zenit-text-primary">{t.routine.noActiveProtocols}</p>
          </div>
        ) : filteredRoutines.map((r, idx) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative flex items-start space-x-10 group"
          >
            {/* Timeline Dot & Time */}
            <div className="flex flex-col items-center space-y-4 pt-2">
              <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${r.completed ? 'bg-zenit-accent border-zenit-accent shadow-[0_0_25px_var(--accent-glow)] scale-110' : 'bg-zenit-black border-zenit-border-primary group-hover:border-zenit-accent/50 group-hover:scale-110'}`}>
                {r.completed && <Check size={12} className="text-white" />}
              </div>
              <p className={`text-[11px] font-black font-mono tracking-tighter transition-colors duration-500 ${r.completed ? 'text-zenit-accent/40' : 'text-zenit-text-tertiary group-hover:text-zenit-text-primary'}`}>{r.time}</p>
            </div>

            {/* Task Card */}
            <div className={`flex-1 premium-card premium-card-hover relative overflow-hidden group/card bg-zenit-surface-1 border-zenit-border-primary ${r.completed ? 'opacity-40 grayscale' : ''}`}>
              {/* Glow Effect */}
              {!r.completed && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-zenit-accent/5 blur-[60px] rounded-full group-hover/card:bg-zenit-accent/10 transition-all duration-700" />
              )}
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className={`text-xl font-display font-bold tracking-tight leading-tight ${r.completed ? 'text-zenit-text-primary/20 line-through italic' : 'text-zenit-text-primary'}`}>
                      {r.title}
                    </p>
                    {r.description && (
                      <p className="text-[11px] text-zenit-text-tertiary font-medium leading-relaxed max-w-[240px] opacity-60">{r.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${r.completed ? 'bg-zenit-surface-2/50 border-zenit-border-primary' : 'bg-zenit-surface-2 border-zenit-border-primary group-hover/card:border-zenit-accent/20 shadow-inner'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${categories.find(c => c.id === r.category)?.color}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${categories.find(c => c.id === r.category)?.color}`}>
                        {categories.find(c => c.id === r.category)?.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-[0.2em] opacity-50">
                      <span className="w-1 h-1 bg-zenit-text-tertiary/20 rounded-full" />
                      <span className="flex items-center space-x-1.5">
                        {periods.find(p => p.id === r.period)?.icon}
                        <span className="scale-90">{periods.find(p => p.id === r.period)?.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-3">
                  <button 
                    onClick={() => toggleRoutine(r.id, r.completed)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${r.completed ? 'bg-gradient-to-br from-zenit-accent to-zenit-crimson border-white/20 text-white shadow-[0_0_20px_var(--accent-glow)]' : 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-tertiary hover:text-zenit-accent hover:border-zenit-accent/30 shadow-inner'}`}
                  >
                    <CheckCircle2 size={24} strokeWidth={r.completed ? 2.5 : 2} />
                  </button>
                  <button 
                    onClick={() => deleteRoutine(r.id)}
                    className="w-10 h-10 rounded-xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary/20 hover:text-zenit-accent hover:bg-zenit-accent/5 transition-all opacity-0 group-hover/card:opacity-100 border border-zenit-border-primary"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Modal (Bottom Sheet) */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-zenit-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] border-t sm:border border-zenit-border-secondary space-y-6 relative overflow-hidden shadow-[0_-20px_50px_rgba(255,0,0,0.1)] z-10 mb-0 sm:mb-0 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
            >
              <div className="w-12 h-1.5 bg-zenit-accent/20 rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />
              
              <div className="px-8 flex justify-between items-center flex-shrink-0">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold text-zenit-black tracking-tight uppercase italic">{t.routine.newProtocol.split(' ')[0]} <span className="text-zenit-accent">{t.routine.newProtocol.split(' ')[1]}</span></h3>
                  <p className="text-[10px] text-zenit-accent font-bold uppercase tracking-[0.3em] opacity-80">{t.routine.performanceConfig}</p>
                </div>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="w-12 h-12 rounded-2xl bg-zenit-surface-1 flex items-center justify-center text-zenit-accent hover:bg-zenit-accent hover:text-white transition-all border border-zenit-border-secondary shadow-sm active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 pb-10 space-y-8 overflow-y-auto scrollbar-hide flex-1">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-accent font-bold uppercase tracking-[0.3em] ml-1">{t.routine.taskName}</label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder={t.routine.aiPlaceholder.split('...')[0]}
                    className="w-full bg-white border-2 border-zenit-border-secondary rounded-[2rem] px-6 py-5 text-sm text-zenit-black focus:outline-none focus:border-zenit-accent transition-all placeholder:text-zenit-text-tertiary/30 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] text-zenit-accent font-bold uppercase tracking-[0.3em] ml-1">{t.routine.time}</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zenit-accent pointer-events-none" />
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-white border-2 border-zenit-border-secondary rounded-2xl pl-12 pr-6 py-4 text-sm text-zenit-black focus:outline-none focus:border-zenit-accent transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-zenit-accent font-bold uppercase tracking-[0.3em] ml-1">{t.routine.duration}</label>
                    <div className="relative">
                      <Activity size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zenit-accent pointer-events-none" />
                      <select
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full bg-white border-2 border-zenit-border-secondary rounded-2xl pl-12 pr-6 py-4 text-sm text-zenit-black focus:outline-none focus:border-zenit-accent transition-all appearance-none shadow-inner"
                      >
                        <option value="15min" className="bg-white">15 min</option>
                        <option value="30min" className="bg-white">30 min</option>
                        <option value="45min" className="bg-white">45 min</option>
                        <option value="1h" className="bg-white">1 hora</option>
                        <option value="2h" className="bg-white">2 horas</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.routine.priority}</label>
                    <div className="flex gap-1.5 p-1.5 bg-zenit-surface-2 rounded-2xl border border-zenit-border-primary shadow-inner">
                      {priorities.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setNewPriority(p.id as any)}
                          className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-tighter transition-all ${newPriority === p.id ? p.color : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.routine.frequency}</label>
                    <select
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value as any)}
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl px-6 py-4 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/30 transition-all appearance-none shadow-inner"
                    >
                      <option value="daily" className="bg-zenit-surface-2">Diária</option>
                      <option value="weekly" className="bg-zenit-surface-2">Semanal</option>
                      <option value="custom" className="bg-zenit-surface-2">Personalizada</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.routine.category}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${newCategory === cat.id ? 'bg-zenit-text-primary border-zenit-text-primary text-zenit-black shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-tertiary hover:bg-zenit-surface-3 shadow-inner'}`}
                      >
                        <div className="scale-110">{cat.icon}</div>
                        <span className="text-[9px] mt-2 font-bold uppercase tracking-tighter">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <CustomSlider
                    min={0}
                    max={100}
                    value={newEnergy}
                    onChange={setNewEnergy}
                    label={t.routine.expectedEnergy}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">{t.routine.weeklyRepetition}</label>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(day => (
                      <button
                        key={day.id}
                        onClick={() => {
                          if (selectedDays.includes(day.id)) {
                            setSelectedDays(selectedDays.filter(d => d !== day.id));
                          } else {
                            setSelectedDays([...selectedDays, day.id]);
                          }
                        }}
                        className={`h-12 rounded-xl text-[10px] font-bold transition-all active:scale-90 border flex items-center justify-center ${selectedDays.includes(day.id) ? 'bg-zenit-accent border-zenit-accent text-white shadow-[0_0_15px_var(--accent-glow)]' : 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-tertiary hover:bg-zenit-surface-3 shadow-inner'}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-5 rounded-2xl bg-zenit-surface-1 border-2 border-zenit-border-secondary text-zenit-accent text-[11px] font-bold uppercase tracking-[0.3em] transition-all hover:bg-zenit-accent hover:text-white active:scale-95"
                  >
                    {t.routine.cancel}
                  </button>
                  <button
                    onClick={addRoutine}
                    disabled={!newTask.trim()}
                    className="flex-[2] py-5 rounded-2xl bg-gradient-to-r from-zenit-accent to-zenit-crimson text-white text-[11px] font-bold uppercase tracking-[0.3em] shadow-xl shadow-zenit-accent/20 hover:scale-[1.02] transition-all active:scale-95 border border-white/20 disabled:opacity-50 disabled:scale-100"
                  >
                    {t.routine.createProtocol}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
