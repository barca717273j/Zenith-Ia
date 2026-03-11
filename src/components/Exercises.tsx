import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Wind, Brain, Play, Clock, ChevronRight, X, Activity, Lock, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';

interface Exercise {
  id: string;
  title: string;
  description: string;
  category: 'strength' | 'yoga' | 'relaxation' | 'mind-body';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl: string;
  isPremium: boolean;
}

interface ExercisesProps {
  t: any;
  userData: any;
}

export const Exercises: React.FC<ExercisesProps> = ({ t, userData }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const tier = userData?.subscriptionTier || 'basic';
  const hasAccessToPremium = ['pro', 'elite', 'master'].includes(tier);

  useEffect(() => {
    fetchExercises();
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

  const categories = [
    { id: 'all', label: 'All', icon: <Brain size={18} /> },
    { id: 'strength', label: t.exercises.categories.strength, icon: <Dumbbell size={18} /> },
    { id: 'yoga', label: t.exercises.categories.yoga, icon: <Activity size={18} /> },
    { id: 'relaxation', label: t.exercises.categories.relaxation, icon: <Wind size={18} /> },
    { id: 'mind-body', label: t.exercises.categories.mindBody, icon: <Brain size={18} /> },
  ];

  const filteredExercises = activeCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === activeCategory);

  return (
    <div className="p-6 space-y-8 pb-32">
      <header className="space-y-2">
        <h2 className="text-3xl font-display font-bold tracking-tighter uppercase">{t.exercises.title}</h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Optimize your biological hardware</p>
      </header>

      {/* Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${
              activeCategory === cat.id 
                ? 'bg-zenith-crimson text-white border-zenith-crimson shadow-[0_0_15px_rgba(139,0,0,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
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
          <div className="w-8 h-8 border-2 border-zenith-crimson border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExercises.map(ex => {
            const isLocked = ex.isPremium && !hasAccessToPremium;
            return (
              <motion.div
                key={ex.id}
                layoutId={`ex-${ex.id}`}
                onClick={() => !isLocked && setSelectedExercise(ex)}
                className={`glass-card group cursor-pointer overflow-hidden border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all ${isLocked ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="aspect-video relative overflow-hidden">
                  <video src={ex.videoUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <div className="bg-zenith-crimson/20 border border-zenith-crimson/40 p-3 rounded-2xl text-zenith-neon-red">
                        <Lock size={24} />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-zenith-scarlet">
                        {ex.category === 'strength' && <Dumbbell size={14} />}
                        {ex.category === 'yoga' && <Activity size={14} />}
                        {ex.category === 'relaxation' && <Wind size={14} />}
                        {ex.category === 'mind-body' && <Brain size={14} />}
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{t.exercises.categories[ex.category]}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{ex.title}</h3>
                    </div>
                    {!isLocked && (
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-xl">
                        <Play size={16} className="text-white" fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5 text-white/40">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{ex.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-white/40">
                      <Sparkles size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{ex.difficulty}</span>
                    </div>
                  </div>
                  {isLocked ? (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zenith-scarlet">Upgrade Required</span>
                  ) : (
                    <ChevronRight size={16} className="text-white/20" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              layoutId={`ex-${selectedExercise.id}`}
              className="glass-card w-full max-w-md overflow-hidden bg-zenith-black border-white/10 flex flex-col max-h-[80vh]"
            >
              <div className="relative aspect-video bg-black">
                <video 
                  src={selectedExercise.videoUrl} 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain" 
                />
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white z-10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-zenith-scarlet">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{t.exercises.categories[selectedExercise.category]}</span>
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white tracking-tighter uppercase">{selectedExercise.title}</h3>
                  <div className="flex items-center space-x-6 pt-2">
                    <div className="flex items-center space-x-2 text-white/60">
                      <Clock size={16} className="text-zenith-scarlet" />
                      <span className="text-xs font-bold uppercase tracking-widest">{selectedExercise.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white/60">
                      <Sparkles size={16} className="text-zenith-scarlet" />
                      <span className="text-xs font-bold uppercase tracking-widest">{selectedExercise.difficulty}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Description</h4>
                  <p className="text-sm text-white/70 leading-relaxed">{selectedExercise.description}</p>
                </div>

                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl"
                >
                  {t.common.back}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
