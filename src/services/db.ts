import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  plan: 'free' | 'pro' | 'elite';
  xp: number;
}

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  time: string;
  category: string;
  period: 'morning' | 'afternoon' | 'night';
  completed: boolean;
  description?: string;
  created_at: string;
}

export const dbService = {
  // --- PERFIL ---
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data: data as Profile | null, error };
  },

  async updateXP(userId: string, currentXP: number, amount: number) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ xp: currentXP + amount })
      .eq('id', userId);
    return { data, error };
  },

  // --- ROTINAS ---
  async getRoutines(userId: string) {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('time', { ascending: true });
    return { data: data as Routine[] | null, error };
  },

  async saveRoutine(userId: string, routine: Partial<Routine>) {
    const { data, error } = await supabase
      .from('routines')
      .insert([{ ...routine, user_id: userId }])
      .select()
      .single();
    return { data, error };
  },

  async completeRoutine(userId: string, routineId: string) {
    // 1. Registra no log para histórico e dashboard
    const logPromise = supabase
      .from('routine_logs')
      .insert([{ user_id: userId, routine_id: routineId }]);

    // 2. Marca na tabela principal (para refletir na UI hoje)
    const updatePromise = supabase
      .from('routines')
      .update({ completed: true })
      .eq('id', routineId);

    const [logResult, updateResult] = await Promise.all([logPromise, updatePromise]);
    return { error: logResult.error || updateResult.error };
  },

  // --- HÁBITOS ---
  async getHabits(userId: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  async completeHabit(userId: string, habitId: string, currentStreak: number) {
    // Insere Log
    await supabase.from('habits_logs').insert([{ user_id: userId, habit_id: habitId }]);
    // Atualiza Streak
    return await supabase
      .from('habits')
      .update({ streak: currentStreak + 1, last_completed: new Date().toISOString() })
      .eq('id', habitId);
  },

  // --- TAREFAS ---
  async getTasks(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // --- FINANÇAS ---
  async getFinances(userId: string) {
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    return { data, error };
  },

  async saveTransaction(userId: string, transaction: any) {
    return await supabase
      .from('finances')
      .insert([{ ...transaction, user_id: userId }]);
  },

  // --- ETAPA 4: DASHBOARD REAL ---
  async getDailyPerformance(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    // Puxa total de rotinas do dia
    const { data: routines } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', userId);

    // Puxa logs de hoje
    const { data: logs } = await supabase
      .from('routine_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', today);

    const total = routines?.length || 0;
    const completed = logs?.length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { progress, total, completed };
  }
};
