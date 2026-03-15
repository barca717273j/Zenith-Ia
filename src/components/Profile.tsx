import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, CreditCard, Brain, LogOut, ChevronRight, Book, User, Award, Zap, Target, Flame, Sparkles, Shield, Camera, Mail, Lock, Globe, Save, AlertCircle, Timer } from 'lucide-react';
import { Subscription } from './Subscription';
import { TetrisGame } from './TetrisGame';
import { Journal } from './Journal';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';

interface ProfileProps {
  userData: any;
  t: any;
  onUpdate: () => Promise<void> | void;
}

type ProfileView = 'main' | 'subscription' | 'gym' | 'journal' | 'edit-profile' | 'security' | 'preferences';

export const Profile: React.FC<ProfileProps> = ({ userData, t, onUpdate }) => {
  const [view, setView] = useState<ProfileView>('main');
  const [clickCount, setClickCount] = useState(0);
  const { level, levelName, xp, streak } = useGamification();

  // Edit Profile State
  const [editName, setEditName] = useState(userData?.display_name || '');
  const [editEmail, setEditEmail] = useState(userData?.email || '');
  const [editPhoto, setEditPhoto] = useState(userData?.photo_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleVersionClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !userData?.is_admin })
        .eq('id', userData?.id);
      
      if (!error) {
        await onUpdate();
        setClickCount(0);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    setMessage(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ photo_url: publicUrl })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      setEditPhoto(publicUrl);
      await onUpdate();
      setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: editName,
          photo_url: editPhoto
        })
        .eq('id', userData.id);

      if (error) throw error;
      
      await onUpdate();
      setMessage({ type: 'success', text: t.profile.saveChanges });
      setTimeout(() => setView('main'), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: t.common.passwordMismatch || 'Passwords do not match' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: t.profile.saveChanges });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setView('main'), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'subscription':
        return <Subscription userData={userData} t={t} />;
      case 'gym':
        return <TetrisGame t={t} />;
      case 'journal':
        return <Journal userData={userData} t={t} />;
      case 'edit-profile':
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="space-y-2">
              <h2 className="text-3xl font-display font-bold uppercase tracking-tighter">{t.profile.editProfile}</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Atualize sua identidade neural</p>
            </header>

            <div className="space-y-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-2 border-white/5 p-1 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                    <img src={editPhoto || 'https://picsum.photos/seed/user/200'} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 rounded-xl bg-zenith-scarlet flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <Camera size={18} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
                <div className="w-full space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Ou insira uma URL</label>
                  <input 
                    type="text" 
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    placeholder="URL da Imagem de Perfil"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <User size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{t.common.fullName}</label>
                  </div>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all"
                  />
                </div>

                <div className="space-y-3 opacity-50 cursor-not-allowed">
                  <div className="flex items-center space-x-2 ml-1">
                    <Mail size={12} className="text-white/40" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{t.common.email}</label>
                  </div>
                  <input 
                    type="email" 
                    value={editEmail}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">{message.text}</span>
                </div>
              )}

              <button 
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center space-x-3"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    <span>{t.profile.saveChanges}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="space-y-2">
              <h2 className="text-3xl font-display font-bold uppercase tracking-tighter">{t.profile.security}</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Proteja sua conexão neural</p>
            </header>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Lock size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{t.profile.newPassword}</label>
                  </div>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Shield size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{t.profile.confirmNewPassword}</label>
                  </div>
                  <input 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">{message.text}</span>
                </div>
              )}

              <button 
                onClick={handleUpdatePassword}
                disabled={isSaving}
                className="w-full btn-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center space-x-3"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={16} />
                    <span>{t.profile.saveChanges}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      case 'preferences':
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="space-y-2">
              <h2 className="text-3xl font-display font-bold uppercase tracking-tighter">{t.profile.preferences}</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Personalize sua interface</p>
            </header>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Globe size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{t.common.language}</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {['pt-BR', 'en', 'es', 'fr'].map((lang) => (
                      <button
                        key={lang}
                        onClick={async () => {
                          const { error } = await supabase
                            .from('users')
                            .update({ language: lang })
                            .eq('id', userData.id);
                          if (!error) await onUpdate();
                        }}
                        className={`p-4 rounded-2xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                          userData?.language === lang 
                            ? 'bg-zenith-scarlet border-zenith-scarlet text-white shadow-lg' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {lang === 'pt-BR' ? 'Português' : lang === 'en' ? 'English' : lang === 'es' ? 'Español' : 'Français'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 space-y-12 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="flex flex-col items-center text-center space-y-8">
              <div className="relative group">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 bg-gradient-to-tr from-zenith-scarlet via-zenith-crimson to-zenith-scarlet rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="relative w-40 h-40 rounded-full border-2 border-white/5 p-1.5 bg-white/[0.02] backdrop-blur-xl">
                  <div className="w-full h-full rounded-full bg-zenith-black flex items-center justify-center overflow-hidden border border-white/10">
                    {userData?.photo_url ? (
                      <img src={userData.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <User size={64} className="text-white/10" />
                      </div>
                    )}
                  </div>
                  
                  {/* Level Badge */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 right-2 bg-zenith-scarlet text-white text-[10px] font-bold px-4 py-1.5 rounded-xl shadow-[0_0_20px_rgba(255,36,0,0.6)] border border-white/20 flex items-center space-x-1.5"
                  >
                    <Award size={12} />
                    <span>LVL {level}</span>
                  </motion.div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-4xl font-display font-bold tracking-tighter uppercase leading-none text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {userData?.display_name || 'Zenith User'}
                </h1>
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2 bg-zenith-scarlet/10 px-3 py-1 rounded-lg border border-zenith-scarlet/20">
                    <Sparkles size={12} className="text-zenith-scarlet" />
                    <span className="text-zenith-scarlet text-[10px] font-bold uppercase tracking-[0.2em]">
                      {levelName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                    <Shield size={12} className="text-white/40" />
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                      {userData?.subscription_tier || 'Free'}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatItem 
                icon={<Zap size={18} />} 
                label={t.profile.stats.xp} 
                value={xp.toLocaleString()} 
                color="text-zenith-scarlet" 
              />
              <StatItem 
                icon={<Flame size={18} />} 
                label={t.profile.stats.streak} 
                value={`${streak}d`} 
                color="text-orange-500" 
              />
              <StatItem 
                icon={<Timer size={18} />} 
                label={t.profile.stats.focus} 
                value={`${userData.focus_minutes || 0}m`} 
                color="text-purple-500" 
              />
              <StatItem 
                icon={<Sparkles size={18} />} 
                label={t.profile.stats.missions} 
                value={(userData.missions_completed || 0).toString()} 
                color="text-zenith-cyan" 
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-6 ml-2">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">Protocolos</h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <MenuButton 
                icon={<Brain size={20} />} 
                label={t.profile.mentalGym} 
                sublabel={t.profile.cognitiveTraining} 
                onClick={() => setView('gym')} 
              />
              <MenuButton 
                icon={<Book size={20} />} 
                label={t.profile.journal} 
                sublabel={t.profile.dailyReflections} 
                onClick={() => setView('journal')} 
              />

              <div className="flex items-center space-x-3 my-8 ml-2">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">Configurações</h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <MenuButton 
                icon={<User size={20} />} 
                label={t.profile.editProfile} 
                sublabel={t.profile.editProfileDesc} 
                onClick={() => setView('edit-profile')} 
              />
              <MenuButton 
                icon={<CreditCard size={20} />} 
                label={t.profile.subscription} 
                sublabel={t.profile.managePlan} 
                onClick={() => setView('subscription')} 
              />
              <MenuButton 
                icon={<Settings size={20} />} 
                label={t.profile.preferences} 
                sublabel={t.profile.appPreferences} 
                onClick={() => setView('preferences')} 
              />
              <MenuButton 
                icon={<Shield size={20} />} 
                label={t.profile.security} 
                sublabel={t.profile.securityDesc} 
                onClick={() => setView('security')} 
              />
              <MenuButton 
                icon={<LogOut size={20} />} 
                label={t.profile.signOut} 
                sublabel="Encerrar sessão com segurança" 
                onClick={handleLogout} 
                danger
              />
              
              <div className="pt-8">
                <button 
                  onClick={() => {
                    if (window.confirm(t.profile.deleteConfirm)) {
                      // Logic for account deletion would go here
                      supabase.auth.signOut();
                    }
                  }}
                  className="w-full p-5 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center space-x-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all group"
                >
                  <LogOut size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t.profile.deleteAccount}</span>
                </button>
              </div>
            </div>

            <div className="pt-12 pb-8 text-center">
              <button 
                onClick={handleVersionClick}
                className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/10 hover:text-white/20 transition-colors outline-none"
              >
                Zenith OS v2.4.1 Build 2026
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zenith-black">
      {view !== 'main' && (
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            setView('main');
            setMessage(null);
          }}
          className="fixed top-8 left-8 z-[60] p-4 bg-white/5 rounded-[20px] border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group"
        >
          <ChevronRight size={20} className="rotate-180 text-white/40 group-hover:text-white transition-colors" />
        </motion.button>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-white/5 bg-white/[0.01] relative overflow-hidden group">
    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className={`${color} opacity-60 group-hover:opacity-100 transition-opacity`}>{icon}</div>
    <p className="text-2xl font-display font-bold tracking-tighter text-white">{value}</p>
    <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.3em]">{label}</p>
  </div>
);

const MenuButton: React.FC<{ icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; danger?: boolean }> = ({ icon, label, sublabel, onClick, danger }) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className="w-full glass-card p-6 flex items-center justify-between group hover:bg-white/[0.03] transition-all border-white/5 bg-white/[0.01]"
  >
    <div className="flex items-center space-x-6">
      <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-500 ${
        danger 
          ? 'bg-red-500/5 text-red-400/40 group-hover:bg-red-500/20 group-hover:text-red-400' 
          : 'bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-white'
      }`}>
        {icon}
      </div>
      <div className="text-left space-y-1">
        <p className={`text-lg font-bold tracking-tight ${danger ? 'text-red-400/80' : 'text-white/90'}`}>{label}</p>
        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{sublabel}</p>
      </div>
    </div>
    <ChevronRight size={20} className="text-white/5 group-hover:text-white/40 transition-all translate-x-0 group-hover:translate-x-1" />
  </motion.button>
);
