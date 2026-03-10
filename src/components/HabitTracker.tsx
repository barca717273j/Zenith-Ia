import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Flame, Trophy, Trash2, X, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../supabase';
import { useGamification } from './GamificationContext';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed_today: boolean;
  user_id: string;
  last_completed?: string;
}

interface HabitTrackerProps {
  userData: any;
  t: any;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ userData, t }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'habits' | 'tasks'>('habits');
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const { addXP } = useGamification();

  useEffect(() => {
    fetchHabits();
    fetchTasks();
  }, []);

  const fetchHabits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
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
  };

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setTasks(data);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (activeView === 'habits') {
      const newHabit = {
        name: newHabitName,
        streak: 0,
        completed_today: false,
        user_id: user.id
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
      const newTask = {
        name: newHabitName,
        completed: false,
        user_id: user.id,
        priority: 'medium'
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();

      if (data) {
        setTasks([data[0], ...tasks]);
        setNewHabitName('');
        setIsAdding(false);
      }
    }
  };

  const toggleHabit = async (habit: Habit) => {
    const today = new Date().toISOString();
    const isCompleting = !habit.completed_today;
    const newStreak = isCompleting ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    const { error } = await supabase
      .from('habits')
      .update({ 
        completed_today: isCompleting, 
        streak: newStreak,
        last_completed: isCompleting ? today : habit.last_completed
      })
      .eq('id', habit.id);

    if (!error) {
      setHabits(habits.map(h => 
        h.id === habit.id ? { ...h, completed_today: isCompleting, streak: newStreak } : h
      ));
      if (isCompleting) {
        addXP(15);
      }
    }
  };

  const toggleTask = async (task: any) => {
    const isCompleting = !task.completed;
    const { error } = await supabase
      .from('tasks')
      .update({ completed: isCompleting })
      .eq('id', task.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: isCompleting } : t));
      if (isCompleting) addXP(25);
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

  const isPro = userData?.subscriptionTier && userData.subscriptionTier !== 'free';
  const habitLimit = isPro ? 100 : 3;

  return (
    <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-display tracking-tighter uppercase leading-none">Protocolos</h1>
          <div className="flex items-center space-x-2">
            <div className="h-1 w-12 bg-zenith-electric-blue rounded-full" />
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
              {activeView === 'habits' ? `${habits.length}/${habitLimit} Hábitos` : `${tasks.length} Tarefas`}
            </p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)}
          disabled={activeView === 'habits' && habits.length >= habitLimit}
          className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-zenith-electric-blue transition-all disabled:opacity-50 group"
        >
          <Plus size={28} className="text-white/60 group-hover:text-zenith-electric-blue transition-colors" />
        </motion.button>
      </header>

      {/* View Switcher */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setActiveView('habits')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${activeView === 'habits' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Hábitos
        </button>
        <button
          onClick={() => setActiveView('tasks')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${activeView === 'tasks' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Tarefas
        </button>
      </div>

      {/* Stats Grid */}
      {activeView === 'habits' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-white/5 bg-white/[0.02] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-electric-blue/20" />
            <Flame className="text-zenith-electric-blue drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={28} />
            <div className="text-center">
              <p className="text-4xl font-display font-bold tracking-tighter text-white">
                {Math.max(0, ...habits.map(h => h.streak), 0)}
              </p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Recorde Neural</p>
            </div>
          </div>
          <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-white/5 bg-white/[0.02] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-zenith-cyan/20" />
            <Trophy className="text-zenith-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" size={28} />
            <div className="text-center">
              <p className="text-4xl font-display font-bold tracking-tighter text-white">
                {habits.length > 0 ? Math.round((habits.filter(h => h.completed_today).length / habits.length) * 100) : 0}%
              </p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Sincronia Hoje</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zenith-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card p-10 w-full max-w-sm space-y-8 border-white/10"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight">
                    {activeView === 'habits' ? 'Novo Hábito' : 'Nova Tarefa'}
                  </h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Defina sua próxima diretriz</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder={activeView === 'habits' ? "Nome do Hábito..." : "O que precisa ser feito?"}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-electric-blue transition-all placeholder:text-white/10"
                  />
                  <Zap size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10" />
                </div>
                <button 
                  onClick={addHabit}
                  className="btn-primary w-full py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                >
                  {activeView === 'habits' ? 'Inicializar Hábito' : 'Criar Tarefa'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {activeView === 'habits' ? habits.map((habit) => (
          <motion.div
            key={habit.id}
            layout
            className="glass-card p-6 flex items-center justify-between group border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
          >
            <div className="flex items-center space-x-6">
              <button
                onClick={() => toggleHabit(habit)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
                  habit.completed_today 
                    ? 'bg-zenith-electric-blue text-white shadow-[0_0_25px_rgba(59,130,246,0.5)]' 
                    : 'bg-white/5 text-white/10 border border-white/10 hover:border-white/20'
                }`}
              >
                {habit.completed_today ? (
                  <Check size={28} strokeWidth={3} />
                ) : (
                  <Sparkles size={20} className="opacity-20" />
                )}
              </button>
              <div className="space-y-1">
                <p className={`text-lg font-bold tracking-tight transition-all ${habit.completed_today ? 'text-white/20 line-through' : 'text-white'}`}>
                  {habit.name}
                </p>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 text-[10px] text-zenith-electric-blue font-bold uppercase tracking-widest">
                    <Flame size={14} />
                    <span>{habit.streak} DIAS</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => deleteHabit(habit.id)}
              className="opacity-0 group-hover:opacity-100 p-3 rounded-xl hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all"
            >
              <Trash2 size={20} />
            </button>
          </motion.div>
        )) : tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            className="glass-card p-6 flex items-center justify-between group border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
          >
            <div className="flex items-center space-x-6">
              <button
                onClick={() => toggleTask(task)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  task.completed 
                    ? 'bg-zenith-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                    : 'bg-white/5 text-white/10 border border-white/10'
                }`}
              >
                {task.completed && <Check size={18} strokeWidth={3} />}
              </button>
              <div className="space-y-1">
                <p className={`text-base font-bold tracking-tight transition-all ${task.completed ? 'text-white/20 line-through' : 'text-white'}`}>
                  {task.name}
                </p>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-zenith-cyan'}`} />
                  <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{task.priority} Priority</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => deleteHabit(task.id)}
              className="opacity-0 group-hover:opacity-100 p-3 rounded-xl hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all"
            >
              <Trash2 size={20} />
            </button>
          </motion.div>
        ))}

        {(activeView === 'habits' ? habits.length : tasks.length) === 0 && (
          <div className="py-24 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-10">
              <Plus size={40} />
            </div>
            <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em]">Nenhum item ativo</p>
          </div>
        )}
      </div>
    </div>
  );
};
