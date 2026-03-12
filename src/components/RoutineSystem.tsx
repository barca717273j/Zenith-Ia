import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Bell, CheckCircle2, Circle, Plus, Trash2, 
  Calendar, Sparkles, Zap, AlertCircle, Target, 
  Brain, Dumbbell, Wind, Activity, Sun, Moon, 
  Coffee, TrendingUp, ChevronRight, X
} from 'lucide-react';
import { supabase } from '../supabase';
import { useGamification } from './GamificationContext';

interface Routine {
  id: string;
  time: string;
  task: string;
  completed: boolean;
  notified: boolean;
  category: string;
  icon: string;
  period: 'morning' | 'afternoon' | 'evening';
}

export const RoutineSystem: React.FC<{ t: any }> = ({ t }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newCategory, setNewCategory] = useState('focus');
  const [newPeriod, setNewPeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [newIcon, setNewIcon] = useState('Zap');
  const [activePeriod, setActivePeriod] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const { addXP } = useGamification();

  const categories = [
    { id: 'focus', label: 'Foco', icon: <Brain size={14} /> },
    { id: 'body', label: 'Corpo', icon: <Dumbbell size={14} /> },
    { id: 'mind', label: 'Mente', icon: <Wind size={14} /> },
    { id: 'work', label: 'Trabalho', icon: <Zap size={14} /> },
  ];

  const periods = [
    { id: 'morning', label: 'Manhã', icon: <Sun size={14} /> },
    { id: 'afternoon', label: 'Tarde', icon: <Coffee size={14} /> },
    { id: 'evening', label: 'Noite', icon: <Moon size={14} /> },
  ];

  useEffect(() => {
    fetchRoutines();

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
  }, []);

  const fetchRoutines = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true });
      if (data) setRoutines(data);
    }
  };

  const triggerAlarm = (routine: Routine) => {
    if (Notification.permission === 'granted') {
      new Notification('Zenith IA', {
        body: `Protocolo Ativo: ${routine.task}`,
        icon: '/zenith-logo.png'
      });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
    }
  };

  const addRoutine = async () => {
    if (!newTask) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('routines')
        .insert([{ 
          user_id: user.id, 
          task: newTask, 
          time: newTime, 
          category: newCategory,
          icon: newIcon,
          period: newPeriod,
          completed: false, 
          notified: false 
        }])
        .select()
        .single();
      
      if (data) {
        setRoutines(prev => [...prev, data].sort((a, b) => a.time.localeCompare(b.time)));
        setNewTask('');
        setIsAdding(false);
      }
    }
  };

  const toggleRoutine = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('routines')
      .update({ completed: !completed })
      .eq('id', id);
    
    if (!error) {
      setRoutines(prev => prev.map(r => r.id === id ? { ...r, completed: !completed } : r));
      if (!completed) addXP(25);
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
    <div className="space-y-10 pb-32 max-w-2xl mx-auto min-h-screen p-6">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold tracking-tighter uppercase text-white">
            Ciclo de <span className="text-zenith-scarlet">Performance</span>
          </h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Sincronizado com Zenith Core</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-zenith-scarlet transition-all group shadow-xl"
        >
          <Plus size={28} className="text-white/40 group-hover:text-zenith-scarlet transition-colors" />
        </motion.button>
      </header>

      {/* Progress Card */}
      <div className="glass-card p-8 border-white/5 bg-white/[0.02] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-zenith-scarlet/20" />
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Eficiência Diária</h3>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Sincronização de protocolos</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-bold text-white tracking-tighter">{completionRate}%</p>
          </div>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            className="h-full bg-zenith-scarlet shadow-[0_0_15px_rgba(255,38,33,0.5)]"
          />
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setActivePeriod('all')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${activePeriod === 'all' ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
        >
          Todos
        </button>
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id as any)}
            className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${activePeriod === p.id ? 'bg-zenith-scarlet text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            {p.icon}
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Routines List */}
      <div className="space-y-4">
        {filteredRoutines.map((r) => (
          <motion.div
            key={r.id}
            layout
            className={`group flex items-center space-x-6 p-6 rounded-[32px] transition-all border ${
              r.completed 
                ? 'bg-white/[0.01] border-white/5 opacity-40' 
                : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <button 
              onClick={() => toggleRoutine(r.id, r.completed)} 
              className="shrink-0 transition-all active:scale-90"
            >
              {r.completed ? (
                <div className="w-12 h-12 rounded-2xl bg-zenith-scarlet/20 flex items-center justify-center border border-zenith-scarlet/40 shadow-[0_0_15px_rgba(255,38,33,0.3)]">
                  <CheckCircle2 size={24} className="text-zenith-scarlet" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl border-2 border-white/10 group-hover:border-zenith-scarlet/50 transition-colors flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-zenith-scarlet/30" />
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-bold tracking-tight truncate transition-all ${r.completed ? 'text-white/20 line-through' : 'text-white'}`}>
                {r.task}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <div className="flex items-center space-x-2 text-[10px] text-zenith-scarlet font-mono bg-zenith-scarlet/10 px-3 py-1 rounded-xl border border-zenith-scarlet/10">
                  <Clock size={12} />
                  <span className="font-bold">{r.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                  {periods.find(p => p.id === r.period)?.icon}
                  <span>{periods.find(p => p.id === r.period)?.label}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => deleteRoutine(r.id)} 
              className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-500 transition-all p-3 rounded-xl hover:bg-red-500/10"
            >
              <Trash2 size={20} />
            </button>
          </motion.div>
        ))}
        {filteredRoutines.length === 0 && (
          <div className="text-center py-24 border border-dashed border-white/5 rounded-[40px] bg-white/[0.01] space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto opacity-10">
              <Clock size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Fluxo Temporal Vazio</p>
              <p className="text-[9px] text-white/10 uppercase tracking-widest">Agende sua primeira diretriz tática</p>
            </div>
          </div>
        )}
      </div>

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
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-white">Novo Protocolo</h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">Agende sua próxima diretriz</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[8px] text-white/30 font-bold uppercase tracking-widest ml-1">Tarefa</label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Ex: Meditação Alpha..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-zenith-scarlet transition-all placeholder:text-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-white/30 font-bold uppercase tracking-widest ml-1">Horário</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-zenith-scarlet transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] text-white/30 font-bold uppercase tracking-widest ml-1">Período</label>
                    <select
                      value={newPeriod}
                      onChange={(e) => setNewPeriod(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-zenith-scarlet transition-all appearance-none"
                    >
                      <option value="morning">Manhã</option>
                      <option value="afternoon">Tarde</option>
                      <option value="evening">Noite</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] text-white/30 font-bold uppercase tracking-widest ml-1">Categoria</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewCategory(cat.id)}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${newCategory === cat.id ? 'bg-zenith-scarlet border-zenith-scarlet text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={addRoutine}
                  className="w-full py-5 rounded-2xl bg-zenith-scarlet text-white text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,38,33,0.2)] hover:shadow-[0_0_40px_rgba(255,38,33,0.4)] transition-all"
                >
                  Agendar Protocolo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
