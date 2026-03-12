import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, Wind, Brain, Play, Clock, ChevronRight, 
  X, Activity, Lock, Sparkles, History, Heart, 
  Zap, Award, TrendingUp, CheckCircle2
} from 'lucide-react';
import { supabase } from '../supabase';
import { useGamification } from './GamificationContext';

interface Exercise {
  id: string;
  title: string;
  description: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'meditation';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  video_url: string;
  is_premium: boolean;
  xp_reward: number;
}

interface ExerciseHistory {
  id: string;
  exercise_id: string;
  completed_at: string;
  user_id: string;
}

interface ExercisesProps {
  t: any;
  userData: any;
}

export const Exercises: React.FC<ExercisesProps> = ({ t, userData }) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'history'>('browse');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addXP } = useGamification();

  const tier = userData?.subscription_tier || 'basic';
  const hasAccessToPremium = ['pro', 'elite', 'master'].includes(tier);

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
    
    if (!error) setExercises(data || []);
    setLoading(false);
  };

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('exercise_history')
      .select('*, exercises(*)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (data) setHistory(data);
  };

  const completeExercise = async (exercise: Exercise) => {
    const { data: { user } } = await supabase.auth.getUser();
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
      fetchHistory();
      setSelectedExercise(null);
    }
  };

  const categories = [
    { id: 'all', label: 'Todos', icon: <Activity size={18} /> },
    { id: 'strength', label: 'Força', icon: <Dumbbell size={18} /> },
    { id: 'cardio', label: 'Cardio', icon: <Heart size={18} /> },
    { id: 'hiit', label: 'HIIT', icon: <Zap size={18} /> },
    { id: 'flexibility', label: 'Flexibilidade', icon: <Wind size={18} /> },
    { id: 'meditation', label: 'Meditação', icon: <Brain size={18} /> },
  ];

  const filteredExercises = activeCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === activeCategory);

  return (
    <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold tracking-tighter uppercase text-white">
            Bio <span className="text-zenith-scarlet">Hacking</span>
          </h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Otimize seu hardware biológico</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'browse' ? 'bg-zenith-scarlet text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Explorar
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-zenith-scarlet text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Histórico
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'browse' ? (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Categories */}
            <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-2xl border whitespace-nowrap transition-all ${
                    activeCategory === cat.id 
                      ? 'bg-zenith-scarlet text-white border-zenith-scarlet shadow-[0_0_20px_rgba(255,38,33,0.3)]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {cat.icon}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Exercise Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-zenith-scarlet border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredExercises.map(ex => {
                  const isLocked = ex.is_premium && !hasAccessToPremium;
                  return (
                    <motion.div
                      key={ex.id}
                      layoutId={`ex-${ex.id}`}
                      onClick={() => !isLocked && setSelectedExercise(ex)}
                      className={`glass-card group cursor-pointer overflow-hidden border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all relative ${isLocked ? 'opacity-60 grayscale' : ''}`}
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={`https://picsum.photos/seed/${ex.id}/800/450`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <div className="bg-zenith-scarlet/20 border border-zenith-scarlet/40 p-4 rounded-3xl text-zenith-scarlet">
                              <Lock size={32} />
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-zenith-scarlet">
                              <span className="text-[9px] font-bold uppercase tracking-[0.3em]">{ex.category}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight leading-tight">{ex.title}</h3>
                          </div>
                          {!isLocked && (
                            <div className="bg-zenith-scarlet p-3 rounded-2xl shadow-lg">
                              <Play size={20} className="text-white" fill="currentColor" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-6 flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2 text-white/40">
                            <Clock size={14} className="text-zenith-scarlet" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{ex.duration}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-white/40">
                            <Award size={14} className="text-zenith-scarlet" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{ex.difficulty}</span>
                          </div>
                        </div>
                        {isLocked ? (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zenith-scarlet">Elite Only</span>
                        ) : (
                          <div className="flex items-center space-x-1 text-zenith-scarlet">
                            <Zap size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">+{ex.xp_reward || 50} XP</span>
                          </div>
                        )}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {history.length > 0 ? history.map((item) => (
              <div key={item.id} className="glass-card p-6 border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-zenith-scarlet/10 flex items-center justify-center text-zenith-scarlet">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.exercises?.title || 'Exercício Concluído'}</h4>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">
                      {new Date(item.completed_at).toLocaleDateString()} às {new Date(item.completed_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zenith-scarlet uppercase tracking-widest">+{item.exercises?.xp_reward || 50} XP</span>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
                  <History size={32} />
                </div>
                <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em]">Nenhum registro neural</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            <motion.div
              layoutId={`ex-${selectedExercise.id}`}
              className="glass-card w-full max-w-lg overflow-hidden bg-zenith-black border-white/10 flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="relative aspect-video bg-black">
                <iframe 
                  src={selectedExercise.video_url.replace('watch?v=', 'embed/')} 
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white z-10 hover:bg-zenith-scarlet transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 space-y-10 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-zenith-scarlet">
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em]">{selectedExercise.category}</span>
                  </div>
                  <h3 className="text-4xl font-display font-bold text-white tracking-tighter uppercase leading-none">{selectedExercise.title}</h3>
                  <div className="flex items-center space-x-8 pt-2">
                    <div className="flex items-center space-x-2 text-white/60">
                      <Clock size={18} className="text-zenith-scarlet" />
                      <span className="text-xs font-bold uppercase tracking-widest">{selectedExercise.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/60">
                      <Award size={18} className="text-zenith-scarlet" />
                      <span className="text-xs font-bold uppercase tracking-widest">{selectedExercise.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-zenith-scarlet">
                      <Zap size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">+{selectedExercise.xp_reward || 50} XP</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] text-white/30 font-bold uppercase tracking-[0.4em]">Protocolo de Execução</h4>
                  <p className="text-base text-white/70 leading-relaxed font-light">{selectedExercise.description}</p>
                </div>

                <div className="flex space-x-4">
                  <button 
                    onClick={() => completeExercise(selectedExercise)}
                    className="flex-1 bg-zenith-scarlet text-white py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(255,38,33,0.3)] hover:shadow-[0_0_50px_rgba(255,38,33,0.5)] transition-all flex items-center justify-center space-x-3"
                  >
                    <CheckCircle2 size={18} />
                    <span>Concluir Treino</span>
                  </button>
                  <button 
                    onClick={() => setSelectedExercise(null)}
                    className="px-8 bg-white/5 border border-white/10 text-white/40 py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all"
                  >
                    Sair
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
