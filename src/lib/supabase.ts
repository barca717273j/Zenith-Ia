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
      .from('users')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);

    if (error) {
      // If it's a "table not found" error, the connection is actually working!
      if (error.code === 'PGRST116' || error.message.includes('relation "users" does not exist') || error.code === '42P01') {
        console.log('Supabase connected, but "users" table not found. Please run the SQL schema.');
        return { connected: true };
      }
      
      const errMessage = error.message || '';

      // Handle specific abort error returned in the error object
      if (errMessage.includes('AbortError') || errMessage.includes('aborted')) {
        return { 
          connected: false, 
          error: 'Conexão interrompida por tempo limite (30s). O servidor Supabase pode estar demorando para responder ou o projeto está pausado.' 
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
        error: 'Tempo limite de conexão excedido (30s). Verifique se o projeto Supabase não está pausado.' 
      };
    }
    
    if (errorMessage.toLowerCase().includes('failed to fetch')) {
      return {
        connected: false,
        error: 'Falha na comunicação com o Supabase (Failed to fetch). Isso geralmente ocorre se a URL estiver incorreta (verifique se não há espaços extras), o projeto estiver pausado no painel do Supabase, ou se houver um bloqueio de rede por Adblock ou Firewall. Verifique as configurações no menu "Settings".'
      };
    }

    console.error('Supabase connection test error:', errorMessage);
    return { connected: false, error: errorMessage };
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
