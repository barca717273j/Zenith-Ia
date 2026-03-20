import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { LogIn, UserPlus, Globe, Mail, Lock, AlertTriangle, Sparkles, Shield } from 'lucide-react';
import { ZenithLogo } from './ZenithLogo';
import { useUser } from '../contexts/UserContext';
import { translations, Language } from '../translations';

export const Auth: React.FC = () => {
  const { refreshUserData } = useUser();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const t = translations[language];

  const handleLogin = async (email: string, password: string) => {
    console.log("Login clicked");
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("LOGIN ERROR:", error);
        if (error.message === 'Invalid login credentials') {
          setError('Credenciais inválidas. Verifique seu e-mail e senha ou crie uma conta se for novo.');
        } else {
          setError(error.message);
        }
        return;
      }

      console.log("USER LOGGED:", data.user);

      if (data.user) {
        await refreshUserData();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      return handleLogin(email, password);
    }
    
    setLoading(true);
    setError('');

    try {
      if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
      } else {
        // Register
        if (password !== confirmPassword) {
          setError(t.common.passwordsDoNotMatch);
          setLoading(false);
          return;
        }
        if (!username.trim()) {
          setError('Nome de usuário é obrigatório');
          setLoading(false);
          return;
        }
        if (!acceptTerms) {
          setError(t.common.mustAcceptTerms);
          setLoading(false);
          return;
        }

        const { data: { user }, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username.toLowerCase().trim(),
            }
          }
        });
        if (error) throw error;
        
        if (user) {
          // UserProvider handles profile creation via fetchUserData on auth change
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await refreshUserData();
          } else {
            setSuccess(true);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
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
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (authMode === 'forgot') return email.length > 0;
    if (authMode === 'login') return email.length > 0 && password.length >= 6;
    return (
      fullName.length > 0 &&
      username.length >= 3 &&
      email.length > 0 &&
      password.length >= 6 &&
      password === confirmPassword &&
      acceptTerms
    );
  };

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: '', color: 'bg-zenith-surface-2', text: '' };
    if (pass.length < 6) return { label: t.common.weak, color: 'bg-red-500 shadow-sm shadow-red-500/50', text: 'text-red-400' };
    if (pass.length < 10) return { label: t.common.medium, color: 'bg-orange-500 shadow-sm shadow-orange-500/50', text: 'text-orange-400' };
    return { label: t.common.strong, color: 'bg-green-500 shadow-sm shadow-green-500/50', text: 'text-green-400' };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zenith-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#111,0%,#000,100%)]" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zenith-crimson/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zenith-scarlet/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 space-y-8 relative z-10 glass-card border-zenith-border-primary bg-zenith-black/40 backdrop-blur-3xl rounded-3xl"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <ZenithLogo size={60} className="text-zenith-text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold tracking-tighter uppercase leading-none text-zenith-text-primary">Zenith</h1>
            <div className="flex items-center justify-center space-x-2 text-zenith-neon-red">
              <Sparkles size={12} />
              <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Life Operating System</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 bg-zenith-scarlet/20 rounded-full flex items-center justify-center mx-auto border border-zenith-scarlet/30 shadow-lg shadow-zenith-scarlet/20">
                <Sparkles className="text-zenith-scarlet w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zenith-text-primary uppercase tracking-tight">{t.common.accountCreated}</h2>
                <p className="text-zenith-text-secondary text-sm leading-relaxed">
                  {t.common.confirmationEmailSent}
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setAuthMode('login');
                }}
                className="w-full btn-secondary py-4 text-[10px] font-bold uppercase tracking-widest"
              >
                {t.common.backToLogin}
              </button>
            </motion.div>
          ) : resetSent ? (
            <motion.div
              key="reset-sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 bg-zenith-scarlet/20 rounded-full flex items-center justify-center mx-auto border border-zenith-scarlet/30 shadow-lg shadow-zenith-scarlet/20">
                <Mail className="text-zenith-scarlet w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zenith-text-primary uppercase tracking-tight">{t.common.emailSent}</h2>
                <p className="text-zenith-text-secondary text-sm leading-relaxed">
                  {t.common.resetLinkSent}
                </p>
              </div>
              <button
                onClick={() => {
                  setResetSent(false);
                  setAuthMode('login');
                }}
                className="w-full btn-secondary py-4 text-[10px] font-bold uppercase tracking-widest"
              >
                {t.common.backToLogin}
              </button>
            </motion.div>
          ) : authMode === 'forgot' ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold text-zenith-text-primary uppercase tracking-tight">{t.common.recoverPassword}</h2>
                <p className="text-zenith-text-tertiary text-[10px] uppercase tracking-widest font-bold">{t.common.enterEmailToReset}</p>
              </div>
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">{t.common.email}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-zenith-text-tertiary group-focus-within:text-zenith-neon-red transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-zenith-neon-red transition-all text-sm font-medium text-zenith-text-primary"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.common.sending}</span>
                    </div>
                  ) : (
                    <span>{t.common.recoverPassword}</span>
                  )}
                </button>
              </form>
              <div className="text-center">
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-[10px] text-zenith-text-tertiary hover:text-zenith-text-primary uppercase tracking-widest font-bold transition-colors"
                >
                  {t.common.backToLogin}
                </button>
              </div>
            </motion.div>
          ) : authMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">{t.common.email}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-zenith-text-tertiary group-focus-within:text-zenith-neon-red transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-zenith-neon-red transition-all text-sm font-medium text-zenith-text-primary"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">{t.common.password}</label>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('forgot')}
                      className="text-[9px] text-zenith-neon-red hover:underline uppercase tracking-widest font-bold"
                    >
                      {t.common.forgotPassword}
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-zenith-text-tertiary group-focus-within:text-zenith-neon-red transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-zenith-neon-red transition-all text-sm font-medium text-zenith-text-primary"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-zenith-text-tertiary hover:text-zenith-text-secondary transition-colors"
                    >
                      {showPassword ? <Shield size={18} /> : <Sparkles size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLogin(email, password)}
                  disabled={loading || !isFormValid()}
                  className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.common.entering}</span>
                    </div>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-[10px] text-zenith-text-tertiary hover:text-zenith-text-primary uppercase tracking-widest font-bold transition-colors"
                >
                  {t.common.dontHaveAccount}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">{t.common.fullName}</label>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-4 focus:outline-none focus:border-zenith-neon-red transition-all text-sm font-medium text-zenith-text-primary"
                    placeholder={t.common.fullNamePlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">Nome de Usuário</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-zenith-text-tertiary group-focus-within:text-zenith-neon-red transition-colors">
                      <span className="text-sm font-bold">@</span>
                    </div>
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:border-zenith-neon-red transition-all text-sm font-medium text-zenith-text-primary"
                      placeholder="ex: warrior_zenith"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">{t.common.email}</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-4 focus:outline-none focus:border-zenith-neon-red transition-all text-sm font-medium text-zenith-text-primary"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">{t.common.password}</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="new-password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 px-4 pr-12 focus:outline-none focus:border-zenith-neon-red transition-all text-sm font-medium text-zenith-text-primary"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-zenith-text-tertiary hover:text-zenith-text-secondary transition-colors"
                    >
                      {showPassword ? <Shield size={18} /> : <Sparkles size={18} />}
                    </button>
                  </div>
                  
                  {password.length > 0 && (
                    <div className="space-y-2 px-1">
                      <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-bold">
                        <span className="text-zenith-text-tertiary">{t.common.passwordStrength}</span>
                        <span className={strength.text}>{strength.label}</span>
                      </div>
                      <div className="flex space-x-1 h-1">
                        <div className={`flex-1 rounded-full transition-all duration-500 ${password.length > 0 ? strength.color : 'bg-zenith-surface-2'}`} />
                        <div className={`flex-1 rounded-full transition-all duration-500 ${password.length >= 6 ? strength.color : 'bg-zenith-surface-2'}`} />
                        <div className={`flex-1 rounded-full transition-all duration-500 ${password.length >= 10 ? strength.color : 'bg-zenith-surface-2'}`} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">{t.common.confirmPassword}</label>
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-zenith-surface-1 border rounded-2xl py-4 px-4 focus:outline-none transition-all text-sm font-medium text-zenith-text-primary ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-zenith-border-primary focus:border-zenith-neon-red'}`}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-3 py-2">
                  <div className="flex items-start space-x-3">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-zenith-border-primary bg-zenith-surface-1 text-zenith-crimson focus:ring-zenith-crimson"
                      />
                    </div>
                    <label htmlFor="terms" className="text-[9px] text-zenith-text-tertiary uppercase tracking-widest font-bold cursor-pointer hover:text-zenith-text-secondary transition-colors leading-relaxed">
                      {t.common.iAgreeTo} <a href="#" className="text-zenith-neon-red hover:underline">{t.common.termsOfUse}</a> {t.common.and} <a href="#" className="text-zenith-neon-red hover:underline">{t.common.privacyPolicy}</a>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.common.creatingAccount}</span>
                    </div>
                  ) : (
                    <span>{t.common.createAccount}</span>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-[10px] text-zenith-text-tertiary hover:text-zenith-text-primary uppercase tracking-widest font-bold transition-colors"
                >
                  {t.common.alreadyHaveAccount}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zenith-border-primary"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase tracking-[0.4em]"><span className="bg-zenith-black px-4 text-zenith-text-tertiary/20">{t.common.orContinueWith}</span></div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-zenith-surface-1 border border-zenith-border-primary py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zenith-surface-2 transition-all flex items-center justify-center space-x-4 text-zenith-text-primary"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{t.common.googleNeuralLink}</span>
        </button>

        <div className="flex items-center justify-center space-x-2 text-zenith-text-tertiary">
          <Shield size={12} />
          <span className="text-[8px] font-bold uppercase tracking-widest">{t.common.endToEndEncryption}</span>
        </div>
      </motion.div>
    </div>
  );
};
