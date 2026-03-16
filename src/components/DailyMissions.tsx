import React from 'react';
import { supabase } from '../supabase';
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-zenith-cyan rounded-full animate-pulse" />
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-white/90">
              Objetivos Táticos
            </h3>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Recompensas de XP Ativas</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]"
        >
          <Trophy size={16} className="text-zenith-electric-blue drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Nível {level}</span>
        </motion.div>
      </div>

      <div className="glass-card p-8 space-y-10 relative overflow-hidden border-white/5 bg-white/[0.01]">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-zenith-electric-blue/10 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Progress Section */}
        <div className="space-y-4 relative z-10">
          <div className="flex justify-between items-end">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Award size={12} className="text-zenith-electric-blue" />
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Patente Atual</span>
              </div>
              <p className="text-xl font-display font-bold text-white uppercase tracking-tight">{levelName}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-zenith-electric-blue text-xs font-mono font-bold drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                {xp % 100} / 100 XP
              </span>
              <div className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Próximo Nível</div>
            </div>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xp % 100}%` }}
              className="h-full bg-gradient-to-r from-zenith-electric-blue via-zenith-cyan to-zenith-electric-blue rounded-full relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-5 relative z-10">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-zenith-electric-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : missions.map((m) => (
            <motion.div 
              key={m.id} 
              whileHover={{ x: 4 }}
              className="group flex items-center space-x-5 p-5 rounded-[28px] bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-zenith-electric-blue/30 transition-all shadow-inner">
                <div className="text-white/30 group-hover:text-zenith-electric-blue transition-colors">
                  {m.icon}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white/80 group-hover:text-white transition-colors tracking-tight">{m.title}</p>
                    <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold">{m.progress} de {m.total} Concluídos</p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-zenith-electric-blue bg-zenith-electric-blue/10 px-3 py-1 rounded-xl border border-zenith-electric-blue/10">
                    <Sparkles size={10} />
                    <span className="text-[10px] font-bold font-mono">+{m.xp} XP</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (m.progress / m.total) * 100)}%` }}
                    className={`h-full transition-all rounded-full ${m.progress >= m.total ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10 group-hover:bg-zenith-electric-blue/40'}`} 
                  />
                </div>
              </div>
              <ChevronRight size={16} className="text-white/5 group-hover:text-white/20 transition-colors" />
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};
