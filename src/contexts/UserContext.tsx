import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, SubscriptionTier, TIER_LIMITS } from '../types';

interface UserContextType {
  user: any;
  userData: UserProfile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  connectionError: string | null;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
  isPlanActive: boolean;
  checkLimit: (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts' | 'stories' | 'axis' | 'exercises' | 'finances' | 'journal' | 'gym') => Promise<{ allowed: boolean; message?: string }>;
  incrementUsage: (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts' | 'stories' | 'axis' | 'exercises' | 'finances' | 'journal' | 'gym') => Promise<void>;
  checkUserAccess: (module: string) => Promise<{ allowed: boolean; message?: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. App will run in limited mode.");
      setLoading(false);
      setIsSupabaseConnected(false);
      return;
    }

    isMounted.current = true;

    // Check active session
    const checkSession = async () => {
      try {
        // Test connection first
        const { testSupabaseConnection } = await import('../lib/supabase');
        const connectionResult = await testSupabaseConnection();
        
        if (isMounted.current) {
          setIsSupabaseConnected(connectionResult.connected);
          if (connectionResult.error) {
            setConnectionError(connectionResult.error);
          }
        }

        if (!connectionResult.connected) {
          console.error("Supabase connection failed:", connectionResult.error);
          if (isMounted.current) setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted.current) return;
        
        if (error) {
          console.error("Session error:", error);
          if (error.message.includes('JWT expired')) {
            console.warn("JWT expired, signing out...");
            await supabase.auth.signOut();
          }
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchUserData(session.user.id, session.user.email, session.user.user_metadata);
        } else {
          setUser(null);
          setUserData(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Critical session error:", err);
        if (isMounted.current) {
          setLoading(false);
          setIsSupabaseConnected(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return;

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
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string, userEmail?: string, metadata?: any) => {
    try {
      console.log('Fetching user data for:', userId);
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*, subscriptions(plan, status)')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
      }

      if (data) {
        console.log('User data found:', data.username);
        // Flatten subscription data
        const subscription = (data as any).subscriptions;
        const profile = {
          ...data,
          subscription_tier: subscription?.plan || data.subscription_tier || 'basic',
          subscription_status: subscription?.status || 'active'
        } as UserProfile;
        setUserData(profile);
      } else {
        console.log('User data not found, creating record...');
        // Create user record if it doesn't exist
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: userEmail || '',
            username: metadata?.username || userEmail?.split('@')[0] || `user_${Math.floor(Math.random() * 1000)}`,
            display_name: metadata?.full_name || userEmail?.split('@')[0] || 'User',
            subscription_tier: 'basic',
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
          console.log('User record created successfully');
          // Also create initial subscription record
          await supabase.from('subscriptions').insert([{
            user_id: userId,
            plan: 'basic',
            status: 'active'
          }]);
          
          setUserData({ ...newUser, subscription_tier: 'basic' } as UserProfile);
        } else if (insertError) {
          console.error('Failed to create user record:', insertError);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        if (isMounted.current) {
          setLoading(false);
          console.log('Loading state set to false');
        }
      }, 500);
    }
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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
    userData.subscription_tier !== 'basic' && 
    (!userData.plan_expires_at || new Date(userData.plan_expires_at) > new Date())
  ) : false;

  const checkLimit = async (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts' | 'stories' | 'axis' | 'exercises' | 'finances' | 'journal' | 'gym'): Promise<{ allowed: boolean; message?: string }> => {
    if (!userData) return { allowed: false, message: 'Usuário não carregado' };

    // Admin bypass
    if (userData.role === 'admin' || userData.is_admin) return { allowed: true };

    const tier = userData.subscription_tier || 'basic';
    const limits = TIER_LIMITS[tier];
    const today = new Date().toISOString().split('T')[0];

    // Map module types to usage fields in the database
    const getUsageCount = () => {
      const lastDate = userData.last_action_date?.split('T')[0];
      const lastMsgDate = userData.last_message_date?.split('T')[0];
      const lastGenDate = userData.last_generation_date?.split('T')[0];
      
      if (type === 'ai_messages') return lastMsgDate === today ? (userData.ai_messages_count || 0) : 0;
      if (type === 'ai_generations') return lastGenDate === today ? (userData.ai_generations_count || 0) : 0;
      
      return lastDate === today ? (userData.actions_count || 0) : 0;
    };

    const currentUsage = getUsageCount();
    
    let limit = 0;
    if (type === 'ai_messages') limit = limits.aiMessagesPerDay;
    else if (type === 'ai_generations') limit = limits.aiGenerationsPerDay;
    else if (type === 'routines') limit = limits.routinesPerDay;
    else limit = limits.actionsPerDay;

    if (currentUsage >= limit) {
      return { 
        allowed: false, 
        message: `Limite atingido: O plano ${tier.toUpperCase()} permite apenas ${limit} ações por dia neste módulo. Atualize seu plano para acesso ilimitado.` 
      };
    }

    return { allowed: true };
  };

  const checkUserAccess = async (module: string): Promise<{ allowed: boolean; message?: string }> => {
    return checkLimit(module as any);
  };

  const incrementUsage = async (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts' | 'stories' | 'axis' | 'exercises' | 'finances' | 'journal' | 'gym') => {
    if (!userData) return;

    const today = new Date().toISOString().split('T')[0];
    const updates: any = {};

    const lastDate = userData.last_action_date?.split('T')[0];
    const count = lastDate === today ? (userData.actions_count || 0) : 0;
    
    updates.actions_count = count + 1;
    updates.last_action_date = new Date().toISOString();

    if (type === 'ai_messages') {
      const lastMsgDate = userData.last_message_date?.split('T')[0];
      const msgCount = lastMsgDate === today ? (userData.ai_messages_count || 0) : 0;
      updates.ai_messages_count = msgCount + 1;
      updates.last_message_date = new Date().toISOString();
    } else if (type === 'ai_generations') {
      const lastGenDate = userData.last_generation_date?.split('T')[0];
      const genCount = lastGenDate === today ? (userData.ai_generations_count || 0) : 0;
      updates.ai_generations_count = genCount + 1;
      updates.last_generation_date = new Date().toISOString();
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
    <UserContext.Provider value={{ user, userData, loading, isSupabaseConnected, connectionError, refreshUserData, signOut, isPlanActive, checkLimit, incrementUsage, checkUserAccess }}>
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
