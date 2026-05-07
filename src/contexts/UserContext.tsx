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
  isDemoMode: boolean;
  checkLimit: (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts' | 'stories' | 'axis' | 'exercises' | 'finances' | 'journal' | 'gym') => Promise<{ allowed: boolean; message?: string }>;
  incrementUsage: (type: 'ai_messages' | 'routines' | 'actions' | 'ai_generations' | 'habits' | 'posts' | 'stories' | 'axis' | 'exercises' | 'finances' | 'journal' | 'gym') => Promise<void>;
  checkUserAccess: (module: string) => Promise<{ allowed: boolean; message?: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const MOCK_USER = {
  id: 'mock-user-id',
  email: 'demo@zenith.app',
  user_metadata: {
    full_name: 'Usuário Demo',
    username: 'demouser'
  }
};

const MOCK_USER_DATA: UserProfile = {
  id: 'mock-user-id',
  email: 'demo@zenith.app',
  username: 'demouser',
  display_name: 'Usuário Zenith',
  language: 'pt-BR',
  subscription_tier: 'lifetime',
  energy_level: 100,
  xp: 1500,
  level: 10,
  streak: 7,
  onboarding_completed: true,
  life_score: 85,
  is_private: false,
  is_admin: true,
  role: 'admin'
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. App will run in DEMO mode.");
      setIsDemoMode(true);
      setUser(MOCK_USER);
      setUserData(MOCK_USER_DATA);
      setLoading(false);
      setIsSupabaseConnected(true); // Treat as connected for UI purposes
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
          console.warn("Supabase connection failed, entering DEMO mode:", connectionResult.error);
          if (isMounted.current) {
            setIsDemoMode(true);
            setUser(MOCK_USER);
            setUserData(MOCK_USER_DATA);
            setLoading(false);
            setIsSupabaseConnected(true); // Allow traversal
          }
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
      
      // Buscamos na tabela 'profiles' que criamos no SQL Editor
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
      }

      if (data) {
        console.log('Profile found:', data.username);
        const profile = {
          ...data,
          subscription_tier: data.plan || 'free', // Etapa 6: Mapeando plano real
          id: data.id,
          email: userEmail || data.email
        } as any;
        setUserData(profile);
      } else {
        console.log('Profile not found, creating real record...');
        // Etapa 2: Criando o registro inicial se não existir
        const { data: newUser, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            username: metadata?.username || userEmail?.split('@')[0] || `zenith_${Math.floor(Math.random() * 1000)}`,
            display_name: metadata?.full_name || userEmail?.split('@')[0] || 'Novo Zenith',
            plan: 'free', // Inicia no Free (Etapa 6)
            xp: 0
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Adicionando um alerta temporário para que o usuário saiba que precisa rodar o SQL
          if (insertError.code === '42P01') {
            alert('ERRO: Tabela "profiles" não encontrada. Por favor, execute o comando SQL do Passo 2 no Dashboard do Supabase.');
          } else {
            alert('Erro ao criar perfil de usuário: ' + insertError.message);
          }
          return;
        }

        if (newUser) {
          setUserData({ ...newUser, subscription_tier: 'free' } as any);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setTimeout(() => {
        if (isMounted.current) setLoading(false);
      }, 500);
    }
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshUserData = async () => {
    if (isDemoMode) return;
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
    if (isDemoMode) {
      // Just update local state for demo purposes
      const today = new Date().toISOString().split('T')[0];
      const updates: any = { actions_count: (userData.actions_count || 0) + 1, last_action_date: new Date().toISOString() };
      setUserData(prev => prev ? { ...prev, ...updates } : null);
      return;
    }

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
        .from('profiles')
        .update(updates)
        .eq('id', userData.id);
      
      if (!error) {
        setUserData(prev => prev ? { ...prev, ...updates } : null);
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, userData, loading, isSupabaseConnected, connectionError, isDemoMode, refreshUserData, signOut, isPlanActive, checkLimit, incrementUsage, checkUserAccess }}>
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
