import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Clock, Activity, Brain, Dumbbell, Wind, TrendingUp, Zap
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
    { id: 'health', label: 'Saúde', icon: <Activity size={14} />, color: 'text-zenith-scarlet' },
    { id: 'mental', label: 'Mental', icon: <Wind size={14} />, color: 'text-emerald-400' },
    { id: 'finance', label: 'Financeiro', icon: <TrendingUp size={14} />, color: 'text-amber-400' },
  ];

  const priorities = [
    { id: 'low', label: 'Baixa', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'medium', label: 'Média', color: 'bg-amber-500/20 text-amber-400' },
    { id: 'high', label: 'Alta', color: 'bg-zenith-scarlet/20 text-zenith-scarlet' },
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
            className="absolute inset-0 bg-zenith-black/90 backdrop-blur-md"
          />
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-zenith-surface-1 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] border-t sm:border border-zenith-border-primary space-y-6 relative overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-zenith-border-primary rounded-full mx-auto mt-4 mb-2 opacity-20 flex-shrink-0" />
            
            <div className="px-8 flex justify-between items-center flex-shrink-0">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-bold text-zenith-text-primary tracking-tight uppercase italic">Novo <span className="text-zenith-scarlet">Protocolo</span></h3>
                <p className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em]">Configuração de Performance</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 rounded-2xl bg-zenith-surface-2 flex items-center justify-center text-zenith-text-tertiary hover:text-zenith-text-primary transition-all border border-zenith-border-secondary shadow-inner active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 pb-10 space-y-8 overflow-y-auto scrollbar-hide flex-1">
              <div className="space-y-3">
                <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Nome da Tarefa</label>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Ex: Meditação Alpha..."
                  className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-[2rem] px-6 py-5 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all placeholder:text-zenith-text-tertiary/30 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Horário</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zenith-text-tertiary pointer-events-none" />
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-2xl pl-12 pr-6 py-4 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Duração</label>
                  <div className="relative">
                    <Activity size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zenith-text-tertiary pointer-events-none" />
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-2xl pl-12 pr-6 py-4 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all appearance-none shadow-inner"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Prioridade</label>
                  <div className="flex gap-1.5 p-1.5 bg-zenith-surface-2 rounded-2xl border border-zenith-border-primary shadow-inner">
                    {priorities.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setNewPriority(p.id as any)}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-tighter transition-all ${newPriority === p.id ? p.color : 'text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Frequência</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all appearance-none shadow-inner"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Categoria</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${newCategory === cat.id ? 'bg-zenith-text-primary border-zenith-text-primary text-zenith-black shadow-lg shadow-zenith-text-primary/10' : 'bg-zenith-surface-2 border-zenith-border-primary text-zenith-text-tertiary hover:bg-zenith-surface-1 shadow-inner'}`}
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
                  label="Energia Esperada"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em] ml-1">Repetição Semanal</label>
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
                      className={`h-12 rounded-xl text-[10px] font-bold transition-all active:scale-90 border flex items-center justify-center ${selectedDays.includes(day.id) ? 'bg-zenith-scarlet border-zenith-scarlet text-white shadow-lg shadow-zenith-scarlet/20' : 'bg-zenith-surface-2 border-zenith-border-primary text-zenith-text-tertiary hover:bg-zenith-surface-1 shadow-inner'}`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving || !newTask}
                className="w-full py-6 rounded-[2rem] bg-zenith-text-primary text-zenith-black text-[11px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all active:scale-[0.98] shadow-2xl shadow-zenith-text-primary/10 mt-4 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Agendar Protocolo'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
