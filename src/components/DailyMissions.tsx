import React from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Target, Star, Trophy, Sparkles, ShieldCheck, Zap, Award, ChevronRight } from 'lucide-react';
import { useGamification } from './GamificationContext';

export const DailyMissions: React.FC<{ t: any; userData: any }> = ({ t, userData }) => {
  const { xp, level, levelName, refreshStats } = useGamification();
  const [missions, setMissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchMissionProgress = async () => {
    if (!userData?.id) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Habits completed today
      const { data: habits } = await supabase
        .from('habits')
        .select('completion_history')
        .eq('user_id', userData.id);
      
      const habitsCompletedToday = habits?.filter(h => h.completion_history?.includes(today)).length || 0;

      // 2. Focus Session today
      const { data: focusSessions } = await supabase
        .from('focus_sessions')
        .select('duration')
        .eq('user_id', userData.id)
        .gte('created_at', today);
      
      const totalFocusToday = focusSessions?.reduce((acc, s) => acc + s.duration, 0) || 0;
      const focusMinutesToday = Math.floor(totalFocusToday / 60);

      // 3. Routines completed today
      const { data: routines } = await supabase
        .from('routines')
        .select('last_completed')
        .eq('user_id', userData.id);
      
      const routinesCompletedToday = routines?.filter(r => r.last_completed?.startsWith(today)).length || 0;

      const realMissions = [
        { 
          id: 1, 
          title: 'Sincronizar 3 Hábitos', 
          progress: habitsCompletedToday, 
          total: 3, 
          xp: 50, 
          icon: <ShieldCheck size={16} /> 
        },
        { 
          id: 2, 
          title: 'Foco Neural 25m', 
          progress: Math.min(25, focusMinutesToday), 
          total: 25, 
          xp: 30, 
          icon: <Zap size={16} /> 
        },
        { 
          id: 3, 
          title: 'Completar Ciclo de Rotina', 
          progress: routinesCompletedToday, 
          total: 4, 
          xp: 40, 
          icon: <Target size={16} /> 
        },
      ];

      setMissions(realMissions);
    } catch (err) {
      console.error('Error fetching mission progress:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMissionProgress();
  }, [userData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zenit-text-primary italic">
              Objetivos Táticos
            </h3>
          </div>
          <p className="text-[8px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-black leading-none">Recompensas de Atributos</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-3 bg-zenit-surface-2 px-5 py-2.5 rounded-2xl border border-zenit-border-primary shadow-sm"
        >
          <Trophy size={14} className="text-zenit-text-tertiary" />
          <span className="text-[9px] font-black uppercase tracking-widest text-zenit-text-primary">Nível {level}</span>
        </motion.div>
      </div>

      <div className="glass-card p-8 space-y-10 relative overflow-hidden border border-white/5 bg-white/[0.02] rounded-[2.5rem]">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Progress Section */}
        <div className="space-y-5 relative z-10">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-[8px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black italic">Rank Neural</span>
              </div>
              <p className="text-2xl font-display font-black text-zenit-text-primary italic uppercase tracking-tighter leading-none">{levelName}</p>
            </div>
            <div className="text-right space-y-1.5">
              <span className="text-zenit-text-primary text-xs font-black italic">
                {xp % 100}<span className="text-zenit-text-tertiary/20"> / 100 XP</span>
              </span>
            </div>
          </div>
          <div className="h-2 w-full bg-zenit-surface-2 rounded-full overflow-hidden p-[2px] border border-zenit-border-primary">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xp % 100}%` }}
              className="h-full bg-zenit-accent rounded-full relative shadow-[0_0_15px_var(--accent-glow)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-zenit-border-primary border-t-zenit-accent rounded-full animate-spin" />
            </div>
          ) : missions.map((m) => (
            <motion.div 
              key={m.id} 
              whileHover={{ x: 4 }}
              className="group flex items-center space-x-5 p-4 rounded-3xl bg-zenit-surface-2 border border-zenit-border-primary hover:bg-zenit-surface-3 transition-all cursor-pointer shadow-sm"
            >
              <div className="w-11 h-11 rounded-2xl bg-zenit-surface-3 flex items-center justify-center shrink-0 border border-zenit-border-primary group-hover:bg-zenit-text-primary group-hover:text-zenit-black transition-all shadow-inner">
                <div className="text-zenit-text-tertiary group-hover:text-inherit">
                  {m.icon}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-zenit-text-primary group-hover:text-zenit-text-primary transition-colors tracking-tight uppercase italic">{m.title}</p>
                    <p className="text-[8px] text-zenit-text-tertiary uppercase tracking-widest font-black">{m.progress} de {m.total} CICLOS</p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zenit-text-tertiary">
                    <span className="text-[9px] font-black italic">+{m.xp} XP</span>
                  </div>
                </div>
                <div className="h-1 w-full bg-zenit-surface-3 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (m.progress / m.total) * 100)}%` }}
                    className={`h-full transition-all rounded-full ${m.progress >= m.total ? 'bg-zenit-accent shadow-[0_0_10px_var(--accent-glow)]' : 'bg-zenit-accent/20 group-hover:bg-zenit-accent/30'}`} 
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};
