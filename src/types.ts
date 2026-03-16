export type SubscriptionTier = 'free' | 'pro' | 'elite' | 'master';

export type UserIdentity = 'discipline_warrior' | 'strategic_mind' | 'mental_athlete' | 'wealth_builder' | 'focus_monk';

export type MascoteState = 'sleeping' | 'energized' | 'happy' | 'tired';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  display_name: string;
  language: 'en' | 'pt-BR' | 'pt-PT' | 'fr' | 'es' | 'ja';
  subscription_tier: SubscriptionTier;
  energy_level: number;
  xp: number;
  level: number;
  streak: number;
  onboarding_completed: boolean;
  identity?: UserIdentity;
  life_score: number;
  mascote_state: MascoteState;
  bio?: string;
  is_private: boolean;
  photo_url?: string;
  avatar_url?: string;
  is_admin?: boolean;
  focus_minutes?: number;
  tasks_completed?: number;
  habits_count?: number;
  missions_completed?: number;
  finance_goals_reached?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HotStreak {
  id: string;
  user1_id: string;
  user2_id: string;
  streak_count: number;
  last_activity: string;
  status: 'active' | 'dead';
}

export interface SocialPost {
  id: string;
  user_id: string;
  caption: string;
  type?: 'achievement' | 'routine' | 'photo' | 'text';
  image_url?: string;
  likes_count: number;
  comments_count?: number;
  created_at: string;
  user?: {
    display_name: string;
    full_name?: string;
    username?: string;
    photo_url: string;
    avatar_url?: string;
  };
}

export interface SocialComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    display_name: string;
    full_name?: string;
    username?: string;
    photo_url: string;
    avatar_url?: string;
  };
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  category: string;
  icon: string;
  target_value: number;
  current_value: number;
  unit: string;
  streak: number;
  xp_reward: number;
  last_completed?: string;
  created_at?: string;
}

export interface Routine {
  id: string;
  user_id: string;
  time: string;
  title: string;
  description?: string;
  category: string;
  period: 'morning' | 'afternoon' | 'evening';
  icon: string;
  completed: boolean;
  last_completed?: string;
  created_at?: string;
}

export interface TierLimits {
  aiMessagesPerDay: number;
  hasFullRoutines: boolean;
  hasExercises: boolean;
  hasYoga: boolean;
  hasAdvancedAnalytics: boolean;
  hasFinanceTracking: boolean;
  hasCustomRoutines: boolean;
  hasPrioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    aiMessagesPerDay: 5,
    hasFullRoutines: false,
    hasExercises: false,
    hasYoga: false,
    hasAdvancedAnalytics: false,
    hasFinanceTracking: false,
    hasCustomRoutines: false,
    hasPrioritySupport: false,
  },
  pro: {
    aiMessagesPerDay: 50,
    hasFullRoutines: true,
    hasExercises: true,
    hasYoga: true,
    hasAdvancedAnalytics: false,
    hasFinanceTracking: false,
    hasCustomRoutines: false,
    hasPrioritySupport: false,
  },
  elite: {
    aiMessagesPerDay: Infinity,
    hasFullRoutines: true,
    hasExercises: true,
    hasYoga: true,
    hasAdvancedAnalytics: true,
    hasFinanceTracking: true,
    hasCustomRoutines: true,
    hasPrioritySupport: false,
  },
  master: {
    aiMessagesPerDay: Infinity,
    hasFullRoutines: true,
    hasExercises: true,
    hasYoga: true,
    hasAdvancedAnalytics: true,
    hasFinanceTracking: true,
    hasCustomRoutines: true,
    hasPrioritySupport: true,
  },
};
