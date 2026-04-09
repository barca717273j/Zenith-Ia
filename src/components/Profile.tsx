import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { Settings, CreditCard, Brain, LogOut, ChevronRight, Book, User, Award, Zap, Target, Flame, Sparkles, Shield, Camera, Mail, Lock, Globe, Save, AlertCircle, Timer, Grid, Heart, MessageSquare, Send, Loader2, X, Moon, Sun } from 'lucide-react';
import { Subscription } from './Subscription';
import { TetrisGame } from './TetrisGame';
import { Journal } from './Journal';
import { useGamification } from './GamificationContext';
import { supabase } from '../lib/supabase';
import { uploadAvatar } from '../services/profileService';
import { useUser } from '../contexts/UserContext';
import { ensureBucketExists } from '../services/storageService';

interface ProfileProps {
  t: any;
  targetUserId?: string;
  setActiveTab?: (tab: string) => void;
}

type ProfileView = 'main' | 'subscription' | 'gym' | 'journal' | 'edit-profile' | 'security' | 'preferences' | 'followers' | 'following';

export const Profile: React.FC<ProfileProps> = ({ t, targetUserId, setActiveTab }) => {
  const { user: authUser, userData, refreshUserData } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<ProfileView>('main');
  const [clickCount, setClickCount] = useState(0);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const { level, levelName, xp, streak } = useGamification();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followList, setFollowList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const isOwnProfile = !targetUserId || targetUserId === userData?.id;
  const currentProfileId = targetUserId || userData?.id;

  // Edit Profile State
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0, posts: 0 });

  useEffect(() => {
    if (currentProfileId) {
      const loadAll = async () => {
        setLoading(true);
        await Promise.all([
          fetchProfileData(),
          fetchPosts(),
          fetchSocialStats(),
          !isOwnProfile ? checkFollowStatus() : Promise.resolve()
        ]);
        setLoading(false);
      };
      loadAll();
    } else {
      setLoading(false);
    }
  }, [currentProfileId, userData?.id]);

  // Sync edit state with userData
  useEffect(() => {
    if (userData && isOwnProfile) {
      setEditName(userData.full_name || userData.display_name || '');
      setEditUsername(userData.username || '');
      setEditBio(userData.bio || '');
      setEditEmail(userData.email || '');
      setEditPhoto(userData.avatar_url || userData.photo_url || '');
      
      // Also update targetUser if it's the own profile to ensure immediate re-render
      setTargetUser(userData);
    }
  }, [userData, isOwnProfile]);

  const fetchProfileData = async () => {
    if (isOwnProfile) {
      setTargetUser(userData);
      return;
    }
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentProfileId)
        .single();
      if (data) setTargetUser(data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        user:users (
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('user_id', currentProfileId)
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const checkFollowStatus = async () => {
    if (!userData?.id) return;
    const { data } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', userData.id)
      .eq('following_id', currentProfileId)
      .single();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!userData?.id) return;
    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', userData.id)
        .eq('following_id', currentProfileId);
    } else {
      await supabase
        .from('followers')
        .insert([{ follower_id: userData.id, following_id: currentProfileId }]);
      
      // Notification
      await supabase.from('notifications').insert([{
        user_id: currentProfileId,
        title: 'Novo Seguidor!',
        message: `${userData.display_name} começou a seguir você.`,
        type: 'social'
      }]);
    }
    setIsFollowing(!isFollowing);
    fetchSocialStats();
  };

  const fetchFollowers = async () => {
    const { data } = await supabase
      .from('followers')
      .select('follower:users!followers_follower_id_fkey(*)')
      .eq('following_id', currentProfileId);
    if (data) setFollowList(data.map((f: any) => f.follower));
    setView('followers');
  };

  const fetchFollowing = async () => {
    const { data } = await supabase
      .from('followers')
      .select('following:users!followers_following_id_fkey(*)')
      .eq('follower_id', currentProfileId);
    if (data) setFollowList(data.map((f: any) => f.following));
    setView('following');
  };

  const fetchSocialStats = async () => {
    try {
      const [followersCount, followingCount, postsCount] = await Promise.all([
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', currentProfileId),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', currentProfileId),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', currentProfileId)
      ]);

      setSocialStats({
        followers: followersCount.count || 0,
        following: followingCount.count || 0,
        posts: postsCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching social stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handlePhotoClick = () => {
    if (!isOwnProfile) return;
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount === 7) {
      setIsAdminPasswordModalOpen(true);
      setClickCount(0);
    }
    
    // Reset count after 3 seconds of inactivity
    setTimeout(() => setClickCount(0), 3000);
  };

  const handleAdminAuth = async () => {
    // Secret password for admin access
    if (adminPassword === 'zenit2024') {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', userData?.id);
      
      if (!error) {
        await refreshUserData();
        setIsAdminPasswordModalOpen(false);
        setAdminPassword('');
        setAdminError('');
        setMessage({ type: 'success', text: t.profile.adminAuthSuccess });
      }
    } else {
      setAdminError(t.profile.invalidAdminKey);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Image Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Formato inválido. Use JPG, PNG ou WEBP.' });
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Arquivo muito grande. Limite de 2MB.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const { data: userDataAuth } = await supabase.auth.getUser();
      const user = userDataAuth.user || authUser || userData;
      if (!user?.id) throw new Error("User not authenticated");

      // Ensure bucket exists
      await ensureBucketExists('avatars');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: urlData.publicUrl,
          photo_url: urlData.publicUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setEditPhoto(urlData.publicUrl);
      await refreshUserData();
      setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' });
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData?.id) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editName,
          display_name: editName,
          username: editUsername,
          bio: editBio,
          avatar_url: editPhoto,
          photo_url: editPhoto
        })
        .eq('id', userData.id);

      if (error) throw error;
      
      await refreshUserData();
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
        return <Subscription t={t} />;
      case 'gym':
        return <TetrisGame t={t} />;
      case 'journal':
        return <Journal t={t} />;
      case 'edit-profile':
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-zenit-accent/5 rounded-full blur-[120px] pointer-events-none" />
            
            <header className="relative space-y-4 mb-12">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zenit-accent to-zenit-crimson flex items-center justify-center"
                >
                  <User size={22} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary italic leading-none">
                    {t.profile.editProfile.split(' ')[0]} <span className="text-zenit-accent">{t.profile.editProfile.split(' ')[1]}</span>
                  </h2>
                  <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold mt-2 ml-1">{t.profile.neuralSync}</p>
                </div>
              </div>
            </header>

            <div className="premium-card p-8 sm:p-10 space-y-12 relative overflow-visible">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-8">
                <div className="relative group">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-zenit-accent via-zenit-crimson to-transparent animate-spin-slow"
                    style={{ animationDuration: '12s' }}
                  >
                    <div className="w-full h-full rounded-full bg-zenit-black p-1.5">
                      <img 
                        src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.id}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-full" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                  
                  <label className="absolute -bottom-2 -right-2 w-14 h-14 rounded-2xl bg-zenit-accent flex items-center justify-center border-4 border-zenit-black cursor-pointer hover:scale-110 transition-all active:scale-95">
                    <Camera size={24} className="text-white" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 rounded-tl-xl" />
                  <div className="absolute -bottom-4 -right-4 w-8 h-8 rounded-br-xl" />
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.profile.imageUrl}</label>
                    <Sparkles size={12} className="text-zenit-accent animate-pulse" />
                  </div>
                  <input 
                    type="text" 
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full bg-[#1A1A1A] rounded-2xl px-8 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-zenit-accent/30 transition-all placeholder:text-zenit-text-tertiary/20 text-zenit-text-primary"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 ml-1">
                      <User size={12} className="text-zenit-accent" />
                      <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.common.fullName}</label>
                    </div>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#1A1A1A] rounded-2xl px-8 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-zenit-accent/30 transition-all text-zenit-text-primary"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 ml-1">
                      <Globe size={12} className="text-zenit-accent" />
                      <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.profile.username}</label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-zenit-accent font-bold text-sm">@</span>
                      <input 
                        type="text" 
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="username"
                        className="w-full bg-[#1A1A1A] rounded-2xl pl-12 pr-8 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-zenit-accent/30 transition-all text-zenit-text-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Book size={12} className="text-zenit-accent" />
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.profile.bio}</label>
                  </div>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder={t.profile.bioPlaceholder}
                    className="w-full bg-[#1A1A1A] rounded-3xl px-8 py-6 text-sm focus:outline-none focus:ring-1 focus:ring-zenit-accent/30 transition-all min-h-[140px] resize-none text-zenit-text-primary placeholder:text-zenit-text-tertiary/20"
                  />
                </div>

                <div className="space-y-3 opacity-60 group">
                  <div className="flex items-center space-x-2 ml-1">
                    <Mail size={12} className="text-zenit-text-tertiary" />
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.common.email}</label>
                  </div>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={editEmail}
                      disabled
                      className="w-full bg-black/40 rounded-2xl px-8 py-5 text-sm text-zenit-text-tertiary cursor-not-allowed"
                    />
                    <Lock size={14} className="absolute right-8 top-1/2 -translate-y-1/2 text-zenit-text-tertiary/30" />
                  </div>
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-3xl flex flex-col space-y-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      <AlertCircle size={20} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest leading-tight">{message.text}</span>
                  </div>
                  {message.text.includes('avatars') && message.type === 'error' && (
                    <button 
                      onClick={() => {
                        const sql = `INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);`;
                        navigator.clipboard.writeText(sql);
                        alert('SQL copiado! Cole no SQL Editor do seu Supabase e execute.');
                      }}
                      className="text-[10px] font-bold uppercase tracking-[0.3em] bg-zenit-accent text-white px-6 py-4 rounded-2xl hover:brightness-110 transition-all self-start"
                    >
                      Corrigir Bucket (Copiar SQL)
                    </button>
                  )}
                </motion.div>
              )}

              <div className="pt-4">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-zenit-accent to-zenit-crimson text-white text-[12px] font-bold uppercase tracking-[0.5em] flex items-center justify-center space-x-4 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Salvar Protocolo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-zenit-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <header className="relative space-y-4 mb-12">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zenit-accent to-zenit-crimson flex items-center justify-center"
                >
                  <Shield size={22} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary italic leading-none">
                    {t.profile.security.split(' ')[0]} <span className="text-zenit-accent">{t.profile.security.split(' ')[1]}</span>
                  </h2>
                  <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold mt-2 ml-1">{t.profile.encryption}</p>
                </div>
              </div>
            </header>

            <div className="premium-card p-8 sm:p-10 space-y-12 relative">
              <div className="flex flex-col items-center space-y-6 py-4">
                <div className="w-24 h-24 rounded-[2rem] bg-zenit-accent/10 flex items-center justify-center relative">
                  <Lock size={40} className="text-zenit-accent" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-zenit-accent rounded-[2rem] blur-xl"
                  />
                </div>
                <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold text-center max-w-[200px]">{t.profile.securityDesc}</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Lock size={12} className="text-zenit-accent" />
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.profile.newPassword}</label>
                  </div>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1A1A1A] rounded-2xl px-8 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-zenit-accent/30 transition-all text-zenit-text-primary placeholder:text-zenit-text-tertiary/20"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Shield size={12} className="text-zenit-accent" />
                    <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.profile.confirmNewPassword}</label>
                  </div>
                  <input 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1A1A1A] rounded-2xl px-8 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-zenit-accent/30 transition-all text-zenit-text-primary placeholder:text-zenit-text-tertiary/20"
                  />
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-3xl flex items-center space-x-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    <AlertCircle size={20} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest leading-tight">{message.text}</span>
                </motion.div>
              )}

              <div className="pt-4">
                <button 
                  onClick={handleUpdatePassword}
                  disabled={isSaving}
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-zenit-accent to-zenit-crimson text-white text-[12px] font-bold uppercase tracking-[0.5em] flex items-center justify-center space-x-4 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Lock size={20} />
                      <span>Atualizar Chave</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      case 'preferences':
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-zenit-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <header className="relative space-y-4 mb-12">
              <div className="flex items-center space-x-4">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zenit-accent to-zenit-crimson flex items-center justify-center"
                >
                  <Settings size={22} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary italic leading-none">
                    {t.profile.preferences.split(' ')[0]} <span className="text-zenit-accent">{t.profile.preferences.split(' ')[1]}</span>
                  </h2>
                  <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold mt-2 ml-1">{t.profile.personalization}</p>
                </div>
              </div>
            </header>

            <div className="premium-card p-8 sm:p-10 space-y-12 relative">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 ml-1">
                      <Globe size={12} className="text-zenit-accent" />
                      <label className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.common.language}</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {['pt-BR', 'en', 'es', 'fr'].map((lang) => (
                        <button
                          key={lang}
                          onClick={async () => {
                            if (!userData?.id) return;
                            const { error } = await supabase
                              .from('users')
                              .update({ language: lang })
                              .eq('id', userData.id);
                            if (!error) await refreshUserData();
                          }}
                          className={`p-6 rounded-2xl transition-all text-[11px] font-bold uppercase tracking-[0.3em] relative overflow-hidden group ${
                            userData?.language === lang 
                              ? 'bg-zenit-accent text-white' 
                              : 'bg-[#1A1A1A] text-zenit-text-tertiary hover:text-zenit-text-primary'
                          }`}
                        >
                          {userData?.language === lang && (
                            <motion.div 
                              layoutId="active-lang"
                              className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"
                            />
                          )}
                          <span className="relative z-10">
                            {lang === 'pt-BR' ? 'Português' : lang === 'en' ? 'English' : lang === 'es' ? 'Español' : 'Français'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-[#1A1A1A]">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-zenit-accent/10 flex items-center justify-center">
                          {theme === 'dark' ? <Moon size={18} className="text-zenit-accent" /> : <Sun size={18} className="text-zenit-accent" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zenit-text-primary">{t.profile.displayMode}</p>
                          <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-widest mt-1">{theme === 'dark' ? t.profile.darkMode : t.profile.lightMode}</p>
                        </div>
                      </div>
                      <button 
                        onClick={toggleTheme}
                        className="w-14 h-8 rounded-full bg-black relative p-1 transition-all"
                      >
                        <motion.div 
                          animate={{ x: theme === 'dark' ? 24 : 0 }}
                          className="w-6 h-6 rounded-full bg-zenit-accent"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'followers':
      case 'following':
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen relative">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-zenit-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <header className="relative flex items-center space-x-6 mb-12">
              <button 
                onClick={() => setView('main')} 
                className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-90"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <div>
                <h2 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary italic leading-none">
                  {view === 'followers' ? t.profile.followers : t.profile.following}
                </h2>
                <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold mt-2 ml-1">{t.profile.neuralNetwork}</p>
              </div>
            </header>

            <div className="premium-card p-4 sm:p-6 space-y-4 relative">
              {followList.map((user, idx) => (
                <motion.div 
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 flex items-center justify-between rounded-3xl bg-black/20 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-zenit-accent to-zenit-crimson group-hover:scale-105 transition-transform">
                        <img 
                          src={user.avatar_url || user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                          className="w-full h-full rounded-full border-2 border-zenit-black object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-zenit-black" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zenit-text-primary group-hover:text-zenit-accent transition-colors">{user.display_name}</p>
                      <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-bold mt-0.5">@{user.username || 'user'}</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 rounded-2xl bg-[#1A1A1A] text-[10px] font-bold uppercase tracking-[0.2em] text-zenit-text-secondary hover:bg-zenit-accent hover:text-white transition-all active:scale-95">
                    {t.profile.follow}
                  </button>
                </motion.div>
              ))}
              {followList.length === 0 && (
                <div className="text-center py-32 space-y-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-[#1A1A1A]">
                    <User size={32} className="text-zenit-text-tertiary/20" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold">{t.profile.noConnections}</p>
                    <p className="text-[9px] text-zenit-text-tertiary/50 uppercase tracking-[0.2em]">{t.profile.expansion}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        if (loading) return <div className="flex items-center justify-center min-h-screen bg-zenit-black"><div className="w-8 h-8 border-2 border-zenit-scarlet border-t-transparent rounded-full animate-spin" /></div>;
        return (
          <div className="pb-32 max-w-2xl mx-auto min-h-screen bg-zenit-black relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-zenit-accent/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-zenit-crimson/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Admin Password Modal */}
            <AnimatePresence>
              {isAdminPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAdminPasswordModalOpen(false)}
                    className="absolute inset-0 bg-zenit-black/90 backdrop-blur-xl"
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md rounded-3xl p-8 bg-zenit-surface-1/80"
                  >
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-zenit-accent/10 flex items-center justify-center">
                        <Shield size={32} className="text-zenit-accent" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary italic">{t.profile.restrictedAccess.split(' ')[0]} <span className="text-zenit-accent">{t.profile.restrictedAccess.split(' ')[1]}</span></h3>
                        <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.profile.encryptionKey}</p>
                      </div>
                      
                      <div className="w-full space-y-4">
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-zenit-surface-2/50 rounded-2xl px-8 py-5 text-center text-xl tracking-[0.5em] focus:outline-none transition-all text-zenit-text-primary"
                          autoFocus
                        />
                        {adminError && (
                          <p className="text-[10px] text-zenit-accent font-bold uppercase tracking-widest">{adminError}</p>
                        )}
                      </div>

                      <div className="flex w-full gap-4">
                        <button
                          onClick={() => setIsAdminPasswordModalOpen(false)}
                          className="flex-1 py-4 rounded-xl bg-zenit-surface-2 text-[10px] font-bold uppercase tracking-widest text-zenit-text-tertiary hover:text-zenit-text-primary transition-all"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          onClick={handleAdminAuth}
                          className="flex-1 py-4 rounded-xl bg-zenit-accent text-white text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                        >
                          {t.profile.authenticate}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Premium Profile Header */}
            <div className="p-8 space-y-8 relative z-10">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Large Profile Pic */}
                <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full relative"
                  >
                    {/* Rotating Border Effect */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full"
                    />
                    
                    <div className="w-full h-full rounded-full bg-zenit-black relative z-10">
                      <img 
                        src={targetUser?.avatar_url || targetUser?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser?.id}`} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-zenit-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#1A1A1A] rounded-full z-20">
                    <span className="text-[10px] font-bold text-zenit-accent uppercase tracking-[0.2em]">LVL {level}</span>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-3">
                  <h1 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenit-text-primary">
                    {targetUser?.full_name || targetUser?.display_name || 'Usuário Zenit'}
                  </h1>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zenit-accent animate-pulse" />
                    <p className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em]">@{targetUser?.username || 'zenit_user'}</p>
                  </div>
                  {targetUser?.bio && (
                    <p className="text-sm text-zenit-text-secondary leading-relaxed max-w-md mx-auto mt-4 font-light italic opacity-80">
                      "{targetUser.bio}"
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="flex items-center justify-center space-x-12 pt-6">
                  <div className="text-center group cursor-default">
                    <p className="text-2xl font-display font-bold text-zenit-text-primary tracking-tighter group-hover:text-zenit-accent transition-colors">{socialStats.posts}</p>
                    <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold mt-1">{t.profile.flow}</p>
                  </div>
                  <button onClick={fetchFollowers} className="text-center group transition-transform active:scale-95">
                    <p className="text-2xl font-display font-bold text-zenit-text-primary group-hover:text-zenit-accent transition-colors tracking-tighter">{socialStats.followers}</p>
                    <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold mt-1">{t.profile.followers}</p>
                  </button>
                  <button onClick={fetchFollowing} className="text-center group transition-transform active:scale-95">
                    <p className="text-2xl font-display font-bold text-zenit-text-primary group-hover:text-zenit-accent transition-colors tracking-tighter">{socialStats.following}</p>
                    <p className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold mt-1">{t.profile.following}</p>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 w-full max-w-sm pt-6">
                  {isOwnProfile ? (
                    <>
                      <button 
                        onClick={() => setView('edit-profile')}
                        className="flex-1 py-4 rounded-2xl bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/90 transition-all active:scale-[0.98]"
                      >
                        {t.profile.editProfile}
                      </button>
                      <button 
                        onClick={() => setView('preferences')}
                        className="p-4 rounded-2xl bg-[#1A1A1A] text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-[0.98]"
                      >
                        <Settings size={20} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={toggleFollow}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all active:scale-[0.98] ${
                        isFollowing 
                          ? 'bg-[#1A1A1A] text-zenit-text-tertiary' 
                          : 'bg-zenit-accent text-white hover:brightness-110'
                      }`}
                    >
                      {isFollowing ? t.profile.following : t.profile.follow}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Post Grid */}
            <div className="mt-12 bg-black/20">
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-4 text-zenit-accent">
                  <div className="w-1 h-1 rounded-full bg-zenit-accent animate-ping" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.5em]">{t.profile.personalFlow}</span>
                  <div className="w-1 h-1 rounded-full bg-zenit-accent animate-ping" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 px-1">
                {posts.map((post) => (
                  <motion.div 
                    key={post.id}
                    whileHover={{ opacity: 0.9, scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPost(post)}
                    className="aspect-square bg-[#1A1A1A] relative group cursor-pointer overflow-hidden"
                  >
                    {post.image_url ? (
                      <img src={post.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-[#1A1A1A] to-black">
                        <p className="text-[10px] text-zenit-text-tertiary text-center line-clamp-4 italic font-medium leading-relaxed opacity-60">"{post.caption || post.content}"</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-zenit-accent/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center space-x-6 backdrop-blur-[4px]">
                      <div className="flex flex-col items-center space-y-1 text-white">
                        <Heart size={20} fill="currentColor" />
                        <span className="text-[11px] font-bold">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex flex-col items-center space-y-1 text-white">
                        <MessageSquare size={20} fill="currentColor" className="opacity-80" />
                        <span className="text-[11px] font-bold">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {posts.length === 0 && (
                  <div className="col-span-3 py-32 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto bg-[#1A1A1A] relative group">
                      <Camera size={32} className="text-zenit-text-tertiary/20 group-hover:text-zenit-accent transition-colors" />
                      <div className="absolute inset-0 bg-zenit-accent/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] text-zenit-text-tertiary uppercase tracking-[0.5em] font-bold">{t.profile.emptyFlow}</p>
                      <p className="text-[10px] text-zenit-text-tertiary/40 uppercase tracking-[0.3em]">{t.profile.noTransmissions}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Post Detail Modal */}
            <AnimatePresence>
              {selectedPost && userData && (
                <PostDetailModal 
                  post={selectedPost} 
                  onClose={() => setSelectedPost(null)} 
                  userData={userData}
                  t={t}
                />
              )}
            </AnimatePresence>

            {isOwnProfile && (
              <div className="p-8 space-y-4 mt-12">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zenit-text-tertiary ml-2 mb-6">{t.profile.zenitSystems}</h3>
                <MenuButton 
                  icon={<Brain size={24} />} 
                  label={t.profile.mentalGym} 
                  sublabel={t.profile.cognitiveOptimization} 
                  onClick={() => setView('gym')} 
                />
                <MenuButton 
                  icon={<Book size={24} />} 
                  label={t.profile.neuralJournal} 
                  sublabel={t.profile.consciousnessRecord} 
                  onClick={() => setView('journal')} 
                />
                {userData?.is_admin && (
                  <MenuButton 
                    icon={<Shield size={24} />} 
                    label={t.admin.adminPanel} 
                    sublabel={t.admin.systemManagement} 
                    onClick={() => setActiveTab?.('admin')} 
                  />
                )}
                <MenuButton 
                  icon={<LogOut size={24} />} 
                  label={t.profile.disconnect} 
                  sublabel={t.profile.terminateInterface} 
                  onClick={handleLogout} 
                  danger
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zenit-black">
      {view !== 'main' && (
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            setView('main');
            setMessage(null);
          }}
          className="fixed top-8 left-8 z-[60] p-4 bg-zenit-surface-1 rounded-[20px] backdrop-blur-xl hover:bg-zenit-surface-2 transition-all group"
        >
          <ChevronRight size={20} className="rotate-180 text-zenit-text-tertiary group-hover:text-zenit-text-primary transition-colors" />
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
  <div className="rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 relative overflow-hidden group bg-zenit-surface-1">
    <div className="absolute inset-0 bg-gradient-to-br from-zenit-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className={`${color} opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>{icon}</div>
    <div className="text-center relative z-10">
      <p className="text-3xl font-display font-bold tracking-tighter text-zenit-text-primary leading-none">{value}</p>
      <p className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em] mt-2">{label}</p>
    </div>
    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-zenit-accent/5 rounded-full blur-xl group-hover:bg-zenit-accent/10 transition-all" />
  </div>
);

const MenuButton: React.FC<{ icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; danger?: boolean }> = ({ icon, label, sublabel, onClick, danger }) => (
  <motion.button
    whileHover={{ x: 8 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full p-6 flex items-center justify-between group transition-all relative overflow-hidden rounded-3xl bg-zenit-surface-1"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-zenit-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex items-center space-x-6 relative z-10">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
        danger 
          ? 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20' 
          : 'bg-black/40 text-zenit-text-tertiary group-hover:bg-zenit-accent group-hover:text-white'
      }`}>
        {icon}
      </div>
      <div className="text-left space-y-1">
        <p className={`text-base font-display font-bold uppercase tracking-tight ${danger ? 'text-red-500/90' : 'text-zenit-text-primary'}`}>{label}</p>
        <p className="text-[10px] text-zenit-text-tertiary font-bold uppercase tracking-[0.3em]">{sublabel}</p>
      </div>
    </div>
    <div className="relative z-10 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-zenit-accent group-hover:text-white transition-all">
      <ChevronRight size={18} className="transition-all translate-x-0 group-hover:translate-x-0.5" />
    </div>
  </motion.button>
);

const PostDetailModal: React.FC<{ post: any; onClose: () => void; userData: any; t: any }> = ({ post, onClose, userData, t }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:users (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: post.id,
          user_id: userData.id,
          content: newComment
        }])
        .select(`
          *,
          user:users (
            display_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      
      setComments([...comments, data]);
      setNewComment('');
      
      // Update comment count on post
      await supabase.rpc('increment_comments', { post_id: post.id });
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-[#0F0F0F] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Post Media */}
        <div className="md:w-[60%] bg-black flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-zenit-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          {post.image_url ? (
            <img src={post.image_url} className="w-full h-full object-contain relative z-10" referrerPolicy="no-referrer" />
          ) : (
            <div className="p-12 text-center w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A1A] to-black relative z-10">
              <p className="text-2xl font-display italic text-zenit-text-primary leading-relaxed max-w-md">"{post.caption || post.content}"</p>
            </div>
          )}
        </div>

        {/* Post Info & Comments */}
        <div className="md:w-[40%] flex flex-col bg-[#0F0F0F]">
          <div className="p-6 flex items-center justify-between bg-black/20 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-zenit-accent to-zenit-crimson">
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zenit-text-primary leading-none tracking-tight">{post.user?.display_name || t.profile.user}</span>
                <span className="text-[9px] text-zenit-text-tertiary uppercase tracking-[0.2em] font-bold mt-1">@{post.user?.username}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zenit-text-tertiary hover:text-zenit-text-primary transition-all active:scale-90">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide custom-scrollbar">
            {post.image_url && (post.caption || post.content) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-4 p-4 rounded-2xl bg-white/5"
              >
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <p className="text-xs text-zenit-text-primary leading-relaxed">
                    <span className="font-bold text-zenit-accent mr-2">@{post.user?.username}</span>
                    {post.caption || post.content}
                  </p>
                  <p className="text-[9px] text-zenit-text-tertiary font-bold uppercase tracking-[0.2em]">
                    {t.profile.originalPost}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="h-px w-full" />

            {loadingComments ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <Loader2 size={24} className="text-zenit-accent animate-spin relative z-10" />
                </div>
                <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.3em] font-bold">{t.profile.syncingFlow}</p>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment, idx) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex space-x-4 group"
                  >
                    <img 
                      src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username}`} 
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 flex-1">
                      <p className="text-xs text-zenit-text-secondary leading-relaxed">
                        <span className="font-bold text-zenit-text-primary mr-2 group-hover:text-zenit-accent transition-colors">@{comment.user?.username}</span>
                        {comment.content}
                      </p>
                      <p className="text-[8px] text-zenit-text-tertiary uppercase font-bold tracking-[0.2em] flex items-center space-x-3">
                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <button className="hover:text-zenit-accent transition-colors uppercase tracking-[0.2em]">{t.profile.reply}</button>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 space-y-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-white/5">
                  <MessageSquare size={24} className="text-zenit-text-tertiary/20" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-zenit-text-tertiary uppercase tracking-[0.4em] font-bold">{t.profile.silentFlow}</p>
                  <p className="text-[9px] text-zenit-text-tertiary/40 uppercase tracking-[0.2em]">{t.profile.expansion}</p>
                </div>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="p-6 bg-black/40 backdrop-blur-2xl relative">
            <div className="relative group">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.profile.addToFlow}
                className="w-full bg-[#1A1A1A] rounded-2xl py-4 pl-5 pr-14 text-xs focus:outline-none focus:bg-black/40 transition-all placeholder:text-zenit-text-tertiary/50 backdrop-blur-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <motion.button 
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-zenit-accent text-white flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
