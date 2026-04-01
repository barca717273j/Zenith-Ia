export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'master';

export type UserIdentity = 'discipline_warrior' | 'strategic_mind' | 'mental_athlete' | 'wealth_builder' | 'focus_monk';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  display_name: string;
  language: 'en' | 'pt-BR' | 'pt-PT' | 'fr' | 'es' | 'ja';
  subscription_tier: SubscriptionTier;
  plan_expires_at?: string;
  energy_level: number;
  xp: number;
  level: number;
  streak: number;
  onboarding_completed: boolean;
  identity?: UserIdentity;
  life_score: number;
  bio?: string;
  is_private: boolean;
  photo_url?: string;
  avatar_url?: string;
  role?: string;
  is_admin?: boolean;
  focus_minutes?: number;
  tasks_completed?: number;
  habits_count?: number;
  missions_completed?: number;
  finance_goals_reached?: number;
  ai_messages_count?: number;
  last_message_date?: string;
  ai_generations_count?: number;
  last_generation_date?: string;
  actions_count?: number;
  last_action_date?: string;
  posts_count?: number;
  last_post_date?: string;
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
  type?: 'thought' | 'achievement' | 'routine' | 'reflection' | 'photo' | 'text';
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
    level?: number;
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
  aiGenerationsPerDay: number;
  routinesPerDay: number;
  actionsPerDay: number;
  habits: number;
  posts: number;
  storiesPerDay: number;
  hasFullSocial: boolean;
  hasPremiumExercises: boolean;
  hasAdvancedAnalytics: boolean;
  hasFinanceTracking: boolean;
  hasCustomRoutines: boolean;
  hasPrioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    aiMessagesPerDay: 1,
    aiGenerationsPerDay: 1,
    routinesPerDay: 1,
    actionsPerDay: 1,
    habits: 1,
    posts: 0,
    storiesPerDay: 0,
    hasFullSocial: false,
    hasPremiumExercises: false,
    hasAdvancedAnalytics: false,
    hasFinanceTracking: true,
    hasCustomRoutines: false,
    hasPrioritySupport: false,
  },
  basic: {
    aiMessagesPerDay: 20,
    aiGenerationsPerDay: 10,
    routinesPerDay: 10,
    actionsPerDay: 15,
    habits: 10,
    posts: 0,
    storiesPerDay: 0,
    hasFullSocial: false,
    hasPremiumExercises: true,
    hasAdvancedAnalytics: false,
    hasFinanceTracking: true,
    hasCustomRoutines: false,
    hasPrioritySupport: false,
  },
  pro: {
    aiMessagesPerDay: 100,
    aiGenerationsPerDay: 50,
    routinesPerDay: 30,
    actionsPerDay: 50,
    habits: 30,
    posts: 5,
    storiesPerDay: 5,
    hasFullSocial: true,
    hasPremiumExercises: true,
    hasAdvancedAnalytics: false,
    hasFinanceTracking: true,
    hasCustomRoutines: true,
    hasPrioritySupport: false,
  },
  master: {
    aiMessagesPerDay: Infinity,
    aiGenerationsPerDay: Infinity,
    routinesPerDay: Infinity,
    actionsPerDay: Infinity,
    habits: Infinity,
    posts: Infinity,
    storiesPerDay: Infinity,
    hasFullSocial: true,
    hasPremiumExercises: true,
    hasAdvancedAnalytics: true,
    hasFinanceTracking: true,
    hasCustomRoutines: true,
    hasPrioritySupport: true,
  },
};
