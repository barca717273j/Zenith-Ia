import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Bell, CheckCircle2, Circle, Plus, Trash2, Calendar, Sparkles, Zap, AlertCircle, Target, Brain, Dumbbell, Wind, Activity } from 'lucide-react';
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
}

export const RoutineSystem: React.FC<{ t: any }> = ({ t }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newCategory, setNewCategory] = useState('focus');
  const [newIcon, setNewIcon] = useState('Zap');
  const { addXP } = useGamification();

  const categories = [
    { id: 'focus', label: 'Foco', icon: 'Brain' },
    { id: 'body', label: 'Corpo', icon: 'Dumbbell' },
    { id: 'mind', label: 'Mente', icon: 'Wind' },
    { id: 'work', label: 'Trabalho', icon: 'Briefcase' },
  ];

  const icons = ['Zap', 'Brain', 'Dumbbell', 'Wind', 'Briefcase', 'Coffee', 'Book', 'Moon'];

  useEffect(() => {
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

  const triggerAlarm = (routine: Routine) => {
    if (Notification.permission === 'granted') {
      new Notification('Zenith Alerta', {
        body: `Hora da rotina: ${routine.task}`,
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
      if (!completed) addXP(20);
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-zenith-electric-blue rounded-full animate-pulse" />
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-white/90">
              Ciclo de Performance
            </h3>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Sincronizado com Zenith Core</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAdding(!isAdding)}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-zenith-electric-blue transition-all group"
        >
          <Plus size={24} className="text-white/40 group-hover:text-zenith-electric-blue transition-colors" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="glass-card p-8 space-y-8 border-zenith-electric-blue/30 bg-zenith-electric-blue/[0.02] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zenith-electric-blue to-transparent opacity-50" />
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 ml-1">
                  <Zap size={12} className="text-zenith-electric-blue" />
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Objetivo Tático</label>
                </div>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Ex: Meditação Alpha..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-zenith-electric-blue transition-all placeholder:text-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Clock size={12} className="text-zenith-cyan" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Janela Temporal</label>
                  </div>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-zenith-electric-blue transition-all text-white/60"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Target size={12} className="text-zenith-electric-blue" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Categoria</label>
                  </div>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-zenith-electric-blue transition-all text-white/60 appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={addRoutine}
              className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            >
              Agendar Protocolo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {routines.map((r) => (
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
                <div className="w-10 h-10 rounded-2xl bg-zenith-electric-blue/20 flex items-center justify-center border border-zenith-electric-blue/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <CheckCircle2 size={24} className="text-zenith-electric-blue" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl border-2 border-white/10 group-hover:border-zenith-electric-blue/50 transition-colors flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-zenith-electric-blue/30" />
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-bold tracking-tight truncate transition-all ${r.completed ? 'text-white/20 line-through' : 'text-white'}`}>
                {r.task}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <div className="flex items-center space-x-2 text-[10px] text-zenith-cyan font-mono bg-zenith-cyan/10 px-3 py-1 rounded-xl border border-zenith-cyan/10">
                  <Clock size={12} />
                  <span className="font-bold">{r.time}</span>
                </div>
                {!r.completed && (
                  <div className="flex items-center space-x-2 text-[10px] text-zenith-electric-blue font-mono bg-zenith-electric-blue/10 px-3 py-1 rounded-xl border border-zenith-electric-blue/10">
                    <Sparkles size={12} />
                    <span className="font-bold">+20 XP</span>
                  </div>
                )}
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
        {routines.length === 0 && !isAdding && (
          <div className="text-center py-20 border border-dashed border-white/5 rounded-[40px] bg-white/[0.01] space-y-4">
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
    </div>
  );
};
