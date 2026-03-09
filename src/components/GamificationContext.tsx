import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface GamificationContextType {
  xp: number;
  level: number;
  levelName: string;
  addXP: (amount: number) => void;
  streak: number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('xp, streak')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setXP(data.xp || 0);
          setStreak(data.streak || 0);
        }
      }
    };
    fetchStats();
  }, []);

  const addXP = async (amount: number) => {
    const newXP = xp + amount;
    setXP(newXP);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ xp: newXP })
        .eq('id', user.id);
    }
  };

  const level = Math.floor(xp / 100) + 1;
  
  const getLevelName = (lvl: number) => {
    if (lvl < 10) return 'Iniciante';
    if (lvl < 50) return 'Disciplinado';
    return 'Elite';
  };

  return (
    <GamificationContext.Provider value={{ xp, level, levelName: getLevelName(level), addXP, streak }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
};
