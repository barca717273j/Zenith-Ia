import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Globe, Mail, Lock, AlertTriangle, Sparkles, Shield } from 'lucide-react';
import { ZenitLogo } from './ZenitLogo';
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
  const [showResend, setShowResend] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const t = translations[language] || translations['pt-BR'] || translations['en'];

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      setError('E-mail de confirmação reenviado! Verifique sua caixa de entrada.');
      setShowResend(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError('');
    setShowResend(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("LOGIN ERROR:", error);
        if (error.message === 'Invalid login credentials') {
          setError('E-mail ou senha incorretos. Por favor, verifique suas credenciais.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada.');
          setShowResend(true);
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        await refreshUserData();
      }
    } catch (err: any) {
      console.error("UNEXPECTED LOGIN ERROR:", err);
      setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      return handleLogin();
    }
    
    setLoading(true);
    setError('');

    try {
      if (authMode === 'forgot') {
        if (!email.trim()) {
          setError('Preencha o campo de e-mail');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        setResetSent(true);
      } else {
        // Register validation
        if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
          setError('Preencha todos os campos');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          setLoading(false);
          return;
        }
        if (!acceptTerms) {
          setError('Você deve aceitar os termos');
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
    if (authMode === 'login') return email.trim().length > 0 && password.trim().length >= 6;
    return (
      fullName.trim().length > 0 &&
      username.trim().length >= 3 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword &&
      acceptTerms
    );
  };

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: '', color: 'bg-zenit-surface-2', text: '' };
    if (pass.length < 6) return { label: t.common.weak, color: 'bg-red-500 shadow-sm shadow-red-500/50', text: 'text-red-400' };
    if (pass.length < 10) return { label: t.common.medium, color: 'bg-orange-500 shadow-sm shadow-orange-500/50', text: 'text-orange-400' };
    return { label: t.common.strong, color: 'bg-green-500 shadow-sm shadow-green-500/50', text: 'text-green-400' };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zenit-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-zenit-black">
        <div className="absolute inset-0 bg-fluid-marble opacity-50" />
        
        {/* Animated Marble Blobs */}
        <motion.div 
          animate={{ 
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="marble-blob w-[600px] h-[600px] bg-zenit-scarlet/20 -top-20 -left-20"
        />
        <motion.div 
          animate={{ 
            x: [0, -150, 100, 0],
            y: [0, 150, -100, 0],
            scale: [1, 0.9, 1.1, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="marble-blob w-[500px] h-[500px] bg-white/5 bottom-20 right-20"
        />
        
        {/* Grain Overlay for Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 space-y-8 relative z-10 premium-card border-zenit-border-primary bg-zenit-surface-1/40 backdrop-blur-3xl rounded-[32px] shadow-2xl"
      >
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative">
              <ZenitLogo size={70} className="text-zenit-text-primary relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-white blur-2xl -z-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-display font-bold tracking-tighter uppercase leading-none text-zenit-text-primary italic">ZENITH</h1>
            <div className="flex items-center justify-center space-x-3 text-zenit-accent">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Life Operating System</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-zenit-accent/10 border border-zenit-accent/20 flex items-start gap-3 mb-4 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-zenit-accent shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-zenit-accent/90 leading-relaxed font-bold">
                    {error}
                  </p>
                  {showResend && (
                    <button
                      onClick={handleResendConfirmation}
                      className="mt-2 text-[10px] font-black uppercase tracking-widest text-zenit-accent hover:text-white transition-colors underline underline-offset-4"
                    >
                      Reenviar e-mail de confirmação
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-8"
            >
              <div className="w-24 h-24 bg-zenit-accent/20 rounded-full flex items-center justify-center mx-auto border border-zenit-accent/30 shadow-[0_0_30px_var(--accent-glow)]">
                <Sparkles className="text-zenit-accent w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-zenit-text-primary uppercase tracking-tight italic">{t.common.accountCreated}</h2>
                <p className="text-zenit-text-secondary text-sm leading-relaxed font-medium">
                  {t.common.confirmationEmailSent}
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setAuthMode('login');
                }}
                className="w-full bg-zenit-surface-2 border border-zenit-border-primary py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-zenit-surface-3 transition-all"
              >
                {t.common.backToLogin}
              </button>
            </motion.div>
          ) : resetSent ? (
            <motion.div
              key="reset-sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-8"
            >
              <div className="w-24 h-24 bg-zenit-accent/20 rounded-full flex items-center justify-center mx-auto border border-zenit-accent/30 shadow-[0_0_30px_var(--accent-glow)]">
                <Mail className="text-zenit-accent w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-zenit-text-primary uppercase tracking-tight italic">{t.common.emailSent}</h2>
                <p className="text-zenit-text-secondary text-sm leading-relaxed font-medium">
                  {t.common.resetLinkSent}
                </p>
              </div>
              <button
                onClick={() => {
                  setResetSent(false);
                  setAuthMode('login');
                }}
                className="w-full bg-zenit-surface-2 border border-zenit-border-primary py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-zenit-surface-3 transition-all"
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
              className="space-y-8"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-zenit-text-primary uppercase tracking-tight italic">{t.common.recoverPassword}</h2>
                <p className="text-zenit-text-tertiary text-[10px] uppercase tracking-[0.3em] font-black">{t.common.enterEmailToReset}</p>
              </div>
              <form onSubmit={handleAuth} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.email}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center text-zenit-text-tertiary group-focus-within:text-zenit-accent transition-colors">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:border-zenit-accent transition-all text-sm font-bold text-zenit-text-primary shadow-inner"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="w-full neon-button py-5 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  className="text-[10px] text-zenit-text-tertiary hover:text-zenit-text-primary uppercase tracking-[0.3em] font-black transition-colors"
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
              className="space-y-8"
            >
              <form onSubmit={handleAuth} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.email}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center text-zenit-text-tertiary group-focus-within:text-zenit-accent transition-colors">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-5 pl-14 pr-5 focus:outline-none focus:border-zenit-accent transition-all text-sm font-bold text-zenit-text-primary shadow-inner"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.password}</label>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] text-zenit-accent hover:text-white uppercase tracking-widest font-black transition-colors"
                    >
                      {t.common.forgotPassword}
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center text-zenit-text-tertiary group-focus-within:text-zenit-accent transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-5 pl-14 pr-14 focus:outline-none focus:border-zenit-accent transition-all text-sm font-bold text-zenit-text-primary shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-5 flex items-center text-zenit-text-tertiary hover:text-zenit-accent transition-colors"
                    >
                      {showPassword ? <Shield size={20} /> : <Sparkles size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-zenit-border-primary bg-zenit-surface-2 text-zenit-accent focus:ring-zenit-accent transition-all"
                    />
                    <label htmlFor="remember" className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-black cursor-pointer hover:text-zenit-text-secondary transition-colors">
                      Lembrar de mim
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full neon-button py-5 text-[11px] font-black uppercase tracking-[0.4em] disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.common.entering}</span>
                    </div>
                  ) : (
                    <span>Acessar Núcleo</span>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-[10px] text-zenit-text-tertiary hover:text-zenit-text-primary uppercase tracking-[0.3em] font-black transition-colors"
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
              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.fullName}</label>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-5 px-6 focus:outline-none focus:border-zenit-accent transition-all text-sm font-bold text-zenit-text-primary shadow-inner"
                    placeholder={t.common.fullNamePlaceholder}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.username}</label>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-5 px-6 focus:outline-none focus:border-zenit-accent transition-all text-sm font-bold text-zenit-text-primary shadow-inner"
                    placeholder="username_neural"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.email}</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-5 px-6 focus:outline-none focus:border-zenit-accent transition-all text-sm font-bold text-zenit-text-primary shadow-inner"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.password}</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="new-password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zenit-surface-2 border border-zenit-border-primary rounded-2xl py-5 px-6 pr-14 focus:outline-none focus:border-zenit-accent transition-all text-sm font-bold text-zenit-text-primary shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-5 flex items-center text-zenit-text-tertiary hover:text-zenit-accent transition-colors"
                    >
                      {showPassword ? <Shield size={20} /> : <Sparkles size={20} />}
                    </button>
                  </div>
                  
                  {password.length > 0 && (
                    <div className="space-y-2.5 px-1">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-black">
                        <span className="text-zenit-text-tertiary">{t.common.passwordStrength}</span>
                        <span className={strength.text}>{strength.label}</span>
                      </div>
                      <div className="flex space-x-1.5 h-1.5">
                        <div className={`flex-1 rounded-full transition-all duration-500 ${password.length > 0 ? strength.color : 'bg-zenit-surface-3'}`} />
                        <div className={`flex-1 rounded-full transition-all duration-500 ${password.length >= 6 ? strength.color : 'bg-zenit-surface-3'}`} />
                        <div className={`flex-1 rounded-full transition-all duration-500 ${password.length >= 10 ? strength.color : 'bg-zenit-surface-3'}`} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-black ml-1">{t.common.confirmPassword}</label>
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-zenit-surface-2 border rounded-2xl py-5 px-6 focus:outline-none transition-all text-sm font-bold text-zenit-text-primary shadow-inner ${password && confirmPassword && password !== confirmPassword ? 'border-zenit-accent' : 'border-zenit-border-primary focus:border-zenit-accent'}`}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-4 py-2">
                  <div className="flex items-start space-x-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-5 h-5 rounded border-zenit-border-primary bg-zenit-surface-2 text-zenit-accent focus:ring-zenit-accent transition-all"
                      />
                    </div>
                    <label htmlFor="terms" className="text-[10px] text-zenit-text-tertiary uppercase tracking-widest font-black cursor-pointer hover:text-zenit-text-secondary transition-colors leading-relaxed">
                      {t.common.iAgreeTo} <a href="#" className="text-zenit-accent hover:text-white transition-colors underline underline-offset-4">{t.common.termsOfUse}</a> {t.common.and} <a href="#" className="text-zenit-accent hover:text-white transition-colors underline underline-offset-4">{t.common.privacyPolicy}</a>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full neon-button py-5 text-[11px] font-black uppercase tracking-[0.4em] disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.common.creatingAccount}</span>
                    </div>
                  ) : (
                    <span>Iniciar Jornada</span>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-[10px] text-zenit-text-tertiary hover:text-zenit-text-primary uppercase tracking-[0.3em] font-black transition-colors"
                >
                  {t.common.alreadyHaveAccount}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zenit-border-primary opacity-50"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.5em] font-black"><span className="bg-zenit-black px-6 text-zenit-text-tertiary/40">{t.common.orContinueWith}</span></div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-zenit-surface-2 border border-zenit-border-primary py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-zenit-surface-3 hover:border-zenit-accent/30 transition-all flex items-center justify-center space-x-5 text-zenit-text-primary shadow-lg"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Neural Link Google</span>
        </button>

        <div className="flex items-center justify-center space-x-3 text-zenit-text-tertiary opacity-60">
          <Shield size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest">{t.common.endToEndEncryption}</span>
        </div>
      </motion.div>
    </div>
  );
};
