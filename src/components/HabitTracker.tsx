import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, Flame, Trophy, Trash2, X, Sparkles, 
  Zap, Calendar, TrendingUp, Award, ChevronRight,
  Target, Info, Star
} from 'lucide-react';
import { supabase } from '../supabase';
import { useGamification } from './GamificationContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed_today: boolean;
  user_id: string;
  last_completed?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target: number;
  current_progress: number;
  completion_history?: string[]; // Array of ISO dates
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
  userData: any;
  t: any;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ userData, t }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'habits' | 'tasks' | 'stats'>('habits');
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newTarget, setNewTarget] = useState(1);
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
        user_id: user.id,
        frequency: newFrequency,
        target: newTarget,
        current_progress: 0,
        completion_history: []
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
    const todayStr = new Date().toDateString();
    const isCompleting = !habit.completed_today;
    
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

    if (!error) {
      setHabits(habits.map(h => 
        h.id === habit.id ? { 
          ...h, 
          completed_today: isCompleting, 
          streak: newStreak,
          completion_history: newHistory
        } : h
      ));
      if (isCompleting) {
        addXP(20);
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
      if (isCompleting) addXP(30);
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

  const isPro = userData?.subscription_tier && userData.subscription_tier !== 'free';
  const habitLimit = isPro ? 100 : 3;

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
    { id: '1', title: 'Fogo Eterno', description: 'Mantenha um streak de 7 dias', icon: <Flame size={16} />, unlocked: habits.some(h => h.streak >= 7), progress: Math.max(...habits.map(h => h.streak), 0), total: 7 },
    { id: '2', title: 'Mestre da Rotina', description: 'Complete 50 hábitos totais', icon: <Trophy size={16} />, unlocked: false, progress: 12, total: 50 },
    { id: '3', title: 'Foco Absoluto', description: 'Complete todas as tarefas do dia', icon: <Target size={16} />, unlocked: tasks.length > 0 && tasks.every(t => t.completed), progress: tasks.filter(t => t.completed).length, total: tasks.length || 1 },
  ];

  return (
    <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-display tracking-tighter uppercase leading-none text-white">
            Protocolos <span className="text-zenith-scarlet">IA</span>
          </h1>
          <div className="flex items-center space-x-2">
            <div className="h-1 w-12 bg-zenith-scarlet rounded-full" />
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
              {activeView === 'habits' ? `${habits.length}/${habitLimit} Hábitos` : activeView === 'tasks' ? `${tasks.length} Tarefas` : 'Análise Neural'}
            </p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(true)}
          disabled={activeView === 'habits' && habits.length >= habitLimit}
          className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-zenith-scarlet transition-all disabled:opacity-50 group"
        >
          <Plus size={28} className="text-white/60 group-hover:text-zenith-scarlet transition-colors" />
        </motion.button>
      </header>

      {/* View Switcher */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setActiveView('habits')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${activeView === 'habits' ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Hábitos
        </button>
        <button
          onClick={() => setActiveView('tasks')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${activeView === 'tasks' ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Tarefas
        </button>
        <button
          onClick={() => setActiveView('stats')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${activeView === 'stats' ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Análise
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'habits' && (
          <motion.div 
            key="habits"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-white/5 bg-white/[0.02] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-zenith-scarlet/20" />
                <Flame className="text-zenith-scarlet drop-shadow-[0_0_8px_rgba(255,38,33,0.5)]" size={28} />
                <div className="text-center">
                  <p className="text-4xl font-display font-bold tracking-tighter text-white">
                    {Math.max(0, ...habits.map(h => h.streak), 0)}
                  </p>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Recorde Neural</p>
                </div>
              </div>
              <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-white/5 bg-white/[0.02] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
                <Trophy className="text-white/60" size={28} />
                <div className="text-center">
                  <p className="text-4xl font-display font-bold tracking-tighter text-white">
                    {habits.length > 0 ? Math.round((habits.filter(h => h.completed_today).length / habits.length) * 100) : 0}%
                  </p>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Sincronia Hoje</p>
                </div>
              </div>
            </div>

            {/* Habits List */}
            <div className="space-y-4">
              {habits.map((habit) => (
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
                          ? 'bg-zenith-scarlet text-white shadow-[0_0_25px_rgba(255,38,33,0.5)]' 
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
                        <div className="flex items-center space-x-1.5 text-[10px] text-zenith-scarlet font-bold uppercase tracking-widest">
                          <Flame size={14} />
                          <span>{habit.streak} DIAS</span>
                        </div>
                        <div className="h-1 w-1 bg-white/10 rounded-full" />
                        <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{habit.frequency}</span>
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
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'tasks' && (
          <motion.div 
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {tasks.map((task) => (
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
                        ? 'bg-zenith-scarlet text-white shadow-[0_0_15px_rgba(255,38,33,0.3)]' 
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
                      <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-zenith-scarlet' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-white/20'}`} />
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
          </motion.div>
        )}

        {activeView === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Performance Chart */}
            <div className="glass-card p-8 border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">Eficiência Semanal</h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Volume de conclusão neural</p>
                </div>
                <TrendingUp size={20} className="text-zenith-scarlet" />
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF2621" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF2621" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#FF2621' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#FF2621" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorComp)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <Award size={16} className="text-zenith-scarlet" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Conquistas Desbloqueadas</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className={`glass-card p-5 border-white/5 flex items-center justify-between ${ach.unlocked ? 'bg-zenith-scarlet/5 border-zenith-scarlet/20' : 'bg-white/[0.01]'}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ach.unlocked ? 'bg-zenith-scarlet text-white shadow-[0_0_15px_rgba(255,38,33,0.3)]' : 'bg-white/5 text-white/20'}`}>
                        {ach.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className={`text-sm font-bold tracking-tight ${ach.unlocked ? 'text-white' : 'text-white/40'}`}>{ach.title}</h4>
                        <p className="text-[9px] text-white/20 uppercase tracking-widest">{ach.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold font-mono ${ach.unlocked ? 'text-zenith-scarlet' : 'text-white/20'}`}>
                        {ach.progress}/{ach.total}
                      </p>
                      <div className="w-20 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(ach.progress / ach.total) * 100}%` }}
                          className={`h-full ${ach.unlocked ? 'bg-zenith-scarlet' : 'bg-white/20'}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar View (Simple Grid) */}
            <div className="glass-card p-8 border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-zenith-scarlet" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Mapa de Calor Neural</h3>
                </div>
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Março 2026</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }).map((_, i) => {
                  const hasActivity = i % 3 === 0;
                  const isToday = i === 11; // March 12
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-md flex items-center justify-center text-[8px] font-bold transition-all ${
                        isToday ? 'border border-zenith-scarlet text-zenith-scarlet' :
                        hasActivity ? 'bg-zenith-scarlet/40 text-white' : 'bg-white/5 text-white/10'
                      }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-white">
                    {activeView === 'habits' ? 'Novo Hábito' : 'Nova Tarefa'}
                  </h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Defina sua próxima diretriz</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder={activeView === 'habits' ? "Nome do Hábito..." : "O que precisa ser feito?"}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-zenith-scarlet transition-all placeholder:text-white/10"
                  />
                  <Zap size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10" />
                </div>

                {activeView === 'habits' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] text-white/30 font-bold uppercase tracking-widest ml-1">Frequência</label>
                      <select
                        value={newFrequency}
                        onChange={(e) => setNewFrequency(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-zenith-scarlet transition-all appearance-none"
                      >
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] text-white/30 font-bold uppercase tracking-widest ml-1">Meta (Vezes)</label>
                      <input
                        type="number"
                        min="1"
                        value={newTarget}
                        onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-zenith-scarlet transition-all"
                      />
                    </div>
                  </div>
                )}

                <button 
                  onClick={addHabit}
                  className="w-full py-5 rounded-2xl bg-zenith-scarlet text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,38,33,0.2)] hover:shadow-[0_0_40px_rgba(255,38,33,0.4)] transition-all"
                >
                  {activeView === 'habits' ? 'Inicializar Hábito' : 'Criar Tarefa'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {(activeView === 'habits' ? habits.length : activeView === 'tasks' ? tasks.length : 0) === 0 && activeView !== 'stats' && (
        <div className="py-24 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-10">
            <Plus size={40} />
          </div>
          <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em]">Nenhum item ativo</p>
        </div>
      )}
    </div>
  );
};
