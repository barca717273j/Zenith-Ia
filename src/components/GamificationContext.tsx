import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface GamificationContextType {
  xp: number;
  level: number;
  levelName: string;
  addXP: (amount: number) => void;
  streak: number;
  lifeScore: number;
  dailyProgress: number;
  refreshStats: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lifeScore, setLifeScore] = useState(0);
  const [dailyProgress, setDailyProgress] = useState(0);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('xp, streak, life_score')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setXP(userData.xp || 0);
        setStreak(userData.streak || 0);
        setLifeScore(userData.life_score || 0);
      }

      // Calculate daily progress
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Habits
      const { data: habits } = await supabase.from('habits').select('id').eq('user_id', user.id);
      const { data: completedHabits } = await supabase.from('habit_logs').select('id').eq('user_id', user.id).eq('date', today);
      
      // 2. Routines
      const { data: routines } = await supabase.from('routines').select('id').eq('user_id', user.id);
      const { data: completedRoutines } = await supabase.from('routine_logs').select('id').eq('user_id', user.id).eq('date', today);

      // 3. Exercises
      const { data: completedExercises } = await supabase.from('exercise_history').select('id').eq('user_id', user.id).gte('completed_at', today);

      const totalItems = (habits?.length || 0) + (routines?.length || 0) + 1; // +1 for at least one exercise goal
      const completedItems = (completedHabits?.length || 0) + (completedRoutines?.length || 0) + (completedExercises?.length ? 1 : 0);
      
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      setDailyProgress(Math.min(100, progress));
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const addXP = async (amount: number) => {
    const newXP = xp + amount;
    setXP(newXP);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ 
          xp: newXP,
          life_score: lifeScore + Math.floor(amount / 10) // Increase life score slightly with XP
        })
        .eq('id', user.id);
      
      fetchStats(); // Refresh to get updated life score
    }
  };

  const level = Math.floor(xp / 100) + 1;
  
  const getLevelName = (lvl: number) => {
    if (lvl < 10) return 'Iniciante';
    if (lvl < 50) return 'Disciplinado';
    return 'Elite';
  };

  return (
    <GamificationContext.Provider value={{ xp, level, levelName: getLevelName(level), addXP, streak, lifeScore, dailyProgress, refreshStats: fetchStats }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
};
