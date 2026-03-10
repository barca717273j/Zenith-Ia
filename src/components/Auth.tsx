import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { LogIn, UserPlus, Globe, Mail, Lock, AlertTriangle, Sparkles, Shield } from 'lucide-react';
import { ZenithLogo } from './ZenithLogo';

interface AuthProps {
  onSuccess: () => void;
}

import { translations, Language } from '../translations';

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[language];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data: { user }, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              { 
                id: user.id, 
                email: user.email, 
                language, 
                subscriptionTier: 'free',
                energyLevel: 100,
                displayName: user.user_metadata?.full_name || '',
                photoURL: user.user_metadata?.avatar_url || ''
              }
            ]);
          if (profileError) console.error('Profile creation error:', profileError);
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zenith-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#111,0%,#000,100%)]" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zenith-electric-blue/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zenith-cyan/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 space-y-10 relative z-10 glass-card border-white/5 bg-black/40 backdrop-blur-3xl rounded-3xl"
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <ZenithLogo size={80} className="text-white" />
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-display font-bold tracking-tighter uppercase leading-none">Zenith</h1>
            <div className="flex items-center justify-center space-x-2 text-zenith-electric-blue">
              <Sparkles size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Life Operating System</span>
            </div>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${isLogin ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            {t.common.login}
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            {t.common.register}
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold ml-1">{t.common.email}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-zenith-electric-blue transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-zenith-electric-blue transition-all text-sm font-medium"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold ml-1">{t.common.password}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-zenith-electric-blue transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-zenith-electric-blue transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
            
            {!isLogin && password.length > 0 && (
              <div className="space-y-2 px-1">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-bold">
                  <span className="text-white/40">Força da Senha</span>
                  <span className={
                    password.length < 6 ? 'text-red-400' : 
                    password.length < 10 ? 'text-orange-400' : 
                    'text-green-400'
                  }>
                    {password.length < 6 ? 'Fraca' : password.length < 10 ? 'Média' : 'Forte'}
                  </span>
                </div>
                <div className="flex space-x-1 h-1">
                  <div className={`flex-1 rounded-full transition-all duration-500 ${password.length > 0 ? (password.length < 6 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : password.length < 10 ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]') : 'bg-white/10'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${password.length >= 6 ? (password.length < 10 ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]') : 'bg-white/10'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${password.length >= 10 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-white/10'}`} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold ml-1">{t.common.language}</label>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center space-x-2 p-3 rounded-xl border transition-all ${
                    language === lang.code 
                      ? 'bg-zenith-cyan/10 border-zenith-cyan text-white' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-[9px] font-bold uppercase tracking-tighter truncate">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-3 text-red-400 text-[10px] uppercase tracking-wider font-bold bg-red-400/10 p-4 rounded-2xl border border-red-400/20"
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:shadow-zenith-electric-blue/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <span>{isLogin ? t.common.initializeOS : t.common.register}</span>
            )}
          </button>
        </form>


        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase tracking-[0.4em]"><span className="bg-zenith-black px-4 text-white/20">{t.common.orContinueWith}</span></div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center space-x-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{t.common.googleNeuralLink}</span>
        </button>

        <div className="flex items-center justify-center space-x-2 text-white/20">
          <Shield size={12} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Criptografia de Ponta a Ponta</span>
        </div>
      </motion.div>
    </div>
  );
};
