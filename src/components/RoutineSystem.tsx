import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Bell, CheckCircle2, Circle, Plus, Trash2, 
  Calendar, Sparkles, Zap, AlertCircle, Target, 
  Brain, Dumbbell, Wind, Activity, Sun, Moon, 
  Coffee, TrendingUp, ChevronRight, X, Loader2, Check
} from 'lucide-react';
import { supabase } from '../supabase';
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
  const [newAlarmSound, setNewAlarmSound] = useState('zenith-classic');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [activePeriod, setActivePeriod] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const { addXP } = useGamification();

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

  const alarmSounds = [
    { id: 'zenith-classic', label: 'Zenith Classic', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
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
      new Notification('Zenith Life OS', {
        body: `Protocolo Ativo: ${routine.title}`,
        icon: '/zenith-logo.png',
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
    const { data } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userData.id)
      .order('time', { ascending: true });
    if (data && Array.isArray(data)) setRoutines(data);
  };

  const generateAiRoutine = async (customPrompt?: string) => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;

    // Check limits
    const limitCheck = await checkLimit('ai_generations');
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
    }

    setIsAiGenerating(true);
    try {
      // Fetch user context for better personalization
      const [habitsRes, tasksRes, goalsRes] = await Promise.all([
        supabase.from('habits').select('title, category, streak').eq('user_id', userData.id),
        supabase.from('tasks').select('title, completed').eq('user_id', userData.id),
        supabase.from('finance_goals').select('name, target, current').eq('user_id', userData.id)
      ]);

      const habitsContext = habitsRes.data?.map(h => `- ${h.title} (${h.category}, streak: ${h.streak})`).join('\n') || 'Nenhum hábito registrado';
      const tasksContext = tasksRes.data?.filter(t => !t.completed).map(t => `- ${t.title}`).join('\n') || 'Nenhuma tarefa pendente';
      const goalsContext = goalsRes.data?.map(g => `- ${g.name} (Meta: ${g.target}, Atual: ${g.current})`).join('\n') || 'Nenhum objetivo financeiro registrado';
      const lifeGoals = userData?.identity || 'Não especificado';

      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();
      if (!apiKey) throw new Error('GEMINI_API_KEY not found');
      
      const genAI = new GoogleGenAI({ apiKey });
      
      const prompt = `Você é o Arquiteto de Performance Zenith, um especialista em biohacking, neurociência e produtividade de elite.
      Sua missão é projetar um PROTOCOLO DE ROTINA NEURAL otimizado para o usuário.
      
      CONTEXTO BIOMÉTRICO E DE DADOS:
      - Identidade de Performance: ${lifeGoals}
      - Hábitos em Construção: ${habitsContext}
      - Pendências Críticas: ${tasksContext}
      - Alvos Financeiros: ${goalsContext}
      - Solicitação Específica: "${promptToUse}"
      
      DIRETRIZES DE ENGENHARIA DE ROTINA:
      1. SINCRONIZAÇÃO CIRCADIANA: Aloque tarefas exigentes (Deep Work) nos picos de energia.
      2. BLOCOS DE PERFORMANCE: Use a técnica de Time Blocking para evitar fadiga de decisão.
      3. INTEGRAÇÃO DE HÁBITOS: Use o empilhamento de hábitos (Habit Stacking).
      4. CATEGORIAS: focus (trabalho/estudo), body (exercício/saúde), mind (meditação/descanso), work (tarefas gerais).
      5. PERÍODOS: morning, afternoon, evening.
      
      Gere uma rotina estruturada em JSON obedecendo este formato rigoroso:
      {
        "tasks": [
          { 
            "time": "HH:mm", 
            "title": "Nome Impactante da Tarefa", 
            "description": "Breve instrução tática",
            "category": "focus|body|mind|work", 
            "period": "morning|afternoon|evening" 
          }
        ]
      }
      
      Retorne APENAS o JSON. Seja sofisticado nos nomes das tarefas (ex: 'Sessão de Deep Work Alpha' em vez de 'Trabalhar').`;
      
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      const text = response.text || '';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const routineData = JSON.parse(cleanJson);
      
      const tasksToInsert = routineData.tasks.map((t: any) => ({
        user_id: userData.id,
        time: t.time,
        title: t.title,
        category: t.category,
        period: t.period,
        completed: false,
        notified: false,
        alarm_sound: 'zenith-classic',
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        icon: t.category === 'body' ? 'Dumbbell' : t.category === 'mind' ? 'Wind' : 'Zap'
      }));
      
      const { error: tasksError } = await supabase
        .from('routines')
        .insert(tasksToInsert);
        
      if (tasksError) throw tasksError;
      
      // Increment usage
      await incrementUsage('ai_generations');

      setAiPrompt('');
      fetchRoutines();
      alert('Rotina gerada com sucesso pela IA! 🚀');
    } catch (err: any) {
      console.error('AI Routine Error:', err);
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
    <div className="flex flex-col gap-4 p-4 pb-32 max-w-2xl mx-auto min-h-screen bg-zenith-black">
      <header className="flex justify-between items-end mb-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-zenith-text-primary">
            Ciclo de <span className="text-zenith-scarlet">Performance</span>
          </h2>
          <p className="text-zenith-text-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">Sincronização de Protocolos</p>
        </div>
        <div className="flex items-center space-x-3">
          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationPermission}
              className="p-2.5 rounded-xl bg-zenith-surface-1 border border-zenith-border-primary text-zenith-text-tertiary hover:text-zenith-text-primary transition-all hover:bg-zenith-surface-2"
            >
              <Bell size={18} />
            </button>
          )}
          <button 
            onClick={() => setIsAdding(true)}
            className="w-12 h-12 rounded-2xl bg-zenith-scarlet text-white flex items-center justify-center hover:bg-zenith-crimson transition-all shadow-lg shadow-zenith-scarlet/20 active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      {/* AI Assistant Section */}
      <section className="p-8 rounded-[32px] border border-zenith-border-secondary bg-gradient-to-br from-zenith-surface-1 to-transparent relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles className="text-zenith-text-primary" size={48} />
        </div>
        <div className="space-y-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-zenith-scarlet/10 flex items-center justify-center">
              <Zap size={18} className="text-zenith-scarlet" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zenith-text-secondary">Arquiteto de Rotina</h2>
              <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-widest font-bold">Inteligência Artificial Zenith</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <textarea
              placeholder="Ex: Crie uma rotina focada em hipertrofia e estudos profundos..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-zenith-surface-1/50 border border-zenith-border-primary rounded-3xl p-6 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/30 transition-all min-h-[120px] resize-none placeholder:text-zenith-text-tertiary leading-relaxed"
            />
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  const prompt = "Sugira uma rotina otimizada com base nos meus hábitos e objetivos atuais para um dia de alta performance.";
                  setAiPrompt(prompt);
                  generateAiRoutine(prompt);
                }}
                disabled={isAiGenerating}
                className="w-full sm:flex-1 bg-zenith-surface-2 border border-zenith-border-primary text-zenith-text-secondary px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-zenith-surface-1 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Brain size={14} />
                <span>Otimizar Perfil</span>
              </button>
              <button
                onClick={() => generateAiRoutine()}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="w-full sm:w-auto bg-zenith-text-primary text-zenith-black px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center space-x-2 hover:opacity-90 active:scale-95 shadow-xl shadow-zenith-border-primary/5"
              >
                {isAiGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Gerar Protocolo</span>
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Card */}
      <div className="p-8 rounded-[32px] border border-zenith-border-secondary bg-zenith-surface-1 flex items-center justify-between group hover:bg-zenith-surface-2 transition-colors">
        <div className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-zenith-text-tertiary">Eficiência Diária</h3>
          <div className="flex items-center space-x-4">
            <p className="text-3xl font-bold text-zenith-text-primary tracking-tighter">{completionRate}%</p>
            <div className="w-32 h-2 bg-zenith-surface-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                className="h-full bg-zenith-scarlet shadow-[0_0_10px_rgba(255,36,0,0.5)]"
              />
            </div>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-zenith-surface-2 flex items-center justify-center group-hover:bg-zenith-surface-1 transition-colors">
          <Target size={24} className="text-zenith-text-tertiary group-hover:text-zenith-text-secondary transition-colors" />
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setActivePeriod('all')}
          className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold rounded-2xl border transition-all whitespace-nowrap active:scale-95 ${activePeriod === 'all' ? 'bg-zenith-text-primary text-zenith-black border-zenith-text-primary' : 'bg-zenith-surface-1 border-zenith-border-primary text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
        >
          Todos
        </button>
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id as any)}
            className={`px-6 py-3 text-[10px] uppercase tracking-widest font-bold rounded-2xl border transition-all whitespace-nowrap flex items-center space-x-2 active:scale-95 ${activePeriod === p.id ? 'bg-zenith-text-primary text-zenith-black border-zenith-text-primary' : 'bg-zenith-surface-1 border-zenith-border-primary text-zenith-text-tertiary hover:text-zenith-text-secondary'}`}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Timeline View */}
      <div className="relative space-y-10 pl-8">
        <div className="absolute left-[39px] top-8 bottom-8 w-px bg-gradient-to-b from-zenith-scarlet/30 via-zenith-border-primary to-transparent" />
        
        {filteredRoutines.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-20">
            <div className="w-16 h-16 rounded-3xl bg-zenith-surface-1 border border-zenith-border-primary flex items-center justify-center mx-auto">
              <Zap size={32} className="text-zenith-text-primary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zenith-text-primary">Nenhum Protocolo Ativo</p>
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
              <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${r.completed ? 'bg-zenith-scarlet border-zenith-scarlet shadow-[0_0_25px_rgba(255,26,26,0.5)] scale-110' : 'bg-zenith-black border-zenith-border-primary group-hover:border-zenith-scarlet/50 group-hover:scale-110'}`}>
                {r.completed && <Check size={12} className="text-white" />}
              </div>
              <p className={`text-[10px] font-black font-mono tracking-tighter transition-colors duration-500 ${r.completed ? 'text-zenith-scarlet/40' : 'text-zenith-text-tertiary group-hover:text-zenith-text-primary'}`}>{r.time}</p>
            </div>

            {/* Task Card */}
            <div className={`flex-1 p-8 rounded-[40px] border transition-all duration-500 relative overflow-hidden group/card ${r.completed ? 'bg-zenith-surface-1/50 border-zenith-border-secondary opacity-40 grayscale' : 'bg-gradient-to-br from-zenith-surface-1 to-transparent border-zenith-border-primary hover:border-zenith-scarlet/30 hover:bg-zenith-surface-2 shadow-2xl'}`}>
              {/* Glow Effect */}
              {!r.completed && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-zenith-scarlet/5 blur-[60px] rounded-full group-hover/card:bg-zenith-scarlet/10 transition-all duration-700" />
              )}
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className={`text-xl font-display font-bold tracking-tight leading-tight ${r.completed ? 'text-zenith-text-primary/20 line-through italic' : 'text-zenith-text-primary'}`}>
                      {r.title}
                    </p>
                    {r.description && (
                      <p className="text-[11px] text-zenith-text-tertiary font-medium leading-relaxed max-w-[240px]">{r.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all ${r.completed ? 'bg-zenith-surface-1 border-zenith-border-secondary' : 'bg-zenith-surface-1 border-zenith-border-primary group-hover/card:border-zenith-scarlet/20'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${categories.find(c => c.id === r.category)?.color}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${categories.find(c => c.id === r.category)?.color}`}>
                        {categories.find(c => c.id === r.category)?.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-[9px] text-zenith-text-tertiary font-black uppercase tracking-widest">
                      <span className="w-1 h-1 bg-zenith-border-primary rounded-full" />
                      <span className="flex items-center space-x-1.5">
                        {periods.find(p => p.id === r.period)?.icon}
                        <span>{periods.find(p => p.id === r.period)?.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-3">
                  <button 
                    onClick={() => toggleRoutine(r.id, r.completed)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${r.completed ? 'bg-zenith-scarlet border-zenith-scarlet text-white shadow-lg shadow-zenith-scarlet/20' : 'bg-zenith-surface-1 border-zenith-border-primary text-zenith-text-tertiary hover:text-zenith-text-primary hover:bg-zenith-surface-2 hover:border-zenith-border-secondary'}`}
                  >
                    <CheckCircle2 size={24} strokeWidth={r.completed ? 2.5 : 2} />
                  </button>
                  <button 
                    onClick={() => deleteRoutine(r.id)}
                    className="w-10 h-10 rounded-xl bg-zenith-surface-1 flex items-center justify-center text-zenith-text-tertiary/20 hover:text-zenith-scarlet hover:bg-zenith-scarlet/5 transition-all opacity-0 group-hover/card:opacity-100"
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
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-zenith-surface-1 p-6 w-full max-w-lg rounded-t-[2.5rem] border-t border-zenith-border-primary space-y-6 relative overflow-hidden shadow-2xl z-10"
            >
              <div className="w-12 h-1.5 bg-zenith-border-primary rounded-full mx-auto mb-2 opacity-50" />
              
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-display font-bold text-zenith-text-primary tracking-tight uppercase italic">Novo <span className="text-zenith-scarlet">Protocolo</span></h3>
                  <p className="text-[9px] text-zenith-text-tertiary font-bold uppercase tracking-widest">Configuração de Performance</p>
                </div>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="w-10 h-10 rounded-xl bg-zenith-surface-2 flex items-center justify-center text-zenith-text-tertiary hover:text-zenith-text-primary transition-all border border-zenith-border-secondary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Nome da Tarefa</label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Ex: Meditação Alpha..."
                    className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-2xl px-5 py-3 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all placeholder:text-zenith-text-tertiary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Horário</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-xl px-4 py-3 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Duração</label>
                    <select
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-xl px-4 py-3 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all appearance-none"
                    >
                      <option value="15min">15 min</option>
                      <option value="30min">30 min</option>
                      <option value="45min">45 min</option>
                      <option value="1h">1 hora</option>
                      <option value="2h">2 horas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Prioridade</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {priorities.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setNewPriority(p.id as any)}
                          className={`py-2.5 rounded-lg text-[8px] font-bold uppercase tracking-tighter transition-all border ${newPriority === p.id ? p.color + ' border-current' : 'bg-zenith-surface-2 border-zenith-border-primary text-zenith-text-tertiary'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Frequência</label>
                    <select
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value as any)}
                      className="w-full bg-zenith-surface-2 border border-zenith-border-primary rounded-xl px-4 py-3 text-sm text-zenith-text-primary focus:outline-none focus:border-zenith-scarlet/50 transition-all appearance-none"
                    >
                      <option value="daily">Diária</option>
                      <option value="weekly">Semanal</option>
                      <option value="custom">Personalizada</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Categoria</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${newCategory === cat.id ? 'bg-zenith-text-primary border-zenith-text-primary text-zenith-black shadow-lg shadow-zenith-text-primary/10' : 'bg-zenith-surface-2 border-zenith-border-primary text-zenith-text-tertiary hover:bg-zenith-surface-1'}`}
                      >
                        <div className="scale-90">{cat.icon}</div>
                        <span className="text-[8px] mt-1.5 font-bold uppercase tracking-tighter">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Energia Esperada</label>
                    <span className="text-[10px] font-bold text-zenith-scarlet">{newEnergy}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newEnergy}
                    onChange={(e) => setNewEnergy(parseInt(e.target.value))}
                    className="w-full accent-zenith-scarlet bg-zenith-surface-2 rounded-full h-1 appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenith-text-tertiary font-bold uppercase tracking-widest ml-1">Repetição</label>
                  <div className="flex justify-between gap-2">
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
                        className={`flex-1 h-12 rounded-xl text-[11px] font-bold transition-all active:scale-90 ${selectedDays.includes(day.id) ? 'bg-zenith-scarlet text-white shadow-lg shadow-zenith-scarlet/20' : 'bg-zenith-surface-2 text-zenith-text-tertiary hover:bg-zenith-surface-1'}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={addRoutine}
                className="w-full py-5 rounded-2xl bg-zenith-text-primary text-zenith-black text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-zenith-text-primary/5 mt-4"
              >
                Agendar Protocolo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
