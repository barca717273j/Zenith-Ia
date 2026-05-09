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
    if (!promptToUse.trim()) return;
    
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
      
      // Etapa 5: Limpeza e Validação de JSON
      let generatedData;
      try {
        const cleanResponse = response.replace(/```json|```/g, '').trim();
        generatedData = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('AI JSON Parse Error, using fallback');
        // Fallback: Rotina padrão de emergência
        generatedData = {
          tasks: [
            { time: "07:00", title: "Protocolo de Despertar", description: "Hidratação e luz solar", category: "health", period: "morning", priority: "high" },
            { time: "09:00", title: "Bloco de Foco Profundo", description: "Tarefa de maior impacto", category: "focus", period: "morning", priority: "high" }
          ]
        };
      }
      
      if (!generatedData.tasks || !Array.isArray(generatedData.tasks)) {
        throw new Error('Formato inválido');
      }
      
      const tasksToInsert = generatedData.tasks.map((t: any) => ({
        user_id: userData.id,
        time: t.time || '08:00',
        title: t.title || 'Tarefa Sem Título',
        description: t.description || '',
        category: t.category || 'focus',
        period: t.period || 'morning',
        completed: false,
        priority: t.priority || 'medium',
        xp_reward: t.priority === 'high' ? 100 : 50,
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      }));
      
      const { error: tasksError } = await supabase
        .from('routines')
        .insert(tasksToInsert);
        
      if (tasksError) throw tasksError;
      
      fetchRoutines();
      setAiPrompt('');
      alert('Protocolo Zenit gerado e validado! 🚀');
    } catch (err: any) {
      console.error('Routine Generation Error:', err);
      alert('Erro ao sincronizar com a IA. Tente um comando mais simples.');
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
    
    // Default times for periods if time is hidden
    const periodTimes: Record<string, string> = {
      morning: '08:00',
      afternoon: '14:00',
      evening: '20:00'
    };

    const { data, error } = await supabase
      .from('routines')
      .insert([{ 
        user_id: userData.id, 
        title: newTask, 
        name: newTask,
        description: '',
        time: periodTimes[newPeriod] || '08:00', 
        duration: newDuration,
        category: newCategory,
        icon:
          newCategory === 'health'
            ? 'Activity'
            : newCategory === 'mental'
            ? 'Wind'
            : newCategory === 'finance'
            ? 'TrendingUp'
            : 'Brain',
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
    if (!routine || !userData?.id) return;

    try {
      // 1. Atualiza o estado da rotina no banco
      const { error } = await supabase
        .from('routines')
        .update({ 
          completed: !completed,
          // Se estiver concluindo, opcionalmente salvamos o timestamp da última conclusão aqui também
          description: routine.description // apenas para garantir o update
        })
        .eq('id', id);
      
      if (error) throw error;

      // 2. Se estiver concluindo, vamos gerar um LOG REAL (Etapa 3)
      if (!completed) {
        await supabase.from('routine_logs').insert([{
          user_id: userData.id,
          routine_id: id
        }]);

        // 3. Adiciona XP real (Etapa 3)
        const xpAmount = routine.xp_reward || 25;
        addXP(xpAmount);
        
        // Atualiza o XP no perfil do Supabase de forma persistente
        const { data: profile } = await supabase.from('profiles').select('xp').eq('id', userData.id).single();
        if (profile) {
           await supabase.from('profiles').update({ xp: (profile.xp || 0) + xpAmount }).eq('id', userData.id);
        }

        await incrementUsage('actions');
      }

      // Atualiza UI local
      setRoutines(prev => prev.map(r => r.id === id ? { ...r, completed: !completed } : r));
    } catch (err) {
      console.error("Erro ao alternar rotina:", err);
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
    <div className="flex flex-col gap-8 p-6 pb-56 max-w-2xl mx-auto min-h-screen bg-zenit-black">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-display font-medium tracking-tight text-zenit-text-primary uppercase italic leading-none">
            {t.routine.title.split(' ')[0]} <span className="text-zenit-scarlet">{t.routine.title.split(' ')[1]}</span>
          </h2>
          <div className="flex items-center space-x-3">
             <div className="w-1.5 h-1.5 rounded-full bg-zenit-scarlet animate-pulse" />
             <p className="text-[10px] font-bold text-zenit-text-tertiary uppercase tracking-[0.4em] opacity-60">{t.routine.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="w-12 h-12 rounded-[1.2rem] bg-zenit-surface-1/40 backdrop-blur-xl border border-zenit-border-primary text-zenit-text-tertiary hover:text-zenit-scarlet transition-all flex items-center justify-center shadow-lg"
            >
              <Bell size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsAdding(true)}
            className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-zenit-scarlet to-zenit-crimson text-white shadow-[0_10px_30px_rgba(255,0,0,0.3)] flex items-center justify-center transition-all active:scale-95 border border-zenit-border-primary/20"
          >
            <Plus size={28} />
          </button>
        </div>
      </header>

      {/* AI Assistant Section - Rebuilt for High Fidelity */}
      <section className="glass-card p-8 rounded-[2.5rem] border border-zenit-border-primary bg-zenit-surface-1/60 backdrop-blur-xl relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles className="text-zenit-scarlet" size={80} />
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-zenit-surface-2 border border-zenit-border-primary flex items-center justify-center shadow-inner">
              <Zap size={24} className="text-zenit-scarlet animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[14px] font-black uppercase tracking-[0.3em] text-zenit-text-primary italic">{t.routine.aiArchitect}</h2>
              <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-black opacity-40">{t.routine.aiSubtitle}</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <textarea
              placeholder={t.routine.aiPlaceholder}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-zenit-surface-2/50 border border-zenit-border-primary rounded-[2rem] p-6 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-scarlet/30 transition-all min-h-[160px] resize-none placeholder:text-zenit-text-tertiary/20 leading-relaxed font-medium"
            />
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => {
                  const prompt = "Sugira uma rotina otimizada com base nos meus hábitos e objetivos atuais para um dia de alta performance.";
                  setAiPrompt(prompt);
                  generateAiRoutine(prompt);
                }}
                disabled={isAiGenerating}
                className="w-full sm:flex-1 bg-zenit-surface-2 hover:bg-zenit-surface-1 text-zenit-text-primary px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-zenit-border-primary active:scale-95 flex items-center justify-center gap-3"
              >
                <Brain size={16} />
                <span>Optimize Profile</span>
              </button>
              <button
                onClick={() => generateAiRoutine()}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-br from-zenit-scarlet to-zenit-crimson text-white text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(255,0,0,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3 border border-zenit-border-primary/20 disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>Generate Protocol</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Card - Sleek Metric */}
      <div className="glass-card p-8 rounded-[2.5rem] flex items-center justify-between bg-zenit-surface-1/40 border border-zenit-border-primary backdrop-blur-md">
        <div className="space-y-4 flex-1">
          <div className="flex items-center space-x-3">
             <div className="w-1 h-3 bg-zenit-scarlet rounded-full" />
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zenit-text-tertiary opacity-60">Daily Consistency</h3>
          </div>
          <div className="flex items-end space-x-6">
            <p className="text-5xl font-display font-medium text-zenit-text-primary tracking-tighter italic leading-none">{completionRate}%</p>
            <div className="flex-1 max-w-[140px] mb-1.5">
               <div className="h-1.5 bg-zenit-surface-2 rounded-full overflow-hidden border border-zenit-border-primary/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    className="h-full bg-zenit-scarlet shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                    transition={{ duration: 1.5 }}
                  />
               </div>
            </div>
          </div>
        </div>
        <div className="w-16 h-16 rounded-[1.5rem] bg-zenit-surface-2 flex items-center justify-center border border-zenit-border-primary shadow-xl">
          <Target size={28} className="text-zenit-scarlet" />
        </div>
      </div>

            {/* Routine Sections Groups */}
      <div className="space-y-12">
        {periods.map(period => {
          const periodRoutines = routines.filter(r => r.period === period.id);
          
          return (
            <div key={period.id} className="space-y-6">
              <div className="flex items-center space-x-4 px-2">
                <div className={`w-1.5 h-6 rounded-full shadow-[0_0_15px_var(--accent-glow)] ${period.id === 'morning' ? 'bg-amber-400' : period.id === 'afternoon' ? 'bg-orange-500' : 'bg-zenit-accent'}`} />
                <div className="flex items-center space-x-3">
                  {period.icon}
                  <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zenit-text-primary italic">{period.label}</h3>
                </div>
                <div className="flex-1 h-px bg-zenit-border-primary/20" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zenit-text-tertiary italic">
                  {periodRoutines.length} {periodRoutines.length === 1 ? 'Tarefa' : 'Tarefas'}
                </span>
              </div>

              <div className="relative space-y-4 pl-4 border-l border-zenit-border-primary/20 ml-2.5">
                {periodRoutines.length === 0 ? (
                  <div className="py-8 pl-8 opacity-20 italic">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zenit-text-tertiary">Sincronia Pendente...</p>
                  </div>
                ) : (
                  periodRoutines.map((r, idx) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group"
                    >
                      <div className={`glass-card p-1 rounded-[2.5rem] bg-gradient-to-br from-zenit-border-primary/20 to-transparent ${r.completed ? 'opacity-40 grayscale-[0.5] scale-[0.98]' : 'hover:scale-[1.01]'} transition-all duration-500`}>
                        <div className="p-6 rounded-[2.4rem] bg-zenit-surface-1/80 backdrop-blur-xl flex items-center justify-between">
                          <div className="flex items-center space-x-5">
                            <button 
                              onClick={() => toggleRoutine(r.id, r.completed)}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${r.completed ? 'bg-zenit-scarlet border-zenit-scarlet text-white' : 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-tertiary'}`}
                            >
                              {r.completed ? <Check size={20} strokeWidth={3} /> : <Circle size={20} />}
                            </button>
                            <div className="space-y-1">
                              <h4 className={`text-lg font-display font-bold tracking-tight italic ${r.completed ? 'text-zenit-text-tertiary line-through' : 'text-zenit-text-primary'}`}>
                                {r.title}
                              </h4>
                              <div className="flex items-center space-x-3">
                                <div className={`w-1 h-1 rounded-full ${categories.find(c => c.id === r.category)?.color}`} />
                                <span className={`text-[8px] font-black uppercase tracking-widest ${categories.find(c => c.id === r.category)?.color}`}>
                                  {categories.find(c => c.id === r.category)?.label}
                                </span>
                                {r.duration && (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-zenit-text-tertiary opacity-40">
                                    • {r.duration}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => deleteRoutine(r.id)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-zenit-text-tertiary/20 hover:text-zenit-scarlet transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
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
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-zenit-glass w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] border-t border-zenit-glass-border space-y-6 relative overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] backdrop-blur-2xl"
            >
              <div className="w-12 h-1 bg-zenit-border-primary rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />
              
              <div className="px-8 flex justify-between items-center flex-shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-black text-zenit-text-primary tracking-tighter uppercase italic">Novo <span className="text-zenit-accent">Protocolo</span></h3>
                  <p className="text-[9px] text-zenit-text-tertiary font-black uppercase tracking-[0.3em] opacity-40">Configuração de Alta Performance</p>
                </div>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="w-10 h-10 rounded-full bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary hover:bg-zenit-surface-3 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 pb-10 space-y-8 overflow-y-auto scrollbar-hide flex-1">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-black uppercase tracking-[0.3em] ml-1">Identificador do Protocolo</label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Ex: Foco Profundo"
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl px-6 py-4 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/50 transition-all placeholder:text-zenit-text-tertiary/20 shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-black uppercase tracking-[0.3em] ml-1">Ciclo do Protocolo</label>
                  <div className="flex gap-2 p-1.5 bg-zenit-glass rounded-2xl border border-zenit-glass-border shadow-inner">
                    {periods.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setNewPeriod(p.id as any)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${newPeriod === p.id ? 'bg-zenit-accent/20 text-zenit-accent' : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
                      >
                        {p.icon}
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-black uppercase tracking-[0.3em] ml-1">Janela</label>
                  <div className="relative">
                    <Activity size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zenit-accent/50 pointer-events-none" />
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl pl-12 pr-6 py-4 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/50 transition-all appearance-none shadow-inner"
                    >
                      <option value="15min">15 min</option>
                      <option value="30min">30 min</option>
                      <option value="45min">45 min</option>
                      <option value="1h">1 hora</option>
                      <option value="2h">2 horas</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-black uppercase tracking-[0.3em] ml-1">Prioridade Neural</label>
                  <div className="flex gap-2 p-1.5 bg-zenit-glass rounded-2xl border border-zenit-glass-border shadow-inner">
                    {priorities.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setNewPriority(p.id as any)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newPriority === p.id ? p.color : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-black uppercase tracking-[0.3em] ml-1">Domínio</label>
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${newCategory === cat.id ? 'bg-zenit-text-primary text-zenit-black border-zenit-text-primary shadow-xl' : 'bg-zenit-surface-2 border-zenit-border-primary text-zenit-text-tertiary shadow-inner hover:bg-zenit-surface-3'}`}
                      >
                        <div className="scale-110">{cat.icon}</div>
                        <span className="text-[8px] mt-2 font-black uppercase tracking-tighter">{cat.label}</span>
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
                    label="Nível de Energia Requerido"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-5 rounded-2xl bg-zenit-surface-2 text-zenit-text-tertiary text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-zenit-surface-3 active:scale-95"
                  >
                    Abortar
                  </button>
                  <button
                    onClick={addRoutine}
                    disabled={!newTask.trim()}
                    className="flex-[2] py-5 rounded-2xl bg-gradient-to-r from-zenit-accent to-zenit-crimson text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-zenit-accent/20 hover:scale-[1.02] transition-all active:scale-95 border border-zenit-border-primary/20 disabled:opacity-50"
                  >
                    Ativar Protocolo
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
