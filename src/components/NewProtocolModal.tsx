import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Clock, Activity, Brain, Dumbbell, Wind, TrendingUp, Zap, Sparkles
} from 'lucide-react';
import { CustomSlider } from './CustomSlider';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import { useGamification } from './GamificationContext';

interface NewProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

export const NewProtocolModal: React.FC<NewProtocolModalProps> = ({ isOpen, onClose, t }) => {
  const { userData, checkLimit, incrementUsage } = useUser();
  const { addXP } = useGamification();
  
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDuration, setNewDuration] = useState('30min');
  const [newCategory, setNewCategory] = useState('focus');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [newEnergy, setNewEnergy] = useState(50);
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    { id: 'focus', label: 'Foco', icon: <Brain size={14} />, color: 'text-blue-400' },
    { id: 'health', label: 'Saúde', icon: <Activity size={14} />, color: 'text-zenit-accent' },
    { id: 'mental', label: 'Mental', icon: <Wind size={14} />, color: 'text-emerald-400' },
    { id: 'finance', label: 'Financeiro', icon: <TrendingUp size={14} />, color: 'text-amber-400' },
  ];

  const priorities = [
    { id: 'low', label: 'Baixa', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'medium', label: 'Média', color: 'bg-amber-500/20 text-amber-400' },
    { id: 'high', label: 'Alta', color: 'bg-zenit-accent/20 text-zenit-accent' },
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

  const handleSave = async () => {
    if (!newTask || !userData?.id) return;

    setIsSaving(true);
    try {
      const limitCheck = await checkLimit('routines');
      if (!limitCheck.allowed) {
        alert(limitCheck.message);
        return;
      }

      const xpReward = newPriority === 'high' ? 100 : newPriority === 'medium' ? 50 : 25;
      const period = parseInt(newTime.split(':')[0]) < 12 ? 'morning' : parseInt(newTime.split(':')[0]) < 18 ? 'afternoon' : 'evening';

      const { error } = await supabase
        .from('routines')
        .insert([{ 
          user_id: userData.id, 
          title: newTask, 
          description: '',
          time: newTime, 
          duration: newDuration,
          category: newCategory,
          icon: newCategory === 'health' ? 'Activity' : newCategory === 'mental' ? 'Wind' : newCategory === 'finance' ? 'TrendingUp' : 'Brain',
          period: period,
          priority: newPriority,
          frequency: newFrequency,
          energy_level_expected: newEnergy,
          xp_reward: xpReward,
          days: selectedDays,
          completed: false, 
          notified: false 
        }]);
      
      if (error) throw error;

      await incrementUsage('actions');
      onClose();
      // Reset form
      setNewTask('');
    } catch (err: any) {
      console.error('Error saving routine:', err);
      alert('Erro ao salvar protocolo: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zenit-black/90 backdrop-blur-md"
          />
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-zenit-surface-1 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] border-t sm:border border-zenit-border-primary space-y-6 relative overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-zenit-border-primary rounded-full mx-auto mt-4 mb-2 opacity-20 flex-shrink-0" />
            
            <div className="px-8 flex justify-between items-center flex-shrink-0 pt-4">
              <div className="space-y-1">
                <h3 className="text-3xl font-display font-bold text-zenit-text-primary tracking-tighter uppercase italic leading-none">Novo <span className="text-zenit-accent">Protocolo</span></h3>
                <p className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] mt-1">Configuração de Performance</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 rounded-2xl bg-zenit-surface-2 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all border border-white/5 shadow-xl active:scale-90 group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="px-8 pb-10 space-y-8 overflow-y-auto scrollbar-hide flex-1 relative">
              {/* Background Glow */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-zenit-accent/5 rounded-full blur-[80px] pointer-events-none" />

              <div className="space-y-3 relative z-10">
                <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] ml-4">Nome da Tarefa</label>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Ex: Meditação Alpha..."
                  className="w-full bg-zenit-surface-2 border border-white/5 rounded-full px-8 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/30 focus:ring-1 focus:ring-zenit-accent/30 transition-all placeholder:text-zenit-text-tertiary/20 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] ml-4">Horário</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zenit-accent pointer-events-none" />
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-zenit-surface-2 border border-white/5 rounded-full pl-14 pr-8 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/30 focus:ring-1 focus:ring-zenit-accent/30 transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] ml-4">Duração</label>
                  <div className="relative">
                    <Zap size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zenit-accent pointer-events-none" />
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-zenit-surface-2 border border-white/5 rounded-full pl-14 pr-8 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/30 focus:ring-1 focus:ring-zenit-accent/30 transition-all appearance-none shadow-inner cursor-pointer"
                    >
                      <option value="15min">15 min</option>
                      <option value="30min">30 min</option>
                      <option value="45min">45 min</option>
                      <option value="1h">1 hora</option>
                      <option value="2h">2 horas</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] ml-4">Prioridade</label>
                  <div className="flex gap-1.5 p-1.5 bg-zenit-surface-2 rounded-full border border-white/5 shadow-inner">
                    {priorities.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setNewPriority(p.id as any)}
                        className={`flex-1 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${newPriority === p.id ? p.color.replace('zenit', 'zenit') : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] ml-4">Frequência</label>
                  <div className="relative">
                    <select
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value as any)}
                      className="w-full bg-zenit-surface-2 border border-white/5 rounded-full px-8 py-5 text-sm text-zenit-text-primary focus:outline-none focus:border-zenit-accent/30 focus:ring-1 focus:ring-zenit-accent/30 transition-all appearance-none shadow-inner cursor-pointer"
                    >
                      <option value="daily">Diária</option>
                      <option value="weekly">Semanal</option>
                      <option value="custom">Personalizada</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                      <TrendingUp size={14} className="text-zenit-text-tertiary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between px-4">
                  <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em]">Categoria</label>
                  <Sparkles size={12} className="text-zenit-accent animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all active:scale-95 group ${newCategory === cat.id ? 'bg-zenit-accent border-zenit-accent text-white shadow-[0_0_20px_var(--accent-glow)]' : 'bg-zenit-surface-2 border-white/5 text-zenit-text-tertiary hover:bg-white/5 shadow-inner'}`}
                    >
                      <div className={`transition-transform duration-300 ${newCategory === cat.id ? 'scale-125' : 'group-hover:scale-110'}`}>{cat.icon}</div>
                      <span className="text-[9px] mt-3 font-bold uppercase tracking-widest">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 relative z-10 px-2">
                <CustomSlider
                  min={0}
                  max={100}
                  value={newEnergy}
                  onChange={setNewEnergy}
                  label="Energia Esperada"
                />
              </div>

              <div className="space-y-4 relative z-10">
                <label className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em] ml-4">Repetição Semanal</label>
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
                      className={`h-12 rounded-2xl text-[10px] font-bold transition-all active:scale-90 border flex items-center justify-center ${selectedDays.includes(day.id) ? 'bg-zenit-accent border-zenit-accent text-white shadow-[0_0_15px_var(--accent-glow)]' : 'bg-zenit-surface-2 border-white/5 text-zenit-text-tertiary hover:bg-white/5 shadow-inner'}`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving || !newTask}
                className="w-full py-6 rounded-full bg-gradient-to-r from-zenit-accent to-zenit-crimson text-white text-[12px] font-bold uppercase tracking-[0.5em] hover:brightness-110 transition-all active:scale-[0.98] shadow-[0_0_30px_var(--accent-glow)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processando...</span>
                  </div>
                ) : 'Agendar Protocolo'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
