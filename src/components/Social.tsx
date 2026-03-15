import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Heart, MessageSquare, Zap, UserPlus, UserCheck, Flame, TrendingUp, Sparkles, Share2, MoreHorizontal, X, Camera, ArrowUpRight } from 'lucide-react';
import { supabase } from '../supabase';
import { SocialPost, UserProfile, Follow, HotStreak, SocialComment } from '../types';

interface SocialProps {
  userData: UserProfile;
  t: any;
}

export const Social: React.FC<SocialProps> = ({ userData, t }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'profile'>('feed');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [hotStreaks, setHotStreaks] = useState<HotStreak[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;
    setIsPosting(true);
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        user_id: userData.id,
        content: newPostContent,
        image_url: newPostImage,
        likes_count: 0,
        comments_count: 0
      }])
      .select()
      .single();
    
    if (!error && data) {
      setPosts([data, ...posts]);
      setNewPostContent('');
      setNewPostImage(null);
    }
    setIsPosting(false);
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users (
            display_name,
            photo_url,
            xp,
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
        .ilike('display_name', `%${query}%`)
        .neq('id', userData.id)
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleBoost = async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, boosts: p.boosts + 1 } : p));
    
    try {
      const { error } = await supabase.rpc('increment_boosts', { post_id: postId });
      if (error) {
        // Fallback if RPC fails
        const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
        if (post) {
          await supabase.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', postId);
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
                  <img src={userData.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`} alt="Avatar" className="w-full h-full object-cover" />
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
                <PostCard key={post.id} post={post} onBoost={() => handleBoost(post.id)} t={t} currentUserId={userData.id} />
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
                  <UserCard key={user.id} user={user} t={t} />
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
            className="space-y-6"
          >
            <div className="glass-card p-6 border-white/5 bg-white/[0.01] flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full border-2 border-zenith-electric-blue/20 p-1">
                <img src={userData.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{userData.display_name}</h2>
                <p className="text-[10px] text-zenith-electric-blue font-bold uppercase tracking-widest">{userData.identity}</p>
              </div>
              <div className="flex space-x-8 pt-4 border-t border-white/5 w-full">
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-white">{posts.filter(p => p.user_id === userData.id).length}</p>
                  <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Posts</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-white">{userData.streak}</p>
                  <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Streak</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg font-bold text-white">{userData.level}</p>
                  <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">Level</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {posts.filter(p => p.user_id === userData.id).map((post) => (
                <PostCard key={post.id} post={post} onBoost={() => handleBoost(post.id)} t={t} currentUserId={userData.id} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PostCard: React.FC<{ post: any; onBoost: () => void; t: any; currentUserId: string }> = ({ post, onBoost, t, currentUserId }) => {
  const user = post.user || {};
  const date = new Date(post.created_at).toLocaleDateString();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('social_comments')
      .select(`
        *,
        user:users (
          display_name,
          photo_url
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
      .from('social_comments')
      .insert([{
        post_id: post.id,
        user_id: currentUserId,
        content: newComment
      }])
      .select(`
        *,
        user:users (
          display_name,
          photo_url
        )
      `)
      .single();
    
    if (!error && data) {
      setComments([...comments, data]);
      setNewComment('');
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
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <img src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{user.display_name || `User ${post.user_id.slice(0, 5)}`}</p>
            <div className="flex items-center space-x-2">
              <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">{date}</span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[8px] text-zenith-electric-blue uppercase font-bold tracking-widest">LVL {user.level || 1}</span>
            </div>
          </div>
        </div>
        <button className="text-white/20 hover:text-white/60 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <p className="text-sm text-white/80 leading-relaxed">{post.content}</p>

      {post.image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
          <img src={post.image_url} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      )}

      <div className="flex items-center space-x-6 pt-4 border-t border-white/5">
        <button 
          onClick={onBoost}
          className="flex items-center space-x-2 group/btn"
        >
          <div className="p-2 rounded-lg bg-zenith-scarlet/10 text-zenith-scarlet group-hover/btn:bg-zenith-scarlet/20 transition-all">
            <Zap size={14} className={post.boosts > 0 ? 'fill-current' : ''} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover/btn:text-zenith-scarlet transition-colors">
            {post.boosts || 0} Boosts
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
                      <img src={comment.user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 bg-white/5 rounded-xl p-3 space-y-1">
                      <p className="text-[10px] font-bold text-white/60">{comment.user?.display_name}</p>
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

const UserCard: React.FC<{ user: UserProfile; t: any }> = ({ user, t }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="glass-card p-4 flex items-center justify-between border-white/5 bg-white/[0.01]">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <img src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{user.display_name}</p>
          <div className="flex items-center space-x-2">
            <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">LVL {user.level}</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[8px] text-zenith-cyan uppercase font-bold tracking-widest">{user.identity}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsFollowing(!isFollowing)}
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
