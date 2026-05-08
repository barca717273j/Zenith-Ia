import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

// Don't throw at module load time to prevent blank screen
// Instead, we'll handle missing config in the UI
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  supabaseUrl.includes('.supabase.co') &&
  supabaseUrl.split('.supabase.co')[0].length > 8 // Ensure there's a project ref
);

export const testSupabaseConnection = async (retryCount = 0): Promise<{ connected: boolean; error?: string }> => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured correctly (missing URL, Key or invalid format)');
    if (!supabaseUrl || !supabaseAnonKey) return { connected: false, error: 'Configuração ausente (URL ou Chave)' };
    if (!supabaseUrl.includes('.supabase.co')) return { connected: false, error: 'URL do Supabase inválida (deve conter .supabase.co)' };
    return { connected: false, error: 'Configuração incompleta ou inválida' };
  }

  if (!supabaseUrl.startsWith('http')) {
    console.error('Invalid Supabase URL: Must start with http:// or https://');
    return { connected: false, error: 'URL inválida (deve começar com http:// ou https://)' };
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
      .from('profiles')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);

    if (error) {
      // If it's a "table not found" error, the connection is actually working!
      if (error.code === 'PGRST116' || error.message.includes('relation "profiles" does not exist') || error.code === '42P01') {
        console.log('Supabase connected, but "profiles" table not found. Please run the SQL schema.');
        return { connected: true };
      }
      
      const errMessage = error.message || '';

      // Handle specific abort error returned in the error object
      if (errMessage.includes('AbortError') || errMessage.includes('aborted')) {
        return { 
          connected: false, 
          error: 'Sincronização neural lenta. O servidor está processando os dados (isso pode ocorrer se o sistema estiver em repouso).' 
        };
      }

      if (errMessage.includes('JWT expired')) {
        // If it's a JWT expired error, it might be a stale user session.
        // Try clearing the session and retrying once.
        if (retryCount === 0) {
          console.warn('JWT expired detected during connection test. Clearing session and retrying...');
          try {
            localStorage.removeItem('zenit-auth-token');
          } catch (e) {
            console.error('Failed to clear local storage:', e);
          }
          return testSupabaseConnection(retryCount + 1);
        }

        return {
          connected: false,
          error: 'A chave VITE_SUPABASE_ANON_KEY expirou ou é inválida. Por favor, gere uma nova chave no painel do Supabase.'
        };
      }

      console.error('Supabase connection test failed:', errMessage);
      return { connected: false, error: errMessage };
    }
    return { connected: true };
  } catch (err: any) {
    // Convert error to string more reliably
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    if (err.name === 'AbortError' || errorMessage.includes('aborted')) {
      return { 
        connected: false, 
        error: 'Sincronização neural excedeu o tempo limite. Tente atualizar a página ou verifique sua conexão.' 
      };
    }
    
    if (errorMessage.toLowerCase().includes('failed to fetch') || errorMessage.toLowerCase().includes('load failed')) {
      return {
        connected: false,
        error: 'Falha na comunicação com o Supabase. Isso ocorre se:\n1. O projeto estiver PAUSADO (veja no painel do Supabase).\n2. A URL estiver incorreta.\n3. Bloqueio de rede (Adblock/Firewall/VPN).\n\nVerifique se o seu projeto está ativo em https://supabase.com/dashboard'
      };
    }

    console.error('Supabase connection test error:', errorMessage);
    return { connected: false, error: errorMessage };
  }
};

const createSafeClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.warn("Supabase credentials missing. App running in Demo Mode.");
    // Return a proxy that logs warnings instead of crashing
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error("Demo Mode") }),
        signUp: async () => ({ data: { user: null, session: null }, error: new Error("Demo Mode") }),
      },
      from: (table: string) => ({
        select: () => ({ 
          eq: () => ({ 
            single: async () => ({ data: null, error: null }), 
            limit: () => ({ abortSignal: async () => ({ data: null, error: null }) }),
            order: () => ({ data: [], error: null })
          }),
          order: () => ({ limit: () => ({ data: [], error: null }) })
        }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null, error: null }) }),
      }),
      rpc: async () => ({ data: null, error: null }),
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        })
      }
    } as any;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'zenit-auth-token',
    },
  });
};

export const supabase = createSafeClient();
