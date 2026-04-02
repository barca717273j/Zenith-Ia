import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
        .select('xp, streak, life_score, last_action_date')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setXP(userData.xp || 0);
        setLifeScore(userData.life_score || 0);
        
        // Streak logic
        const today = new Date().toISOString().split('T')[0];
        const lastAction = userData.last_action_date ? userData.last_action_date.split('T')[0] : null;
        
        if (lastAction === today) {
          setStreak(userData.streak || 0);
        } else {
          // Check if last action was yesterday to maintain streak
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastAction === yesterdayStr) {
            setStreak(userData.streak || 0);
          } else {
            // Streak broken
            setStreak(0);
            await supabase.from('users').update({ streak: 0 }).eq('id', user.id);
          }
        }
      }

      // Calculate daily progress
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Habits
      const { data: habits } = await supabase.from('habits').select('completion_history').eq('user_id', user.id);
      const completedHabitsCount = habits?.filter(h => h.completion_history?.includes(today)).length || 0;
      
      // 2. Routines
      const { data: routines } = await supabase.from('routines').select('last_completed').eq('user_id', user.id);
      const completedRoutinesCount = routines?.filter(r => r.last_completed?.startsWith(today)).length || 0;

      // 3. Exercises (from exercise_history)
      const { data: completedExercises } = await supabase
        .from('exercise_history')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', today + 'T00:00:00Z');

      const totalItems = (habits?.length || 0) + (routines?.length || 0) + 1; // +1 for at least one exercise goal
      const completedItems = completedHabitsCount + completedRoutinesCount + (completedExercises?.length ? 1 : 0);
      
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      setDailyProgress(Math.min(100, progress));
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up interval to refresh stats occasionally
    const interval = setInterval(fetchStats, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  const addXP = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current XP first to avoid stale state issues
    const { data: currentData } = await supabase
      .from('users')
      .select('xp, life_score, streak, last_action_date')
      .eq('id', user.id)
      .single();

    if (!currentData) return;

    const newXP = (currentData.xp || 0) + amount;
    const today = new Date().toISOString().split('T')[0];
    const lastAction = currentData.last_action_date ? currentData.last_action_date.split('T')[0] : null;
    
    let newStreak = currentData.streak || 0;
    if (lastAction !== today) {
      newStreak += 1;
    }

    setXP(newXP);
    setStreak(newStreak);
    
    await supabase
      .from('users')
      .update({ 
        xp: newXP,
        life_score: (currentData.life_score || 0) + Math.floor(amount / 10),
        streak: newStreak,
        last_action_date: new Date().toISOString()
      })
      .eq('id', user.id);
    
    await fetchStats();
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
