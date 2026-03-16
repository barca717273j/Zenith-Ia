import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, CreditCard, Brain, LogOut, ChevronRight, Book, User, Award, Zap, Target, Flame, Sparkles, Shield, Camera, Mail, Lock, Globe, Save, AlertCircle, Timer, Grid, Heart, MessageSquare } from 'lucide-react';
import { Subscription } from './Subscription';
import { TetrisGame } from './TetrisGame';
import { Journal } from './Journal';
import { useGamification } from './GamificationContext';
import { supabase } from '../supabase';
import { uploadAvatar } from '../services/profileService';

interface ProfileProps {
  userData: any;
  t: any;
  onUpdate: () => Promise<void> | void;
  targetUserId?: string;
}

type ProfileView = 'main' | 'subscription' | 'gym' | 'journal' | 'edit-profile' | 'security' | 'preferences' | 'followers' | 'following';

export const Profile: React.FC<ProfileProps> = ({ userData, t, onUpdate, targetUserId }) => {
  const [view, setView] = useState<ProfileView>('main');
  const [clickCount, setClickCount] = useState(0);
  const { level, levelName, xp, streak } = useGamification();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followList, setFollowList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      .select('*')
      .eq('user_id', currentProfileId)
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', userData.id)
      .eq('following_id', currentProfileId)
      .single();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
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
      await uploadAvatar(file);
      
      // We need to get the new URL to update the local state
      // Since the service doesn't return it, we'll fetch it from the user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('avatar_url').eq('id', user.id).single();
        if (data?.avatar_url) setEditPhoto(data.avatar_url);
      }

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
          full_name: editName,
          display_name: editName,
          username: editUsername,
          bio: editBio,
          avatar_url: editPhoto,
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
                    <img src={editPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.id}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
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

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Globe size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Username</label>
                  </div>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 ml-1">
                    <Book size={12} className="text-zenith-scarlet" />
                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Bio</label>
                  </div>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-zenith-scarlet transition-all min-h-[100px] resize-none"
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
      case 'followers':
      case 'following':
        return (
          <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="flex items-center space-x-4">
              <button onClick={() => setView('main')} className="p-2 rounded-xl bg-white/5 text-white/40">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {view === 'followers' ? t.social.followers : t.social.following}
              </h2>
            </header>
            <div className="space-y-4">
              {followList.map((user) => (
                <div key={user.id} className="glass-card p-4 flex items-center justify-between border-white/5 bg-white/[0.02]">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar_url || user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold text-white">{user.display_name}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">@{user.username || 'user'}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    Ver Perfil
                  </button>
                </div>
              ))}
              {followList.length === 0 && (
                <div className="text-center py-20 text-white/20 uppercase text-[10px] font-bold tracking-widest">
                  Lista vazia
                </div>
              )}
            </div>
          </div>
        );
      default:
        if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-zenith-scarlet border-t-transparent rounded-full animate-spin" /></div>;
        return (
          <div className="p-6 space-y-10 pb-32 max-w-2xl mx-auto min-h-screen">
            <header className="flex flex-col items-center text-center space-y-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-zenith-scarlet via-zenith-crimson to-zenith-scarlet rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="relative w-40 h-40 rounded-full border-2 border-white/5 p-1.5 bg-white/[0.02] backdrop-blur-xl">
                  <div className="w-full h-full rounded-full bg-zenith-black flex items-center justify-center overflow-hidden border border-white/10">
                    {(targetUser?.avatar_url || targetUser?.photo_url) ? (
                      <img src={targetUser.avatar_url || targetUser.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser?.id}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  
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
              
              <div className="space-y-4 w-full">
                <div className="space-y-1">
                  <h1 className="text-4xl font-display font-bold tracking-tighter uppercase leading-none text-white">
                    {targetUser?.full_name || targetUser?.display_name || 'Zenith User'}
                  </h1>
                  <p className="text-sm text-white/40 font-medium">@{targetUser?.username || 'zenith_user'}</p>
                </div>
                
                {targetUser?.bio && (
                  <p className="text-sm text-white/60 max-w-xs mx-auto leading-relaxed">
                    {targetUser.bio}
                  </p>
                )}

                <div className="flex items-center justify-center space-x-8 py-4 border-y border-white/5">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{socialStats.posts}</p>
                    <p className="text-[8px] text-white/30 uppercase font-bold tracking-[0.2em]">Publicações</p>
                  </div>
                  <button onClick={fetchFollowers} className="text-center group">
                    <p className="text-xl font-bold text-white group-hover:text-zenith-scarlet transition-colors">{socialStats.followers}</p>
                    <p className="text-[8px] text-white/30 uppercase font-bold tracking-[0.2em]">{t.social.followers}</p>
                  </button>
                  <button onClick={fetchFollowing} className="text-center group">
                    <p className="text-xl font-bold text-white group-hover:text-zenith-scarlet transition-colors">{socialStats.following}</p>
                    <p className="text-[8px] text-white/30 uppercase font-bold tracking-[0.2em]">{t.social.following}</p>
                  </button>
                </div>

                <div className="flex space-x-3">
                  {isOwnProfile ? (
                    <button 
                      onClick={() => setView('edit-profile')}
                      className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                    >
                      Editar Perfil
                    </button>
                  ) : (
                    <button 
                      onClick={toggleFollow}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                        isFollowing 
                          ? 'bg-white/5 border border-white/10 text-white/60' 
                          : 'bg-zenith-scarlet text-white shadow-lg shadow-zenith-scarlet/20'
                      }`}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>
                  )}
                  {isOwnProfile && (
                    <button onClick={() => setView('preferences')} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40">
                      <Settings size={18} />
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Post Grid */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 ml-1">
                <Grid size={14} className="text-zenith-scarlet" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Publicações</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {posts.map((post) => (
                  <motion.div 
                    key={post.id}
                    whileHover={{ scale: 0.98 }}
                    className="aspect-square bg-white/5 border border-white/5 overflow-hidden relative group cursor-pointer rounded-lg"
                  >
                    {post.image_url ? (
                      <img src={post.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <p className="text-[8px] text-white/20 text-center line-clamp-3">{post.content}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                      <div className="flex items-center space-x-1 text-white">
                        <Heart size={14} fill="currentColor" />
                        <span className="text-xs font-bold">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-white">
                        <MessageSquare size={14} fill="currentColor" />
                        <span className="text-xs font-bold">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {posts.length === 0 && (
                  <div className="col-span-3 py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Nenhuma publicação ainda</p>
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <div className="space-y-4 pt-12 border-t border-white/5">
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
                <MenuButton 
                  icon={<LogOut size={20} />} 
                  label={t.profile.signOut} 
                  sublabel="Encerrar sessão com segurança" 
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
