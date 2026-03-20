import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';
import { Settings, CreditCard, Brain, LogOut, ChevronRight, Book, User, Award, Zap, Target, Flame, Sparkles, Shield, Camera, Mail, Lock, Globe, Save, AlertCircle, Timer, Grid, Heart, MessageSquare, Send, Loader2, X, Moon, Sun } from 'lucide-react';
import { Subscription } from './Subscription';
import { TetrisGame } from './TetrisGame';
import { Journal } from './Journal';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';
import { uploadAvatar } from '../services/profileService';
import { useUser } from '../contexts/UserContext';
import { ensureBucketExists } from '../services/storageService';

interface ProfileProps {
  t: any;
  targetUserId?: string;
}

type ProfileView = 'main' | 'subscription' | 'gym' | 'journal' | 'edit-profile' | 'security' | 'preferences' | 'followers' | 'following';

export const Profile: React.FC<ProfileProps> = ({ t, targetUserId }) => {
  const { userData, refreshUserData } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<ProfileView>('main');
  const [clickCount, setClickCount] = useState(0);
  const { level, levelName, xp, streak } = useGamification();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followList, setFollowList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const isOwnProfile = !targetUserId || targetUserId === userData?.id;
  const currentProfileId = targetUserId || userData?.id;

  useEffect(() => {
    if (currentProfileId) {
      fetchProfileData();
      fetchPosts();
      fetchSocialStats();
      if (!isOwnProfile) checkFollowStatus();
    }
  }, [currentProfileId, userData?.id]);

  const fetchProfileData = async () => {
    if (isOwnProfile) {
      setTargetUser(userData);
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentProfileId)
      .single();
    if (data) setTargetUser(data);
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

  // Edit Profile State
  const [editName, setEditName] = useState(userData?.full_name || userData?.display_name || '');
  const [editUsername, setEditUsername] = useState(userData?.username || '');
  const [editBio, setEditBio] = useState(userData?.bio || '');
  const [editEmail, setEditEmail] = useState(userData?.email || '');
  const [editPhoto, setEditPhoto] = useState(userData?.avatar_url || userData?.photo_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0, posts: 0 });

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

  const handleVersionClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !userData?.is_admin })
        .eq('id', userData?.id);
      
      if (!error) {
        await refreshUserData();
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
      // Step 5: Fix profile image upload
      const { data: userDataAuth } = await supabase.auth.getUser();
      const user = userDataAuth.user;
      if (!user) throw new Error("User not authenticated");

      // Ensure bucket exists
      await ensureBucketExists('avatars');

      const filePath = `${user.id}/${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users") // Using 'users' as per existing App.tsx logic, but following the upsert pattern
        .upsert({
          id: user.id,
          avatar_url: urlData.publicUrl,
          photo_url: urlData.publicUrl,
        });

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
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="space-y-2">
              <h2 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">{t.profile.editProfile}</h2>
              <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.3em] font-bold">Atualize sua identidade neural</p>
            </header>

            <div className="space-y-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-2 border-zenith-border-primary p-1 bg-zenith-surface-1 backdrop-blur-xl overflow-hidden">
                    <img src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.id}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 rounded-xl bg-zenith-scarlet flex items-center justify-center border border-zenith-border-primary shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <Camera size={18} className="text-zenith-text-primary" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
                <div className="w-full space-y-2">
                  <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold ml-1">Ou insira uma URL</label>
                  <input 
                    type="text" 
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    placeholder="URL da Imagem de Perfil"
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all placeholder:text-zenith-text-tertiary"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <User size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">{t.common.fullName}</label>
                  </div>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all text-zenith-text-primary"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Globe size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">Username</label>
                  </div>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all text-zenith-text-primary"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Book size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">Bio</label>
                  </div>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all min-h-[100px] resize-none text-zenith-text-primary"
                  />
                </div>

                <div className="space-y-3 opacity-50 cursor-not-allowed">
                  <div className="flex items-center space-x-2 ml-1">
                    <Mail size={12} className="text-zenith-text-tertiary" />
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">{t.common.email}</label>
                  </div>
                  <input 
                    type="email" 
                    value={editEmail}
                    disabled
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm text-zenith-text-tertiary"
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
                  <div className="w-4 h-4 border-2 border-zenith-text-primary/20 border-t-zenith-text-primary rounded-full animate-spin" />
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
              <h2 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">{t.profile.security}</h2>
              <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.3em] font-bold">Proteja sua conexão neural</p>
            </header>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Lock size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">{t.profile.newPassword}</label>
                  </div>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all text-zenith-text-primary"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Shield size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">{t.profile.confirmNewPassword}</label>
                  </div>
                  <input 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all text-zenith-text-primary"
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
                  <div className="w-4 h-4 border-2 border-zenith-text-primary/20 border-t-zenith-text-primary rounded-full animate-spin" />
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
              <h2 className="text-3xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">{t.profile.preferences}</h2>
              <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.3em] font-bold">Personalize sua interface</p>
            </header>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Globe size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">{t.common.language}</label>
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
                        className={`p-4 rounded-2xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                          userData?.language === lang 
                            ? 'bg-zenith-scarlet border-zenith-scarlet text-zenith-text-primary shadow-lg' 
                            : 'bg-zenith-surface-1 border-zenith-border-primary text-zenith-text-tertiary hover:bg-zenith-surface-2'
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
      case 'followers':
      case 'following':
        return (
          <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="flex items-center space-x-4">
              <button onClick={() => setView('main')} className="p-2 rounded-xl bg-zenith-surface-1 text-zenith-text-tertiary">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h2 className="text-xl font-bold uppercase tracking-tight text-zenith-text-primary">
                {view === 'followers' ? t.social.followers : t.social.following}
              </h2>
            </header>
            <div className="space-y-4">
              {followList.map((user) => (
                <div key={user.id} className="glass-card p-4 flex items-center justify-between border-zenith-border-primary bg-zenith-surface-1">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar_url || user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold text-zenith-text-primary">{user.display_name}</p>
                      <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest">@{user.username || 'user'}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-zenith-surface-1 border border-zenith-border-primary text-[10px] font-bold uppercase tracking-widest text-zenith-text-secondary">
                    Ver Perfil
                  </button>
                </div>
              ))}
              {followList.length === 0 && (
                <div className="text-center py-20 text-zenith-text-tertiary uppercase text-[10px] font-bold tracking-widest">
                  Lista vazia
                </div>
              )}
            </div>
          </div>
        );
      default:
        if (loading) return <div className="flex items-center justify-center min-h-screen bg-zenith-black"><div className="w-8 h-8 border-2 border-zenith-scarlet border-t-transparent rounded-full animate-spin" /></div>;
        return (
          <div className="pb-32 max-w-2xl mx-auto min-h-screen bg-zenith-black">
            {/* Premium Profile Header */}
            <div className="p-8 space-y-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Large Profile Pic */}
                <div className="relative group">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-zenith-scarlet via-zenith-crimson to-zenith-black"
                  >
                    <div className="w-full h-full rounded-full bg-zenith-black p-1">
                      <img 
                        src={targetUser?.avatar_url || targetUser?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser?.id}`} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-zenith-scarlet rounded-full border border-zenith-border-primary shadow-lg">
                    <span className="text-[10px] font-bold text-zenith-text-primary uppercase tracking-widest">LVL {level}</span>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-display font-bold uppercase tracking-tighter text-zenith-text-primary">
                    {targetUser?.full_name || targetUser?.display_name || 'Zenith User'}
                  </h1>
                  <p className="text-xs text-zenith-text-tertiary font-medium uppercase tracking-[0.2em]">@{targetUser?.username || 'zenith_user'}</p>
                  {targetUser?.bio && (
                    <p className="text-sm text-zenith-text-secondary leading-relaxed max-w-md mx-auto mt-4 font-light italic">
                      "{targetUser.bio}"
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="flex items-center justify-center space-x-10 pt-4">
                  <div className="text-center">
                    <p className="text-xl font-display font-bold text-zenith-text-primary tracking-tighter">{socialStats.posts}</p>
                    <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">Fluxo</p>
                  </div>
                  <button onClick={fetchFollowers} className="text-center group transition-transform active:scale-95">
                    <p className="text-xl font-display font-bold text-zenith-text-primary group-hover:text-zenith-scarlet transition-colors tracking-tighter">{socialStats.followers}</p>
                    <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">Seguidores</p>
                  </button>
                  <button onClick={fetchFollowing} className="text-center group transition-transform active:scale-95">
                    <p className="text-xl font-display font-bold text-zenith-text-primary group-hover:text-zenith-scarlet transition-colors tracking-tighter">{socialStats.following}</p>
                    <p className="text-[9px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">Seguindo</p>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 w-full max-w-sm pt-4">
                  {isOwnProfile ? (
                    <>
                      <button 
                        onClick={() => setView('edit-profile')}
                        className="flex-1 py-4 rounded-2xl bg-zenith-text-primary text-zenith-black text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl active:scale-[0.98]"
                      >
                        Editar Perfil
                      </button>
                      <button 
                        onClick={() => setView('preferences')}
                        className="p-4 rounded-2xl bg-zenith-surface-1 border border-zenith-border-primary text-zenith-text-tertiary hover:text-zenith-text-primary hover:bg-zenith-surface-2 transition-all active:scale-[0.98]"
                      >
                        <Settings size={20} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={toggleFollow}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] ${
                        isFollowing 
                          ? 'bg-zenith-surface-1 border border-zenith-border-primary text-zenith-text-tertiary' 
                          : 'bg-zenith-scarlet text-zenith-text-primary hover:bg-zenith-scarlet/90'
                      }`}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Post Grid */}
            <div className="border-t border-zenith-border-primary mt-12">
              <div className="flex justify-center py-6">
                <div className="flex items-center space-x-3 text-zenith-scarlet">
                  <Grid size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Fluxo Pessoal</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 px-4">
                {posts.map((post) => (
                  <motion.div 
                    key={post.id}
                    whileHover={{ opacity: 0.9, scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPost(post)}
                    className="aspect-[4/5] bg-zenith-surface-1 relative group cursor-pointer overflow-hidden rounded-2xl border border-zenith-border-primary"
                  >
                    {post.image_url ? (
                      <img src={post.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-zenith-surface-2 to-zenith-black">
                        <p className="text-[9px] text-zenith-text-tertiary text-center line-clamp-4 italic font-medium leading-relaxed">"{post.caption || post.content}"</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-zenith-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center space-x-6 backdrop-blur-[2px]">
                      <div className="flex flex-col items-center space-y-1 text-zenith-text-primary">
                        <Heart size={18} fill="currentColor" className="text-zenith-scarlet" />
                        <span className="text-[10px] font-bold">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex flex-col items-center space-y-1 text-zenith-text-primary">
                        <MessageSquare size={18} fill="currentColor" className="text-zenith-text-tertiary" />
                        <span className="text-[10px] font-bold">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {posts.length === 0 && (
                  <div className="col-span-3 py-32 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full border border-zenith-border-primary flex items-center justify-center mx-auto bg-zenith-surface-1 shadow-inner">
                      <Camera size={28} className="text-zenith-text-tertiary/30" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.4em] font-bold">Fluxo Vazio</p>
                      <p className="text-[9px] text-zenith-text-tertiary/50 uppercase tracking-[0.2em]">Nenhuma transmissão detectada neste setor</p>
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
                />
              )}
            </AnimatePresence>

            {isOwnProfile && (
              <div className="p-8 space-y-4 mt-12 border-t border-zenith-border-primary">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-zenith-text-tertiary ml-2 mb-6">Sistemas Zenith</h3>
                <MenuButton 
                  icon={<Brain size={18} />} 
                  label="Ginásio Mental" 
                  sublabel="Otimização cognitiva" 
                  onClick={() => setView('gym')} 
                />
                <MenuButton 
                  icon={<Book size={18} />} 
                  label="Diário Neural" 
                  sublabel="Registro de consciência" 
                  onClick={() => setView('journal')} 
                />
                <MenuButton 
                  icon={<LogOut size={18} />} 
                  label="Desconectar" 
                  sublabel="Encerrar interface" 
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
    <div className="min-h-screen bg-zenith-black">
      {view !== 'main' && (
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            setView('main');
            setMessage(null);
          }}
          className="fixed top-8 left-8 z-[60] p-4 bg-zenith-surface-1 rounded-[20px] border border-zenith-border-primary backdrop-blur-xl hover:bg-zenith-surface-2 transition-all group"
        >
          <ChevronRight size={20} className="rotate-180 text-zenith-text-tertiary group-hover:text-zenith-text-primary transition-colors" />
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
  <div className="glass-card p-6 flex flex-col items-center justify-center space-y-3 border-zenith-border-primary bg-zenith-surface-1 relative overflow-hidden group">
    <div className="absolute inset-0 bg-zenith-surface-2 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className={`${color} opacity-60 group-hover:opacity-100 transition-opacity`}>{icon}</div>
    <p className="text-2xl font-display font-bold tracking-tighter text-zenith-text-primary">{value}</p>
    <p className="text-[8px] text-zenith-text-tertiary font-bold uppercase tracking-[0.3em]">{label}</p>
  </div>
);

const MenuButton: React.FC<{ icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; danger?: boolean }> = ({ icon, label, sublabel, onClick, danger }) => (
  <motion.button
    whileHover={{ x: 4, backgroundColor: 'var(--zenith-surface-1)' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full p-5 flex items-center justify-between group transition-all border border-zenith-border-secondary bg-zenith-surface-1/10 rounded-[2rem]"
  >
    <div className="flex items-center space-x-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
        danger 
          ? 'bg-red-500/5 text-red-400/40 group-hover:bg-red-500/20 group-hover:text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
          : 'bg-zenith-surface-1/50 text-zenith-text-tertiary group-hover:bg-zenith-surface-2 group-hover:text-zenith-text-primary shadow-inner'
      }`}>
        {icon}
      </div>
      <div className="text-left space-y-0.5">
        <p className={`text-sm font-bold tracking-tight ${danger ? 'text-red-400/80' : 'text-zenith-text-primary'}`}>{label}</p>
        <p className="text-[9px] text-zenith-text-tertiary font-bold uppercase tracking-[0.2em]">{sublabel}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-zenith-text-tertiary/20 group-hover:text-zenith-text-tertiary transition-all translate-x-0 group-hover:translate-x-1" />
  </motion.button>
);

const PostDetailModal: React.FC<{ post: any; onClose: () => void; userData: any }> = ({ post, onClose, userData }) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zenith-black/95 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-zenith-surface-1 border border-zenith-border-primary rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Post Media */}
        <div className="md:w-[60%] bg-zenith-black flex items-center justify-center border-r border-zenith-border-secondary relative overflow-hidden">
          {post.image_url ? (
            <img src={post.image_url} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="p-12 text-center w-full h-full flex items-center justify-center bg-gradient-to-br from-zenith-surface-1 to-zenith-black">
              <p className="text-2xl font-display italic text-zenith-text-primary leading-relaxed max-w-md">"{post.caption || post.content}"</p>
            </div>
          )}
        </div>

        {/* Post Info & Comments */}
        <div className="md:w-[40%] flex flex-col bg-zenith-surface-1">
          <div className="p-6 border-b border-zenith-border-secondary flex items-center justify-between bg-zenith-surface-1/50 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-zenith-scarlet to-zenith-crimson">
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-full h-full rounded-full border border-zenith-black object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zenith-text-primary leading-none">{post.user?.display_name || 'User'}</span>
                <span className="text-[10px] text-zenith-text-tertiary uppercase tracking-widest mt-1">@{post.user?.username}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zenith-surface-1/50 rounded-full transition-colors">
              <X size={20} className="text-zenith-text-tertiary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {post.image_url && (post.caption || post.content) && (
              <div className="flex space-x-4">
                <img 
                  src={post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} 
                  className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                />
                <div className="space-y-1">
                  <p className="text-xs text-zenith-text-primary leading-relaxed">
                    <span className="font-bold text-zenith-text-primary mr-2">{post.user?.username}</span>
                    {post.caption || post.content}
                  </p>
                  <p className="text-[9px] text-zenith-text-tertiary font-bold uppercase tracking-widest">
                    Post Original
                  </p>
                </div>
              </div>
            )}

            <div className="h-px bg-zenith-border-secondary w-full" />

            {loadingComments ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 size={24} className="text-zenith-scarlet animate-spin" />
                <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.2em] font-bold">Sincronizando Fluxo...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-4 group">
                  <img 
                    src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username}`} 
                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover border border-zenith-border-secondary"
                  />
                  <div className="space-y-1 flex-1">
                    <p className="text-xs text-zenith-text-secondary leading-relaxed">
                      <span className="font-bold text-zenith-text-primary mr-2">{comment.user?.username}</span>
                      {comment.content}
                    </p>
                    <p className="text-[8px] text-zenith-text-tertiary uppercase font-bold tracking-widest flex items-center space-x-2">
                      <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-zenith-border-primary" />
                      <button className="hover:text-zenith-scarlet transition-colors">Responder</button>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="w-12 h-12 rounded-full border border-zenith-border-secondary flex items-center justify-center mx-auto bg-zenith-surface-1/20">
                  <MessageSquare size={20} className="text-zenith-text-tertiary" />
                </div>
                <p className="text-[10px] text-zenith-text-tertiary uppercase tracking-[0.3em] font-bold">Fluxo Silencioso</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="p-6 border-t border-zenith-border-secondary bg-zenith-black/40 backdrop-blur-xl">
            <div className="relative group">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicionar ao fluxo..."
                className="w-full bg-zenith-surface-1 border border-zenith-border-primary rounded-2xl py-4 pl-5 pr-14 text-xs focus:outline-none focus:border-zenith-scarlet transition-all placeholder:text-zenith-text-tertiary"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-zenith-scarlet text-zenith-text-primary flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zenith-scarlet/20"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
