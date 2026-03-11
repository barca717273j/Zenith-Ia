export type SubscriptionTier = 'basic' | 'pro' | 'elite' | 'master';

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
  basic: {
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
