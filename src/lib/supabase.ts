import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

// Don't throw at module load time to prevent blank screen
// Instead, we'll handle missing config in the UI
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured (missing URL or Key)');
    return false;
  }
  
  try {
    // Use a timeout to avoid long "Failed to fetch" waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);

    if (error) {
      // If it's a "table not found" error, the connection is actually working!
      if (error.code === 'PGRST116' || error.message.includes('relation "users" does not exist')) {
        console.log('Supabase connected, but "users" table not found. Please run the SQL schema.');
        return true;
      }
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('Supabase connection timed out.');
    } else {
      console.error('Supabase connection test error:', err.message || err);
    }
    return false;
  }
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'zenit-auth-token',
      lock: (name: string, timeout: number, acquire: () => Promise<any>) => acquire(),
    },
  }
);
