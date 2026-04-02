import { supabase } from '../lib/supabase';

export const logSystemEvent = async (level: 'info' | 'error' | 'warn', message: string, details?: any) => {
  try {
    const { error } = await supabase
      .from('logs')
      .insert([
        {
          level,
          message,
          details: details ? JSON.stringify(details) : null,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (error) {
      // If table doesn't exist, we just fail silently in production
      // but we could log to console at least
      console.error('Failed to log event to database:', error);
    }
  } catch (err) {
    console.error('Logging service error:', err);
  }
};
