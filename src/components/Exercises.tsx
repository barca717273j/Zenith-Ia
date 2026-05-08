import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, Wind, Brain, Play, Clock, ChevronRight, 
  X, Activity, Lock, Sparkles, History, Heart, 
  Zap, Award, TrendingUp, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGamification } from './GamificationContext';
import { useUser } from '../contexts/UserContext';
import { TIER_LIMITS } from '../types';

interface Exercise {
  id: string;
  title: string;
  description: string;
  category: 'body' | 'mind' | 'spirituality' | 'health' | 'nutrition' | 'training' | 'yoga' | 'split';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  video_url: string;
  is_premium: boolean;
  xp_reward: number;
  tags?: string[];
}

interface ExerciseHistory {
  id: string;
  exercise_id: string;
  completed_at: string;
  user_id: string;
}

interface ExercisesProps {
  t: any;
  onBack?: () => void;
}

export const Exercises: React.FC<ExercisesProps> = ({ t, onBack }) => {
  const { user: authUser, userData } = useUser();
  const [activeTab, setActiveTab] = useState<'browse' | 'history'>('browse');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 'corrida',
      title: 'Corrida de Alta Intensidade',
      description: 'Protocolo de queima calórica e resistência cardiovascular.',
      category: 'training',
      duration: '30 min',
      difficulty: 'intermediate',
      video_url: 'https://www.youtube.com/watch?v=9L2b2khySLE',
      is_premium: false,
      xp_reward: 100
    },
    {
      id: 'academia',
      title: 'Musculação Hipertrófica',
      description: 'Foco em força bruta e densidade muscular.',
      category: 'training',
      duration: '60 min',
      difficulty: 'advanced',
      video_url: 'https://www.youtube.com/watch?v=U9ENCvFf9yQ',
      is_premium: false,
      xp_reward: 150
    },
    {
      id: 'alongamento',
      title: 'Alongamento Neural',
      description: 'Recuperação ativa e flexibilidade profunda.',
      category: 'body',
      duration: '15 min',
      difficulty: 'beginner',
      video_url: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
      is_premium: false,
      xp_reward: 50
    }
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addXP } = useGamification();
  const { checkLimit, incrementUsage } = useUser();

  const tier = userData?.subscription_tier || 'basic';
  const hasAccessToPremium = TIER_LIMITS[tier]?.hasPremiumExercises || false;

  useEffect(() => {
    fetchExercises();
    fetchHistory();
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      setExercises(data);
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    const { data: userDataAuth } = await supabase.auth.getUser();
    const user = userDataAuth?.user || authUser;
    if (!user) return;

    const { data, error } = await supabase
      .from('exercise_history')
      .select('*, exercises(*)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (data) setHistory(data);
  };

  const completeExercise = async (exercise: Exercise) => {
    const { data: userDataAuth } = await supabase.auth.getUser();
    const user = userDataAuth?.user || authUser;
    if (!user) return;

    const { error } = await supabase
      .from('exercise_history')
      .insert([{
        exercise_id: exercise.id,
        user_id: user.id,
        completed_at: new Date().toISOString()
      }]);

    if (!error) {
      addXP(exercise.xp_reward || 50);

      // Create Nexus post for achievement
      try {
        await supabase.from('posts').insert([{
          user_id: user.id,
          content: `Concluiu o protocolo: ${exercise.title}`,
          type: 'achievement',
          likes_count: 0,
          comments_count: 0
        }]);
      } catch (postErr) {
        console.error('Error creating achievement post:', postErr);
      }

      fetchHistory();
      setSelectedExercise(null);
    }
  };

  const categories = [
    { id: 'all', label: 'Todos', icon: <Activity size={18} /> },
    { id: 'training', label: 'Treino', icon: <Dumbbell size={18} /> },
    { id: 'body', label: 'Corpo', icon: <Heart size={18} /> },
    { id: 'mind', label: 'Mente', icon: <Brain size={18} /> },
    { id: 'spirituality', label: 'Espírito', icon: <Sparkles size={18} /> },
    { id: 'nutrition', label: 'Nutrição', icon: <Zap size={18} /> },
    { id: 'yoga', label: 'Yoga', icon: <Wind size={18} /> },
    { id: 'split', label: 'Divisões', icon: <TrendingUp size={18} /> },
  ];

  const filteredExercises = activeCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === activeCategory);

  return (
    <div className="flex flex-col gap-6 p-6 pb-56 max-w-2xl mx-auto min-h-screen">
      <header className="flex justify-between items-end">
        <div className="flex items-center space-x-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-12 h-12 flex items-center justify-center bg-zenit-surface-1 border border-zenit-border-primary rounded-2xl text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="space-y-2">
            <h2 className="text-4xl font-display font-medium tracking-tight uppercase text-zenit-text-primary italic leading-none">
              Bio <span className="text-zenit-scarlet">Hacking</span>
            </h2>
            <div className="flex items-center space-x-3">
               <div className="w-1.5 h-1.5 rounded-full bg-zenit-scarlet animate-pulse" />
               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zenit-text-tertiary opacity-60">Otimize seu hardware biológico</p>
            </div>
          </div>
        </div>
        <div className="flex bg-zenit-surface-1/40 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-zenit-border-primary">
          {(['browse', 'history'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                activeTab === tab 
                  ? 'text-white' 
                  : 'text-zenit-text-tertiary hover:text-zenit-text-secondary'
              }`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-zenit-scarlet rounded-xl -z-10 shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                />
              )}
              {tab === 'browse' ? 'Explorar' : 'Registros'}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'browse' ? (
          <motion.div
            key="browse"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-10"
          >
            {/* Categories - Premium Chip Interface */}
            <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center space-x-3 px-5 py-3 rounded-2xl border whitespace-nowrap transition-all duration-300 ${
                    activeCategory === cat.id 
                      ? 'bg-zenit-surface-1 text-zenit-scarlet border-zenit-scarlet/30 shadow-[0_10px_25px_rgba(0,0,0,0.2)]' 
                      : 'bg-zenit-surface-1/20 border-zenit-border-primary/50 text-zenit-text-tertiary hover:bg-zenit-surface-1'
                  }`}
                >
                  <span className={activeCategory === cat.id ? 'text-zenit-scarlet' : 'opacity-40'}>
                    {React.cloneElement(cat.icon as any, { size: 14 })}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Exercise Grid - Sleek List View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-2 border-zenit-scarlet border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-black animate-pulse">Syncing Protocols...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExercises.map(ex => {
                  const isLocked = ex.is_premium && !hasAccessToPremium;
                  const isCompletedToday = history.some(h => 
                    h.exercise_id === ex.id && 
                    new Date(h.completed_at).toDateString() === new Date().toDateString()
                  );

                  return (
                    <motion.div
                      key={ex.id}
                      layoutId={`ex-${ex.id}`}
                      onClick={() => !isLocked && setSelectedExercise(ex)}
                      className={`glass-card p-5 rounded-[2rem] flex items-center transition-all duration-500 border border-zenit-border-primary/50 relative overflow-hidden group ${
                        isLocked ? 'opacity-40 grayscale pointer-events-none' : 'bg-zenit-surface-1/60 active:scale-[0.98]'
                      } ${isCompletedToday ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
                    >
                      {isCompletedToday && (
                        <div className="absolute top-0 right-0 p-2 bg-emerald-500/10 rounded-bl-[1.5rem] border-l border-b border-emerald-500/20">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-5 flex-1 relative z-10 min-w-0">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border border-zenit-border-primary ${
                          isCompletedToday ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zenit-surface-2 text-zenit-text-tertiary group-hover:text-zenit-scarlet'
                        }`}>
                          {ex.category === 'training' ? <Dumbbell size={24} /> : React.cloneElement((categories.find(c => c.id === ex.category)?.icon || <Activity />) as any, { size: 24 })}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                             <h3 className={`text-base font-bold tracking-tight truncate transition-colors ${
                               isCompletedToday ? 'text-emerald-500' : 'text-zenit-text-primary group-hover:text-zenit-scarlet'
                             }`}>
                               {ex.title}
                             </h3>
                             {ex.is_premium && !isLocked && !isCompletedToday && (
                                <Sparkles size={12} className="text-yellow-500 flex-shrink-0" />
                             )}
                          </div>

                          <div className="flex items-center space-x-3 text-[9px] font-black uppercase tracking-widest text-zenit-text-tertiary opacity-60">
                             <div className="flex items-center gap-1.5">
                               <Clock size={10} className={isCompletedToday ? 'text-emerald-500' : 'text-zenit-scarlet'} />
                               <span>{ex.duration}</span>
                             </div>
                             <span className="w-1 h-1 bg-zenit-border-primary rounded-full" />
                             <div className="flex items-center gap-1.5">
                               <Award size={10} className={isCompletedToday ? 'text-emerald-500' : 'text-zenit-scarlet'} />
                               <span>{ex.difficulty}</span>
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col items-end space-y-3">
                         <div className={`text-[10px] font-black font-mono px-3 py-1 rounded-full border ${
                           isCompletedToday 
                             ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' 
                             : 'text-zenit-scarlet bg-zenit-scarlet/5 border-zenit-scarlet/10'
                         }`}>
                           {isCompletedToday ? 'CONCLUÍDO' : `+${ex.xp_reward || 100} XP`}
                         </div>
                         <ChevronRight size={16} className={`transition-all ${
                           isCompletedToday ? 'text-emerald-500' : 'text-zenit-text-tertiary group-hover:text-zenit-scarlet group-hover:translate-x-1'
                         }`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} className="glass-card p-5 rounded-[2rem] border border-zenit-border-primary/50 bg-zenit-surface-1/40 flex items-center justify-between group">
                <div className="flex items-center space-x-5">
                  <div className="w-12 h-12 rounded-xl bg-zenit-surface-2 flex items-center justify-center text-zenit-scarlet border border-zenit-border-primary">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zenit-text-primary tracking-tight">{item.exercises?.title || 'Protocolo Concluído'}</h4>
                    <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-black opacity-40">
                      {new Date(item.completed_at).toLocaleDateString()} • {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black font-mono text-zenit-scarlet bg-zenit-scarlet/5 px-3 py-1 rounded-full border border-zenit-scarlet/10">
                    +{item.exercises?.xp_reward || 50} XP
                  </span>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center space-y-6 opacity-30 italic">
                <History size={48} className="mx-auto text-zenit-text-tertiary" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zenit-text-tertiary">Aguardando Execução...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Detail Modal (Bottom Sheet) */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-zenit-surface-1 w-full max-w-lg rounded-t-[2.5rem] border-t border-zenit-border-primary flex flex-col max-h-[95vh] shadow-2xl z-10 overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-zenit-border-primary rounded-full mx-auto my-3 opacity-50" />
              
              <div className="relative aspect-video bg-black">
                <iframe 
                  src={selectedExercise.video_url.replace('watch?v=', 'embed/')} 
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-zenit-border-primary flex items-center justify-center text-white z-10 hover:bg-zenit-accent transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-zenit-accent">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em]">{selectedExercise.category}</span>
                  </div>
                  <h3 className="text-3xl font-display font-bold text-zenit-text-primary tracking-tighter uppercase leading-none">{selectedExercise.title}</h3>
                  <div className="flex items-center space-x-6 pt-2">
                    <div className="flex items-center space-x-2 text-zenit-text-secondary">
                      <Clock size={16} className="text-zenit-accent" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{selectedExercise.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-zenit-text-secondary">
                      <Award size={16} className="text-zenit-accent" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{selectedExercise.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-zenit-accent">
                      <Zap size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">+{selectedExercise.xp_reward || 50} XP</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.4em]">Protocolo de Execução</h4>
                  <p className="text-sm text-zenit-text-secondary leading-relaxed font-light">{selectedExercise.description}</p>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button 
                    onClick={() => completeExercise(selectedExercise)}
                    className="flex-1 bg-zenit-accent text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(255,38,33,0.3)] hover:shadow-[0_0_50px_rgba(255,38,33,0.5)] transition-all flex items-center justify-center space-x-3"
                  >
                    <CheckCircle2 size={16} />
                    <span>Concluir Treino</span>
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
