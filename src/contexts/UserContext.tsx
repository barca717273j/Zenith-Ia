import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import { UserProfile, SubscriptionTier, TIER_LIMITS } from '../types';

interface UserContextType {
  user: any;
  userData: UserProfile | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
  isPlanActive: boolean;
  checkLimit: (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts') => Promise<{ allowed: boolean; message?: string }>;
  incrementUsage: (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts') => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          fetchUserData(session.user.id, session.user.email, session.user.user_metadata);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string, userEmail?: string, metadata?: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
      }

      if (data) {
        setUserData(data as UserProfile);
      } else {
        // Create user record if it doesn't exist
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: userEmail || '',
            username: metadata?.username || userEmail?.split('@')[0] || `user_${Math.floor(Math.random() * 1000)}`,
            display_name: metadata?.full_name || userEmail?.split('@')[0] || 'User',
            subscription_tier: 'free',
            energy_level: 100,
            xp: 0,
            level: 1,
            streak: 0,
            onboarding_completed: false,
            ai_messages_count: 0,
            actions_count: 0,
            ai_generations_count: 0,
            posts_count: 0,
            last_message_date: new Date().toISOString(),
            last_action_date: new Date().toISOString(),
            last_generation_date: new Date().toISOString(),
            last_post_date: new Date().toISOString()
          }])
          .select()
          .single();

        if (newUser) {
          setUserData(newUser as UserProfile);
        } else if (insertError) {
          console.error('Failed to create user record:', insertError);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (user?.id) {
      await fetchUserData(user.id, user.email, user.user_metadata);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
  };

  const isPlanActive = userData ? (
    userData.subscription_tier !== 'free' && 
    (!userData.plan_expires_at || new Date(userData.plan_expires_at) > new Date())
  ) : false;

  const checkLimit = async (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts'): Promise<{ allowed: boolean; message?: string }> => {
    if (!userData) return { allowed: false, message: 'Usuário não carregado' };

    const tier = userData.subscription_tier;
    const limits = TIER_LIMITS[tier];
    const today = new Date().toISOString().split('T')[0];

    if (type === 'ai_messages') {
      const lastDate = userData.last_message_date?.split('T')[0];
      const count = lastDate === today ? (userData.ai_messages_count || 0) : 0;
      if (count >= limits.aiMessagesPerDay) {
        return { allowed: false, message: 'Você atingiu o limite de mensagens de IA do seu plano hoje.' };
      }
    } else if (type === 'ai_generations') {
      const lastDate = userData.last_generation_date?.split('T')[0];
      const count = lastDate === today ? (userData.ai_generations_count || 0) : 0;
      if (count >= limits.aiGenerationsPerDay) {
        return { allowed: false, message: 'Você atingiu o limite de gerações por IA hoje.' };
      }
    } else if (type === 'actions') {
      const lastDate = userData.last_action_date?.split('T')[0];
      const count = lastDate === today ? (userData.actions_count || 0) : 0;
      if (count >= limits.actionsPerDay) {
        return { allowed: false, message: 'Você atingiu o limite de ações diárias do seu plano.' };
      }
    } else if (type === 'posts') {
      const lastDate = userData.last_post_date?.split('T')[0];
      const count = lastDate === today ? (userData.posts_count || 0) : 0;
      if (count >= limits.posts) {
        return { allowed: false, message: 'Você atingiu o limite de postagens diárias do seu plano.' };
      }
    } else if (type === 'routines') {
      // For routines, we check the total count of active routines
      const { count, error } = await supabase
        .from('routines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id);
      
      if (error) return { allowed: false, message: 'Erro ao verificar limites' };
      if ((count || 0) >= limits.routinesPerDay) {
        return { allowed: false, message: `Você atingiu o limite de ${limits.routinesPerDay} rotinas do seu plano.` };
      }
    } else if (type === 'habits') {
      // For habits, we check the total count of active habits
      const { count, error } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id);
      
      if (error) return { allowed: false, message: 'Erro ao verificar limites' };
      if ((count || 0) >= limits.habits) {
        return { allowed: false, message: `Você atingiu o limite de ${limits.habits} hábitos do seu plano.` };
      }
    }

    return { allowed: true };
  };

  const incrementUsage = async (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts') => {
    if (!userData) return;

    const today = new Date().toISOString().split('T')[0];
    const updates: any = {};

    if (type === 'ai_messages') {
      const lastDate = userData.last_message_date?.split('T')[0];
      const count = lastDate === today ? (userData.ai_messages_count || 0) : 0;
      updates.ai_messages_count = count + 1;
      updates.last_message_date = new Date().toISOString();
    } else if (type === 'ai_generations') {
      const lastDate = userData.last_generation_date?.split('T')[0];
      const count = lastDate === today ? (userData.ai_generations_count || 0) : 0;
      updates.ai_generations_count = count + 1;
      updates.last_generation_date = new Date().toISOString();
    } else if (type === 'actions') {
      const lastDate = userData.last_action_date?.split('T')[0];
      const count = lastDate === today ? (userData.actions_count || 0) : 0;
      updates.actions_count = count + 1;
      updates.last_action_date = new Date().toISOString();
    } else if (type === 'posts') {
      const lastDate = userData.last_post_date?.split('T')[0];
      const count = lastDate === today ? (userData.posts_count || 0) : 0;
      updates.posts_count = count + 1;
      updates.last_post_date = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userData.id);
      
      if (!error) {
        setUserData(prev => prev ? { ...prev, ...updates } : null);
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, userData, loading, refreshUserData, signOut, isPlanActive, checkLimit, incrementUsage }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
