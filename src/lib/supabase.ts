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

  if (!supabaseUrl.startsWith('http')) {
    console.error('Invalid Supabase URL: Must start with http:// or https://');
    return false;
  }
  
  try {
    // Use a longer timeout for slow cold starts (30s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort(new Error("Connection timeout after 30s"));
      } catch (e) {
        controller.abort();
      }
    }, 30000);

    // Try a very simple query
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);

    if (error) {
      // If it's a "table not found" error, the connection is actually working!
      if (error.code === 'PGRST116' || error.message.includes('relation "users" does not exist') || error.code === '42P01') {
        console.log('Supabase connected, but "users" table not found. Please run the SQL schema.');
        return true;
      }
      
      // Handle specific abort error returned in the error object
      if (error.message && (error.message.includes('AbortError') || error.message.includes('aborted'))) {
        console.error('Supabase connection timed out or was aborted. Check if your project is paused or the URL is correct.');
        return false;
      }

      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    if (err.name === 'AbortError' || (err.message && err.message.includes('aborted'))) {
      console.error('Supabase connection timed out. The server is taking too long to respond.');
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
