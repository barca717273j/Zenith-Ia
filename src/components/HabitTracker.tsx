import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, Flame, Trophy, Trash2, X, Sparkles, 
  Zap, Calendar, TrendingUp, Award, ChevronRight,
  Target, Info, Star, Clock, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGamification } from './GamificationContext';
import { useUser } from '../contexts/UserContext';
import { TIER_LIMITS } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface Habit {
  id: string;
  title: string;
  description?: string;
  streak: number;
  completed_today: boolean;
  user_id: string;
  last_completed?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  current_progress: number;
  target_value: number;
  target_unit: string;
  completion_history?: string[]; // Array of ISO dates
  reminder_time?: string; // HH:mm format
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  total: number;
}

interface HabitTrackerProps {
  t: any;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ t }) => {
  const { userData, checkLimit, incrementUsage } = useUser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'habits' | 'tasks' | 'stats'>('habits');
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newTarget, setNewTarget] = useState(1);
  const [newReminderTime, setNewReminderTime] = useState('');
  const { addXP } = useGamification();

  useEffect(() => {
    if (userData?.id) {
      fetchHabits();
      fetchTasks();
    }

    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check for reminders every minute
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      habits.forEach(habit => {
        if (habit.reminder_time === currentTime && !habit.completed_today) {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Zenit Habit Reminder', {
              body: `Time for your habit: ${habit.title}`,
              icon: '/icon-192x192.png'
            });
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [userData?.id, habits.length]);

  const fetchHabits = async () => {
    if (!userData?.id) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userData.id);

      if (error) throw error;

      if (Array.isArray(data)) {
        const today = new Date().toDateString();
        const updatedHabits = data.map(h => {
          const lastDate = h.last_completed ? new Date(h.last_completed).toDateString() : null;
          if (lastDate !== today) {
            return { ...h, completed_today: false };
          }
          return h;
        });
        setHabits(updatedHabits);
      }
    } catch (err) {
      console.error('Error fetching habits:', err);
    }
  };

  const fetchTasks = async () => {
    if (!userData?.id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim() || !userData?.id) return;

    if (activeView === 'habits') {
      const limitCheck = await checkLimit('habits');
      if (!limitCheck.allowed) {
        alert(limitCheck.message || 'Limite de hábitos atingido. Faça upgrade para continuar.');
        return;
      }

      const newHabit = {
        title: newHabitName,
        description: '',
        streak: 0,
        completed_today: false,
        user_id: userData.id,
        frequency: newFrequency,
        target: newTarget,
        current_progress: 0,
        completion_history: [],
        reminder_time: newReminderTime || null
      };

      const { data, error } = await supabase
        .from('habits')
        .insert([newHabit])
        .select();

      if (data) {
        setHabits([...habits, data[0]]);
        setNewHabitName('');
        setIsAdding(false);
      }
    } else {
      const limitCheck = await checkLimit('actions');
      if (!limitCheck.allowed) {
        alert(limitCheck.message || 'Limite de ações diárias atingido. Faça upgrade para continuar.');
        return;
      }

      const newTask = {
        title: newHabitName,
        description: '',
        completed: false,
        user_id: userData.id,
        priority: 'medium'
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();

      if (data) {
        await incrementUsage('actions');
        setTasks([data[0], ...tasks]);
        setNewHabitName('');
        setIsAdding(false);
      }
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const toggleHabit = async (habit: Habit) => {
    const today = new Date().toISOString();
    const todayStr = new Date().toDateString();
    const isCompleting = !habit.completed_today;
    
    if (isCompleting) {
      const limitCheck = await checkLimit('actions');
      if (!limitCheck.allowed) {
        alert(limitCheck.message || 'Limite de ações diárias atingido. Faça upgrade para continuar.');
        return;
      }
    }

    let newStreak = habit.streak;
    let newHistory = habit.completion_history || [];

    if (isCompleting) {
      newStreak += 1;
      newHistory = [...newHistory, today];
    } else {
      newStreak = Math.max(0, newStreak - 1);
      newHistory = newHistory.filter(d => new Date(d).toDateString() !== todayStr);
    }

    const { error } = await supabase
      .from('habits')
      .update({ 
        completed_today: isCompleting, 
        streak: newStreak,
        last_completed: isCompleting ? today : habit.last_completed,
        completion_history: newHistory
      })
      .eq('id', habit.id);

    if (!error && Array.isArray(habits)) {
      setHabits(habits.map(h => 
        h.id === habit.id ? { 
          ...h, 
          completed_today: isCompleting, 
          streak: newStreak,
          completion_history: newHistory
        } : h
      ));
      if (isCompleting) {
        await incrementUsage('actions');
        addXP(20);
      }
    }
  };

  const toggleTask = async (task: any) => {
    const isCompleting = !task.completed;
    
    if (isCompleting) {
      const limitCheck = await checkLimit('actions');
      if (!limitCheck.allowed) {
        alert(limitCheck.message || 'Limite de ações diárias atingido. Faça upgrade para continuar.');
        return;
      }
    }

    const { error } = await supabase
      .from('tasks')
      .update({ completed: isCompleting })
      .eq('id', task.id);

    if (Array.isArray(tasks)) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: isCompleting } : t));
      if (isCompleting) {
        await incrementUsage('actions');
        addXP(30);
      }
    }
  };

  const deleteHabit = async (id: string) => {
    const table = activeView === 'habits' ? 'habits' : 'tasks';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (!error) {
      if (activeView === 'habits') {
        setHabits(habits.filter(h => h.id !== id));
      } else {
        setTasks(tasks.filter(t => t.id !== id));
      }
    }
  };

  const tier = userData?.subscription_tier || 'basic';
  const habitLimit = TIER_LIMITS[tier].habits;

  // Stats Data
  const chartData = [
    { name: 'Seg', completed: 4 },
    { name: 'Ter', completed: 3 },
    { name: 'Qua', completed: 5 },
    { name: 'Qui', completed: 2 },
    { name: 'Sex', completed: 6 },
    { name: 'Sáb', completed: 4 },
    { name: 'Dom', completed: 7 },
  ];

  const achievements: Achievement[] = [
    { id: '1', title: 'Fogo Eterno', description: 'Mantenha um streak de 7 dias', icon: <Flame size={16} />, unlocked: Array.isArray(habits) && habits.some(h => h.streak >= 7), progress: Math.max(...(Array.isArray(habits) ? habits.map(h => h.streak) : [0]), 0), total: 7 },
    { id: '2', title: 'Mestre da Rotina', description: 'Complete 50 hábitos totais', icon: <Trophy size={16} />, unlocked: false, progress: 12, total: 50 },
    { id: '3', title: 'Foco Absoluto', description: 'Complete todas as tarefas do dia', icon: <Target size={16} />, unlocked: Array.isArray(tasks) && tasks.length > 0 && tasks.every(t => t.completed), progress: Array.isArray(tasks) ? tasks.filter(t => t.completed).length : 0, total: Array.isArray(tasks) ? tasks.length || 1 : 1 },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="flex justify-between items-end mb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display tracking-tighter uppercase leading-none text-zenit-text-primary italic">
            Sincronia <span className="text-zenit-accent">Neural</span>
          </h1>
          <div className="flex items-center space-x-3">
            <div className="h-1 w-16 bg-gradient-to-r from-zenit-accent to-transparent rounded-full shadow-[0_0_10px_var(--accent-glow)]" />
            <p className="text-zenit-text-tertiary text-[11px] font-bold uppercase tracking-[0.3em]">
              {activeView === 'habits' ? `${habits.length}/${habitLimit} Protocolos Ativos` : activeView === 'tasks' ? `${tasks.length} Diretrizes Pendentes` : 'Análise de Performance'}
            </p>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)}
          disabled={activeView === 'habits' && habits.length >= habitLimit}
          className="neon-button w-16 h-16 !p-0"
        >
          <Plus size={32} />
        </motion.button>
      </header>

      {/* View Switcher */}
      <div className="flex glass-nav p-1.5 rounded-[2rem] border border-zenit-border-primary">
        {(['habits', 'tasks', 'stats'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 py-4 text-[11px] uppercase tracking-[0.2em] font-black rounded-[1.5rem] transition-all duration-500 relative overflow-hidden ${
              activeView === view 
                ? 'text-white' 
                : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'
            }`}
          >
            {activeView === view && (
              <motion.div 
                layoutId="active-view-bg"
                className="absolute inset-0 bg-gradient-to-br from-zenit-accent to-zenit-crimson shadow-lg"
              />
            )}
            <span className="relative z-10">{view === 'habits' ? 'Hábitos' : view === 'tasks' ? 'Tarefas' : 'Análise'}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'habits' && (
          <motion.div 
            key="habits"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Stats Summary - More Compact & Elegant */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-6 rounded-[2rem] border-zenit-border-primary bg-zenit-surface-1 flex flex-col items-center justify-center space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-zenit-scarlet/5 flex items-center justify-center border border-zenit-scarlet/10 group-hover:scale-110 transition-transform">
                  <Flame className="text-zenit-scarlet drop-shadow-[0_0_10px_rgba(255,0,0,0.4)]" size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-medium text-zenit-text-primary tracking-tight">
                    {Math.max(0, ...habits.map(h => h.streak), 0)}
                  </p>
                  <p className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-[0.2em]">Peak Streak</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-[2rem] border-zenit-border-primary bg-zenit-surface-1 flex flex-col items-center justify-center space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/5 flex items-center justify-center border border-blue-500/10 group-hover:scale-110 transition-transform">
                  <Activity className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" size={20} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display font-medium text-zenit-text-primary tracking-tight">
                    {habits.length > 0 ? Math.round((habits.filter(h => h.completed_today).length / habits.length) * 100) : 0}%
                  </p>
                  <p className="text-[8px] text-zenit-text-tertiary font-black uppercase tracking-[0.2em]">Sincronia</p>
                </div>
              </div>
            </div>

            {/* Habits List */}
            <div className="space-y-4">
              {habits.map((habit) => (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`glass-card p-4 sm:p-5 rounded-[2rem] flex items-center transition-all duration-500 border border-zenit-border-primary/50 relative overflow-hidden group ${
                    habit.completed_today ? 'bg-zenit-surface-1/30 grayscale-[0.8] opacity-60' : 'bg-zenit-surface-1 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center space-x-5 flex-1 relative z-10 min-w-0">
                    <button
                      onClick={() => toggleHabit(habit)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative border min-h-[44px] min-w-[44px] flex-shrink-0 ${
                        habit.completed_today 
                          ? 'bg-zenit-scarlet border-zenit-scarlet text-white shadow-[0_0_25px_rgba(255,0,0,0.4)]' 
                          : 'bg-zenit-surface-2 text-zenit-text-tertiary border-zenit-border-primary'
                      }`}
                    >
                      {habit.completed_today ? (
                        <Check size={24} strokeWidth={3} />
                      ) : (
                        <Plus size={24} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-base font-bold tracking-tight truncate transition-all duration-500 ${habit.completed_today ? 'text-zenit-text-tertiary font-medium italic' : 'text-zenit-text-primary'}`}>
                          {habit.title}
                        </p>
                        <div className="flex items-center px-2 py-1 bg-zenit-surface-2 rounded-lg border border-zenit-border-primary/50 flex-shrink-0">
                          <Flame size={12} className={habit.streak > 0 ? 'text-zenit-scarlet' : 'text-zenit-text-tertiary opacity-40'} />
                          <span className="text-[10px] font-bold font-mono ml-1">{habit.streak}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-[8px] font-black uppercase tracking-widest text-zenit-text-tertiary opacity-60">
                        <span className="flex items-center gap-1.5">
                          <Star size={10} />
                          {habit.frequency}
                        </span>
                        <span className="w-1 h-1 bg-zenit-border-primary rounded-full" />
                        <span className="truncate">Ciclo: {habit.target_value || 1} {habit.target_unit || 'un'}</span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="h-1 w-full bg-zenit-surface-2 rounded-full overflow-hidden mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min((habit.streak / 30) * 100, 100)}%` }}
                           className="h-full bg-zenit-scarlet"
                         />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => deleteHabit(habit.id)}
                    className="ml-4 p-3 text-zenit-text-tertiary hover:text-zenit-scarlet opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'tasks' && (
          <motion.div 
            key="tasks"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4"
          >
            {tasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`glass-card p-4 rounded-2xl flex items-center justify-between border border-zenit-border-primary/50 relative overflow-hidden group ${
                  task.completed ? 'opacity-40 grayscale' : 'bg-zenit-surface-1'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1 relative z-10">
                  <button
                    onClick={() => toggleTask(task)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border-2 ${
                      task.completed 
                        ? 'bg-zenit-scarlet border-zenit-scarlet text-white' 
                        : 'bg-zenit-surface-2 border-zenit-border-primary'
                    }`}
                  >
                    {task.completed ? <Check size={18} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-zenit-border-primary" />}
                  </button>
                  <div className="space-y-0.5 min-w-0">
                    <p className={`text-sm font-bold tracking-tight truncate ${task.completed ? 'text-zenit-text-tertiary line-through italic' : 'text-zenit-text-primary'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest text-zenit-text-tertiary opacity-60">
                      <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-zenit-scarlet' : task.priority === 'medium' ? 'bg-emerald-500' : 'bg-zenit-text-tertiary'}`} />
                      <span>{task.priority || 'Normal'}</span>
                      {task.due_date && <span>• {task.due_date}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-zenit-text-tertiary hover:text-zenit-scarlet opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeView === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Performance Chart */}
            <div className="premium-card border-zenit-border-primary bg-zenit-surface-1 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary">Ciclo de Performance</h3>
                  <p className="text-2xl font-display font-bold text-zenit-text-primary mt-1">Eficiência Neural</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-zenit-accent/10 flex items-center justify-center border border-zenit-accent/20">
                  <Activity size={28} className="text-zenit-accent" />
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zenit-border-primary opacity-20" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 'bold' }}
                      className="text-zenit-text-tertiary"
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--surface-1)', 
                        border: '1px solid var(--border-primary)',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: 'var(--text-primary)'
                      }}
                      itemStyle={{ color: 'var(--accent-color)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="var(--accent-color)" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary px-2">Conquistas Desbloqueadas</h3>
              <div className="grid grid-cols-1 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className={`premium-card flex items-center justify-between group transition-all duration-500 ${ach.unlocked ? 'border-zenit-accent/30' : ''}`}>
                    <div className="flex items-center space-x-6">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 ${ach.unlocked ? 'bg-zenit-accent text-white shadow-[0_0_30px_var(--accent-glow)] scale-110 rotate-6' : 'bg-zenit-surface-2 text-zenit-text-tertiary'}`}>
                        <span className="text-3xl">{ach.icon}</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className={`text-lg font-bold tracking-tight ${ach.unlocked ? 'text-zenit-text-primary' : 'text-zenit-text-tertiary'}`}>{ach.title}</h4>
                        <p className="text-[11px] text-zenit-text-tertiary font-bold uppercase tracking-widest">{ach.description}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      <p className={`text-sm font-black font-mono ${ach.unlocked ? 'text-zenit-accent' : 'text-zenit-text-tertiary'}`}>
                        {ach.progress}/{ach.total}
                      </p>
                      <div className="w-24 h-1.5 bg-zenit-surface-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(ach.progress / ach.total) * 100}%` }}
                          className={`h-full transition-all duration-1000 ${ach.unlocked ? 'bg-zenit-accent shadow-[0_0_10px_var(--accent-glow)]' : 'bg-zenit-border-primary'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar View (Simple Grid) */}
            <div className="premium-card space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zenit-text-tertiary">Mapa de Calor Neural</h3>
                  <p className="text-2xl font-display font-bold text-zenit-text-primary">Consistência</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-zenit-surface-2 flex items-center justify-center border border-zenit-border-primary">
                  <Calendar size={28} className="text-zenit-text-tertiary" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 31 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(i + 1);
                  const dateStr = date.toISOString().split('T')[0];
                  const hasActivity = habits.some(h => h.completion_history?.includes(dateStr));
                  const isToday = new Date().getDate() === i + 1 && new Date().getMonth() === date.getMonth();
                  
                  return (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.2, zIndex: 10 }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                        isToday ? 'bg-zenit-text-primary text-zenit-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' :
                        hasActivity ? 'bg-zenit-accent text-white shadow-[0_0_15px_var(--accent-glow)]' : 'bg-zenit-surface-2 text-zenit-text-tertiary'
                      }`}
                    >
                      {i + 1}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal -> Bottom Sheet */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg glass-nav rounded-t-[2.5rem] border-t border-zenit-border-primary p-8 pb-12 shadow-2xl overflow-hidden"
            >
              {/* Drag Handle */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-1.5 bg-zenit-border-primary rounded-full opacity-50" />
              </div>

              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-zenit-text-primary italic">
                    Novo <span className="text-zenit-accent">{activeView === 'habits' ? 'Hábito' : 'Protocolo'}</span>
                  </h3>
                  <p className="text-[11px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">Defina sua próxima diretriz</p>
                </div>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="w-10 h-10 rounded-xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-zenit-border-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder={activeView === 'habits' ? "Nome do Hábito..." : "O que precisa ser feito?"}
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl px-6 py-4 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent transition-all placeholder:text-zenit-text-tertiary"
                  />
                  <Zap size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-zenit-text-tertiary opacity-20" />
                </div>

                {activeView === 'habits' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-widest ml-1">Frequência</label>
                        <select
                          value={newFrequency}
                          onChange={(e) => setNewFrequency(e.target.value as any)}
                          className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-xl px-4 py-3 text-xs text-zenit-text-primary focus:outline-none focus:border-zenit-accent transition-all appearance-none"
                        >
                          <option value="daily" className="bg-zenit-surface-1">Diário</option>
                          <option value="weekly" className="bg-zenit-surface-1">Semanal</option>
                          <option value="monthly" className="bg-zenit-surface-1">Mensal</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-widest ml-1">Meta (Vezes)</label>
                        <input
                          type="number"
                          min="1"
                          value={newTarget}
                          onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
                          className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-xl px-4 py-3 text-xs text-zenit-text-primary focus:outline-none focus:border-zenit-accent transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-widest ml-1">Lembrete (Opcional)</label>
                      <input
                        type="time"
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-xl px-4 py-3 text-xs text-zenit-text-primary focus:outline-none focus:border-zenit-accent transition-all"
                      />
                    </div>
                  </>
                )}

                <button 
                  onClick={addHabit}
                  className="neon-button w-full py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em]"
                >
                  {activeView === 'habits' ? 'Inicializar Hábito' : 'Criar Tarefa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {(activeView === 'habits' ? habits.length : activeView === 'tasks' ? tasks.length : 0) === 0 && activeView !== 'stats' && (
        <div className="py-24 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-zenit-surface-1 border border-zenit-border-primary flex items-center justify-center mx-auto opacity-10">
            <Plus size={40} className="text-zenit-text-tertiary" />
          </div>
          <p className="text-zenit-text-tertiary text-xs font-bold uppercase tracking-[0.3em]">Nenhum item ativo</p>
        </div>
      )}
    </div>
  );
};
