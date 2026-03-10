import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Wind, Brain, Play, Clock, Repeat, ChevronRight, X, Activity } from 'lucide-react';

interface Exercise {
  id: string;
  title: string;
  category: 'physical' | 'yoga' | 'relaxation' | 'mindBody';
  duration?: string;
  reps?: string;
  instructions: string[];
  image: string;
}

interface ExercisesProps {
  t: any;
}

export const Exercises: React.FC<ExercisesProps> = ({ t }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'physical' | 'yoga' | 'relaxation' | 'mindBody'>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const exercises: Exercise[] = [
    {
      id: '1',
      title: 'High Intensity Interval Training',
      category: 'physical',
      duration: '15 min',
      instructions: ['Jumping jacks for 30s', 'Rest for 10s', 'Mountain climbers for 30s', 'Rest for 10s', 'Burpees for 30s'],
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '2',
      title: 'Sun Salutation (Surya Namaskar)',
      category: 'yoga',
      duration: '10 min',
      instructions: ['Pranamasana (Prayer pose)', 'Hastauttanasana (Raised arms pose)', 'Padahastasana (Standing forward bend)', 'Ashwa Sanchalanasana (Equestrian pose)'],
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '3',
      title: 'Deep Breathing Meditation',
      category: 'relaxation',
      duration: '5 min',
      instructions: ['Sit comfortably with your back straight', 'Inhale deeply through your nose for 4s', 'Hold your breath for 4s', 'Exhale slowly through your mouth for 6s'],
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '4',
      title: 'Body Scan Awareness',
      category: 'mindBody',
      duration: '12 min',
      instructions: ['Lie down on your back', 'Close your eyes and breathe naturally', 'Focus your attention on your toes', 'Slowly move your awareness up through your body'],
      image: 'https://images.unsplash.com/photo-1591343395582-355a448d4851?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '5',
      title: 'Core Strength Circuit',
      category: 'physical',
      reps: '3 sets',
      instructions: ['Plank for 45s', 'Russian twists for 20 reps', 'Leg raises for 15 reps', 'Bicycle crunches for 20 reps'],
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800'
    }
  ];

  const categories = [
    { id: 'all', label: 'All', icon: <Brain size={18} /> },
    { id: 'physical', label: t.exercises.categories.physical, icon: <Dumbbell size={18} /> },
    { id: 'yoga', label: t.exercises.categories.yoga, icon: <Activity size={18} /> },
    { id: 'relaxation', label: t.exercises.categories.relaxation, icon: <Wind size={18} /> },
    { id: 'mindBody', label: t.exercises.categories.mindBody, icon: <Brain size={18} /> },
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
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${
              activeCategory === cat.id 
                ? 'bg-zenith-cyan text-black border-zenith-cyan shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {cat.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredExercises.map(ex => (
          <motion.div
            key={ex.id}
            layoutId={`ex-${ex.id}`}
            onClick={() => setSelectedExercise(ex)}
            className="glass-card group cursor-pointer overflow-hidden border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
          >
            <div className="aspect-video relative overflow-hidden">
              <img src={ex.image} alt={ex.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-zenith-cyan">
                    {ex.category === 'physical' && <Dumbbell size={14} />}
                    {ex.category === 'yoga' && <Activity size={14} />}
                    {ex.category === 'relaxation' && <Wind size={14} />}
                    {ex.category === 'mindBody' && <Brain size={14} />}
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{t.exercises.categories[ex.category]}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{ex.title}</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-xl">
                  <Play size={16} className="text-white" fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {ex.duration && (
                  <div className="flex items-center space-x-1.5 text-white/40">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{ex.duration}</span>
                  </div>
                )}
                {ex.reps && (
                  <div className="flex items-center space-x-1.5 text-white/40">
                    <Repeat size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{ex.reps}</span>
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="text-white/20" />
            </div>
          </motion.div>
        ))}
      </div>

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
              <div className="relative aspect-video">
                <img src={selectedExercise.image} alt={selectedExercise.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-zenith-black via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-zenith-cyan">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{t.exercises.categories[selectedExercise.category]}</span>
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white tracking-tighter uppercase">{selectedExercise.title}</h3>
                  <div className="flex items-center space-x-6 pt-2">
                    {selectedExercise.duration && (
                      <div className="flex items-center space-x-2 text-white/60">
                        <Clock size={16} className="text-zenith-cyan" />
                        <span className="text-xs font-bold uppercase tracking-widest">{selectedExercise.duration}</span>
                      </div>
                    )}
                    {selectedExercise.reps && (
                      <div className="flex items-center space-x-2 text-white/60">
                        <Repeat size={16} className="text-zenith-cyan" />
                        <span className="text-xs font-bold uppercase tracking-widest">{selectedExercise.reps}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Instructions</h4>
                  <div className="space-y-4">
                    {selectedExercise.instructions.map((step, i) => (
                      <div key={i} className="flex items-start space-x-4 group">
                        <div className="w-6 h-6 rounded-full bg-zenith-cyan/10 border border-zenith-cyan/20 flex items-center justify-center text-zenith-cyan text-[10px] font-bold flex-shrink-0 mt-0.5 group-hover:bg-zenith-cyan group-hover:text-black transition-all">
                          {i + 1}
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl">
                  {t.common.start}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
