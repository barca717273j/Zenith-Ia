import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Heart, MessageSquare, Zap, UserPlus, UserCheck, Flame, TrendingUp, Sparkles, Share2, MoreHorizontal, X, Camera, ArrowUpRight } from 'lucide-react';
import { supabase } from '../supabase';
import { SocialPost, UserProfile, Follow, HotStreak, SocialComment } from '../types';
import { Profile } from './Profile';
import { loadFeed } from '../services/feedService';
import { createPost } from '../services/postService';

interface SocialProps {
  userData: UserProfile;
  t: any;
  onUpdate: () => Promise<void> | void;
}

export const Social: React.FC<SocialProps> = ({ userData, t, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'profile'>('feed');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [hotStreaks, setHotStreaks] = useState<HotStreak[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFeed();
    fetchHotStreaks();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsPosting(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${userData.id}-${Math.random()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        setNewPostImage(publicUrl);
      } catch (err: any) {
        console.error('Error uploading image:', err);
        alert('Erro ao carregar imagem: ' + err.message);
      } finally {
        setIsPosting(false);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;
    setIsPosting(true);
    
    try {
      // Step 6: Ensure post creation uses real insert
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          user_id: userData.id,
          caption: newPostContent,
          image_url: newPostImage,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date()
        }])
        .select(`
          *,
          user:users (
            display_name,
            avatar_url,
            photo_url,
            xp,
            level,
            identity
          )
        `)
        .single();
      
      if (error) throw error;
      if (data) {
        setPosts([data, ...posts]);
        setNewPostContent('');
        setNewPostImage(null);
      }
    } catch (err: any) {
      console.error('Error creating post:', err);
      alert('Erro ao criar post: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // Step 4: Ensure fetchFeed actually calls Supabase
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users (
            display_name,
            avatar_url,
            photo_url,
            xp,
            level,
            identity
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotStreaks = async () => {
    try {
      const { data, error } = await supabase
        .from('hot_streaks')
        .select('*')
        .or(`user1_id.eq.${userData.id},user2_id.eq.${userData.id}`)
        .eq('status', 'active');
      
      if (error) throw error;
      setHotStreaks(data || []);
    } catch (err) {
      console.error('Error fetching streaks:', err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', userData.id)
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleBoost = async (postId: string, postUserId: string) => {
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userData.id)
        .eq('post_id', postId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase.from('likes').delete().eq('id', existingLike.id);
        await supabase.rpc('decrement_likes', { post_id: postId });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
      } else {
        // Like
        await supabase.from('likes').insert([{ user_id: userData.id, post_id: postId }]);
        await supabase.rpc('increment_likes', { post_id: postId });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));

        // Notification
        if (postUserId !== userData.id) {
          await supabase.from('notifications').insert([{
            user_id: postUserId,
            title: 'Novo Boost!',
            message: `${userData.username || userData.display_name} deu um boost no seu post.`,
            type: 'social'
          }]);
        }
      }
    } catch (err) {
      console.error('Boost error:', err);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-zenith-electric-blue/10 flex items-center justify-center text-zenith-electric-blue border border-zenith-electric-blue/20">
              <Users size={20} />
            </div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight">{t.social.title}</h1>
          </div>
          <div className="flex items-center space-x-2 bg-zenith-scarlet/10 px-3 py-1.5 rounded-full border border-zenith-scarlet/20">
            <Flame size={14} className="text-zenith-scarlet" />
            <span className="text-[10px] font-bold text-zenith-scarlet uppercase tracking-widest">{hotStreaks.length} HOT</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          {(['feed', 'discover', 'profile'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.social[tab]}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Create Post */}
            <div className="glass-card p-6 border-white/5 bg-white/[0.01] space-y-6">
              <div className="flex space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                  <img src={userData.avatar_url || userData.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <textarea
                    placeholder={t.social.whatsOnYourMind || "O que você conquistou hoje?"}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-transparent border-none text-lg font-medium focus:outline-none placeholder:text-white/10 resize-none min-h-[100px]"
                  />
                  
                  {newPostImage && (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video group">
                      <img src={newPostImage} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setNewPostImage(null)}
                        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-all backdrop-blur-md"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Camera size={20} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={isPosting || (!newPostContent.trim() && !newPostImage)}
                      className="bg-zenith-electric-blue text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,112,243,0.3)] hover:shadow-[0_0_30px_rgba(0,112,243,0.5)]"
                    >
                      {isPosting ? t.common.loading : t.social.post || "Publicar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-zenith-electric-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                  <Share2 size={24} className="text-white/20" />
                </div>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{t.social.noPosts}</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onBoost={() => handleBoost(post.id, post.user_id)} 
                  onViewProfile={() => {
                    setSelectedUserId(post.user_id);
                    setActiveTab('profile');
                  }}
                  t={t} 
                  currentUserId={userData.id} 
                  currentUserData={userData} 
                />
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                placeholder={t.social.search}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-zenith-electric-blue transition-colors"
              />
            </div>

            <div className="space-y-4">
              {searchResults.length === 0 && searchQuery.length >= 2 ? (
                <p className="text-center text-white/20 text-[10px] font-bold uppercase tracking-widest py-10">Nenhum usuário encontrado</p>
              ) : (
                searchResults.map((user) => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    t={t} 
                    currentUserId={userData.id} 
                    currentUserData={userData} 
                    onViewProfile={() => {
                      setSelectedUserId(user.id);
                      setActiveTab('profile');
                    }}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Profile 
              userData={userData} 
              t={t} 
              onUpdate={onUpdate} 
              targetUserId={selectedUserId || userData.id} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PostCard: React.FC<{ post: any; onBoost: () => void; onViewProfile: () => void; t: any; currentUserId: string; currentUserData: any }> = ({ post, onBoost, onViewProfile, t, currentUserId, currentUserData }) => {
  const user = post.user || {};
  const date = new Date(post.created_at).toLocaleDateString();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [post.id, currentUserId]);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('post_id', post.id)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users (
          display_name,
          username,
          full_name,
          photo_url,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (!error) setComments(data || []);
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        post_id: post.id,
        user_id: currentUserId,
        content: newComment
      }])
      .select(`
        *,
        user:users (
          display_name,
          username,
          full_name,
          photo_url,
          avatar_url
        )
      `)
      .single();
    
    if (!error && data) {
      setComments([...comments, data]);
      setNewComment('');
      
      // Increment comments_count in posts table
      await supabase.rpc('increment_comments', { post_id: post.id });

      // Notification
      if (post.user_id !== currentUserId) {
        await supabase.from('notifications').insert([{
          user_id: post.user_id,
          title: 'Novo Comentário!',
          message: `${currentUserData.username || currentUserData.display_name} comentou no seu post.`,
          type: 'social'
        }]);
      }
    }
  };

  useEffect(() => {
    if (showComments) fetchComments();
  }, [showComments]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 space-y-4 border-white/5 bg-white/[0.01] relative overflow-hidden group"
    >
      <div className="flex items-center justify-between">
        <button onClick={onViewProfile} className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <img src={user.avatar_url || user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {user.username || user.display_name || `User ${post.user_id.slice(0, 5)}`}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">{date}</span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[8px] text-zenith-electric-blue uppercase font-bold tracking-widest">LVL {user.level || 1}</span>
            </div>
          </div>
        </button>
        <button className="text-white/20 hover:text-white/60 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <p className="text-sm text-white/80 leading-relaxed">{post.caption}</p>

      {post.image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      )}

      <div className="flex items-center space-x-6 pt-4 border-t border-white/5">
        <button 
          onClick={() => {
            onBoost();
            setIsLiked(!isLiked);
          }}
          className="flex items-center space-x-2 group/btn"
        >
          <div className={`p-2 rounded-lg transition-all ${isLiked ? 'bg-zenith-scarlet/20 text-zenith-scarlet shadow-[0_0_15px_rgba(255,36,0,0.3)]' : 'bg-zenith-scarlet/10 text-zenith-scarlet group-hover/btn:bg-zenith-scarlet/20'}`}>
            <Zap size={14} className={isLiked ? 'fill-current' : ''} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isLiked ? 'text-zenith-scarlet' : 'text-white/40 group-hover/btn:text-zenith-scarlet'}`}>
            {post.likes_count || 0} Boosts
          </span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 group/btn"
        >
          <div className={`p-2 rounded-lg transition-all ${showComments ? 'bg-zenith-electric-blue/10 text-zenith-electric-blue' : 'bg-white/5 text-white/40 group-hover/btn:bg-white/10 group-hover/btn:text-white'}`}>
            <MessageSquare size={14} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${showComments ? 'text-zenith-electric-blue' : 'text-white/40 group-hover/btn:text-white'}`}>
            {comments.length || post.comments_count || 0} {t.social.comments || "Comentários"}
          </span>
        </button>

        <button className="flex items-center space-x-2 group/btn">
          <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover/btn:bg-white/10 group-hover/btn:text-white transition-all">
            <Share2 size={14} />
          </div>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pt-4 space-y-4"
          >
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <div className="w-4 h-4 border border-zenith-electric-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[10px] text-white/20 text-center py-2 uppercase font-bold tracking-widest">Seja o primeiro a comentar</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                      <img src={comment.user?.avatar_url || comment.user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-xl p-3 space-y-1">
                      <p className="text-[10px] font-bold text-white/60">
                        {comment.user?.username || comment.user?.display_name}
                      </p>
                      <p className="text-xs text-white/80">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs focus:outline-none focus:border-zenith-electric-blue transition-colors"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="p-2 bg-zenith-electric-blue text-white rounded-xl disabled:opacity-50 transition-all"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const UserCard: React.FC<{ user: UserProfile; t: any; currentUserId: string; currentUserData: any; onViewProfile: () => void }> = ({ user, t, currentUserId, currentUserData, onViewProfile }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [user.id, currentUserId]);

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('followers')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', user.id)
      .maybeSingle();
    
    if (data) setIsFollowing(true);
  };

  const toggleFollow = async () => {
    if (isFollowing) {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', user.id);
      
      if (!error) setIsFollowing(false);
    } else {
      const { error } = await supabase
        .from('followers')
        .insert([{ follower_id: currentUserId, following_id: user.id }]);
      
      if (!error) {
        setIsFollowing(true);
        // Notification
        await supabase.from('notifications').insert([{
          user_id: user.id,
          title: 'Novo Seguidor!',
          message: `${currentUserData.username || currentUserData.display_name} começou a seguir você.`,
          type: 'social'
        }]);
      }
    }
  };

  return (
    <div className="glass-card p-4 flex items-center justify-between border-white/5 bg-white/[0.01]">
      <button onClick={onViewProfile} className="flex items-center space-x-4 text-left">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <img src={user.avatar_url || user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{user.username || user.display_name}</p>
          <div className="flex items-center space-x-2">
            <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">LVL {user.level}</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[8px] text-zenith-cyan uppercase font-bold tracking-widest">{user.identity}</span>
          </div>
        </div>
      </button>
      <button
        onClick={toggleFollow}
        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
          isFollowing 
            ? 'bg-white/5 text-white/60 border border-white/10' 
            : 'bg-zenith-electric-blue text-white shadow-[0_0_15px_rgba(0,112,243,0.3)]'
        }`}
      >
        {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
      </button>
    </div>
  );
};
